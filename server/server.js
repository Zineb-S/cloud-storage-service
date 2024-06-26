const express = require('express');
const cors = require('cors');
const formidable = require('formidable');
const { S3 } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { Upload } = require('@aws-sdk/lib-storage');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Lambda } = require('aws-sdk');
const lambda = new Lambda({ region: 'us-east-1' });
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;

const allowedOrigins = ['https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8081'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Use CORS middleware globally
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add a middleware to log all requests
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

const s3 = new S3({ region: 'us-east-1' });
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

const DEFAULT_MAX_STORAGE = 500 * 1024 * 1024; // 500 MB for now

const saveFileMetadata = async (username, key, location, fileSize, fileType) => {
    const fileID = Date.now() + Math.floor(Math.random() * 1000);
    const params = {
        TableName: 'bexcloud',
        Item: {
            fileID: { N: fileID.toString() },
            username: { S: username },
            FilePath: { S: key },
            Location: { S: location },
            FileSize: { N: fileSize.toString() },
            FileType: { S: fileType },
            CreatedAt: { S: new Date().toISOString() }
        }
    };
    try {
        console.log('Saving file metadata:', params);
        await dynamoDbClient.send(new PutItemCommand(params));
        console.log('File metadata saved successfully');
    } catch (error) {
        console.error('Failed to save file metadata:', error);
        throw error;
    }
};
const invokeLambda = async (username, fileSize, operation) => {
    const params = {
        FunctionName: 'UpdateUserStorage', // Replace with your Lambda function name
        InvocationType: 'Event',
        Payload: JSON.stringify({ username, fileSize, operation })
    };

    try {
        await lambda.invoke(params).promise();
    } catch (error) {
        console.error('Error invoking Lambda function:', error);
    }
};

app.get('/files', async (req, res) => {
    const { username } = req.query;
    console.log('Fetching files for user:', username);

    const params = {
        TableName: 'bexcloud',
        IndexName: 'UsernameIndex',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': { S: username }
        }
    };

    try {
        const data = await dynamoDbClient.send(new QueryCommand(params));
        console.log('Files fetched successfully:', data.Items);

        // Calculate total storage used
        const totalStorageUsed = data.Items.reduce((acc, item) => acc + parseInt(item.FileSize.N, 10), 0);

        res.status(200).json({ files: data.Items, totalStorageUsed, maxStorage: DEFAULT_MAX_STORAGE });
    } catch (error) {
        console.error('Failed to fetch user files:', error);
        res.status(500).send('Failed to fetch user files.');
    }
});


app.post('/upload', (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form data:', err);
            return res.status(500).json({ error: 'Error parsing form data' });
        }

        const username = Array.isArray(fields.username) ? fields.username[0] : fields.username || 'current user';
        let folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
        if (!folder || folder.trim() === '') {
            folder = username; // Use username or a default value
        }

        const fileArray = files.file;
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        if (!file) {
            console.error('No file provided');
            return res.status(400).json({ error: 'File is not provided' });
        }

        const params = {
            TableName: 'bexcloud',
            IndexName: 'UsernameIndex',
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': { S: username }
            }
        };

        try {
            const data = await dynamoDbClient.send(new QueryCommand(params));
            const totalStorageUsed = data.Items.reduce((acc, item) => acc + parseInt(item.FileSize.N, 10), 0);

            if (totalStorageUsed + file.size > DEFAULT_MAX_STORAGE) {
                return res.status(400).json({ error: 'Storage limit exceeded' });
            }

            const filePath = path.join(folder, file.originalFilename || file.newFilename);
            const fileStream = fs.createReadStream(file.filepath);

            const uploadParams = {
                Bucket: 'bexcloud',
                Key: filePath,
                Body: fileStream,
                ContentType: file.mimetype // Ensure correct MIME type
            };

            const parallelUploads3 = new Upload({
                client: s3,
                params: uploadParams
            });

            parallelUploads3.on('httpUploadProgress', (progress) => {
                console.log('Upload progress:', progress);
            });

            const uploadResult = await parallelUploads3.done();

            await saveFileMetadata(username, uploadResult.Key, uploadResult.Location, file.size.toString(), file.mimetype);

            await invokeLambda(username, file.size, 'upload');

            res.status(201).send({
                message: 'File uploaded successfully',
                location: uploadResult.Location
            });
        } catch (error) {
            console.error('Failed to upload file:', error);
            res.status(500).send('Failed to upload file to S3.');
        }
    });
});

app.get('/delete', async (req, res) => {
    const { fileID, username } = req.query;

    const getParams = {
        TableName: 'bexcloud',
        Key: {
            fileID: { N: fileID },
            username: { S: username }
        }
    };

    try {
        const data = await dynamoDbClient.send(new GetItemCommand(getParams));
        const file = data.Item;

        if (!file) {
            return res.status(404).send('File not found');
        }

        const deleteParams = {
            Bucket: 'bexcloud',
            Key: file.FilePath.S
        };

        await s3.send(new DeleteObjectCommand(deleteParams));

        const deleteDbParams = {
            TableName: 'bexcloud',
            Key: {
                fileID: { N: fileID },
                username: { S: username }
            }
        };

        await dynamoDbClient.send(new DeleteItemCommand(deleteDbParams));

        await invokeLambda(username, parseInt(file.FileSize.N, 10), 'delete');

        res.status(200).send('File deleted successfully');
    } catch (error) {
        console.error('Failed to delete file:', error);
        res.status(500).send('Failed to delete file.');
    }
});
app.get('/share', async (req, res) => {
    const { fileID, username } = req.query;

    if (!fileID || !username) {
        return res.status(400).send('Missing fileID or username in query parameters');
    }

    const getParams = {
        TableName: 'bexcloud',
        Key: {
            fileID: { N: fileID },
            username: { S: username }
        }
    };

    try {
        const data = await dynamoDbClient.send(new GetItemCommand(getParams));
        const file = data.Item;

        if (!file) {
            return res.status(404).send('File not found');
        }

        const getObjectParams = {
            Bucket: 'bexcloud',
            Key: file.FilePath.S
        };

        const shareLink = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), { expiresIn: 3600 });

        res.status(200).send({ shareLink, filename: file.FilePath.S.split('/').pop() });
    } catch (error) {
        console.error('Failed to generate share link:', error);
        res.status(500).send('Failed to generate share link.');
    }
});

app.get('/download', async (req, res) => {
    const { fileID, username } = req.query;

    if (!fileID || !username) {
        return res.status(400).send('Missing fileID or username in query parameters');
    }

    const getParams = {
        TableName: 'bexcloud',
        Key: {
            fileID: { N: fileID },
            username: { S: username }
        }
    };

    try {
        const data = await dynamoDbClient.send(new GetItemCommand(getParams));
        const file = data.Item;

        if (!file) {
            return res.status(404).send('File not found');
        }

        const getObjectParams = {
            Bucket: 'bexcloud',
            Key: file.FilePath.S
        };

        const getObjectCommand = new GetObjectCommand(getObjectParams);
        const objectResponse = await s3.send(getObjectCommand);

        const fileName = file.FilePath.S.split('/').pop();
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', file.FileType.S);
        objectResponse.Body.pipe(res);
    } catch (error) {
        console.error('Failed to download file:', error);
        res.status(500).send('Failed to download file.');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

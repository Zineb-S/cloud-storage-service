const express = require('express');
const cors = require('cors');
const formidable = require('formidable');
const { S3 } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors({
    origin: 'https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8081',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const s3 = new S3({ region: 'us-east-1' });
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

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
        await dynamoDbClient.send(new PutItemCommand(params));
    } catch (error) {
        console.error('Failed to save file metadata:', error);
        throw error;
    }
};

app.post('/upload', (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error parsing form data' });
        }

        // Ensure folder is a string
        const folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
        const fileArray = files.file;
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        console.log('Parsed folder:', folder);
        console.log('Parsed file:', file);

        if (!folder) {
            return res.status(400).json({ error: 'Folder is not provided' });
        }

        if (!file) {
            return res.status(400).json({ error: 'File is not provided' });
        }

        console.log('File details:', {
            originalFilename: file.originalFilename,
            filepath: file.filepath,
            mimetype: file.mimetype,
            size: file.size
        });

        const filePath = path.join(folder, file.originalFilename || file.newFilename);
        const fileStream = fs.createReadStream(file.filepath);

        const uploadParams = {
            Bucket: 'bexcloud',
            Key: filePath,
            Body: fileStream,
            ContentType: file.mimetype
        };

        try {
            const parallelUploads3 = new Upload({
                client: s3,
                params: uploadParams
            });

            parallelUploads3.on('httpUploadProgress', (progress) => {
                console.log(progress);
            });

            const uploadResult = await parallelUploads3.done();

            const username = 'zineb'; // You might want to get this from fields or request session
            await saveFileMetadata(username, uploadResult.Key, uploadResult.Location, file.size, file.mimetype);

            res.status(201).send({
                message: 'File uploaded successfully',
                location: uploadResult.Location
            });
        } catch (error) {
            console.error('Failed to upload file to S3:', error);
            res.status(500).send('Failed to upload file to S3.');
        }
    });
});

const port = 8080;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

import React, { useState, useEffect } from 'react';
import NavBar from '../NavBar';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import Modal from 'react-modal';
import { FaFileImage, FaFileVideo, FaFileAlt, FaDownload, FaTrash, FaShareAlt } from 'react-icons/fa';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser } from 'amazon-cognito-identity-js';

Modal.setAppElement('#root'); // Set the root element for accessibility

const poolData = {
    UserPoolId: 'us-east-1_2lVpt6Bgg',
    ClientId: '7rh2hckhhrp1hlvucsdqd1gabq'
};

const userPool = new CognitoUserPool(poolData);

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [folder, setFolder] = useState('');
    const [files, setFiles] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [profile, setProfile] = useState({ email: '', given_name: '', family_name: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [totalStorageUsed, setTotalStorageUsed] = useState(0);
    const [maxStorage, setMaxStorage] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            fetchUserProfile();
            fetchFiles();
        }
    }, [user, navigate]);
 const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const fetchUserProfile = () => {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.getSession((err, session) => {
                if (err) {
                    console.error('Error fetching session:', err);
                    return;
                }
                cognitoUser.getUserAttributes((err, attributes) => {
                    if (err) {
                        console.error('Error fetching user attributes:', err);
                        return;
                    }
                    const profileData = {};
                    attributes.forEach(attr => {
                        profileData[attr.Name] = attr.Value;
                    });
                    setProfile(profileData);
                });
            });
        }
    };

   const fetchFiles = async () => {
    try {
        console.log('Fetching files for user:', user.email);
        const response = await axios.get('https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8080/files', {
            params: { username: user.email },
            withCredentials: true
        });
        console.log('Files fetched successfully:', response.data);
        console.log('Files data:', response.data.files);
        setFiles(response.data.files);
        setTotalStorageUsed(response.data.totalStorageUsed);
        setMaxStorage(response.data.maxStorage);
    } catch (error) {
        console.error('Error fetching files:', error);
    }
};


    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFolderChange = (e) => {
        setFolder(e.target.value);
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert('Please select a file.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('username', user.email);

        try {
            console.log('Uploading file:', file);
            const response = await axios.post('https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8080/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            console.log('File uploaded successfully:', response.data);
            alert('File uploaded successfully: ' + response.data.location);
            setFiles(prevFiles => [...prevFiles, response.data]); // Update file list after upload
            fetchFiles(); // Update storage usage
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
        }
    };

    const handleFileDelete = async (fileID) => {
        try {
            const response = await axios.get('https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8080/delete', {
                params: { fileID, username: user.email },
                withCredentials: true,
            });
            alert('File deleted successfully');
            setFiles(files.filter(file => file.fileID.N !== fileID));
            fetchFiles(); // Update storage usage
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file: ' + error.message);
        }
    };

    const handleFileShare = async (fileID, username) => {
        try {
            const response = await axios.get('https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8080/share', {
                params: { fileID, username },
                withCredentials: true
            });
            setShareLink(response.data.shareLink);
            setModalIsOpen(true);
        } catch (error) {
            console.error('Error generating share link:', error);
            alert('Error generating share link: ' + error.message);
        }
    };

    const handleFileDownload = async (fileID, username) => {
        try {
            const response = await axios.get('https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8080/download', {
                params: { fileID, username },
                withCredentials: true,
                responseType: 'blob' // Important for binary data
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'downloaded_file';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error generating download link:', error);
            alert('Error generating download link: ' + error.message);
        }
    };

    const getFileTypeIcon = (fileType) => {
        switch (fileType) {
            case 'image/png':
            case 'image/jpeg':
                return <FaFileImage />;
            case 'video/mp4':
                return <FaFileVideo />;
            default:
                return <FaFileAlt />;
        }
    };

  const renderFiles = (files) => {
    const folders = {};
    const userFiles = [];

    files.forEach(file => {
        const folder = file.FilePath && file.FilePath.S ? file.FilePath.S.split('/')[0] : 'Unknown Folder';
        if (folder === user.email) {
            userFiles.push(file);
        } else {
            if (!folders[folder]) {
                folders[folder] = [];
            }
            folders[folder].push(file);
        }
    });

    return (
        <div>
            <h3>Files:</h3>
            <ul>
                {userFiles.map((file, index) => (
                    <li key={index} className="file-item">
                        <span className="file-icon">{getFileTypeIcon(file.FileType && file.FileType.S)}</span>
                        <span className="file-name">{file.FilePath && file.FilePath.S ? file.FilePath.S.split('/').pop() : 'Unknown File'}</span>
                        <span className="file-size">({file.FileSize && file.FileSize.N ? (file.FileSize.N / 1024).toFixed(2) : '0'} KB)</span>
                        <button onClick={() => handleFileDownload(file.fileID.N, user.email)}><FaDownload /></button>
                        <button onClick={() => handleFileDelete(file.fileID.N)}><FaTrash /></button>
                        <button onClick={() => handleFileShare(file.fileID.N, user.email)}><FaShareAlt /></button>
                    </li>
                ))}
            </ul>
            <h3>Folders:</h3>
            {Object.keys(folders).map((folder, index) => (
                <div key={index}>
                    <button type="button" onClick={() => toggleAccordion(index)}>
                        {folder}
                    </button>
                    <div id={`accordion-${index}`} style={{ display: 'none' }}>
                        <ul>
                            {folders[folder].map((file, idx) => (
                                <li key={idx} className="file-item">
                                    <span className="file-icon">{getFileTypeIcon(file.FileType && file.FileType.S)}</span>
                                    <span className="file-name">{file.FilePath && file.FilePath.S ? file.FilePath.S.split('/').pop() : 'Unknown File'}</span>
                                    <span className="file-size">({file.FileSize && file.FileSize.N ? (file.FileSize.N / 1024).toFixed(2) : '0'} KB)</span>
                                    <button onClick={() => handleFileDownload(file.fileID.N, user.email)}><FaDownload /></button>
                                    <button onClick={() => handleFileDelete(file.fileID.N)}><FaTrash /></button>
                                    <button onClick={() => handleFileShare(file.fileID.N, user.email)}><FaShareAlt /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
};

    const toggleAccordion = (index) => {
        const element = document.getElementById(`accordion-${index}`);
        if (element.style.display === 'none') {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    const handleSaveProfile = () => {
        setIsLoading(true);
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.getSession((err, session) => {
                if (err) {
                    console.error('Error fetching session:', err);
                    setIsLoading(false);
                    return;
                }

                const attributes = [
                    new CognitoUserAttribute({ Name: 'given_name', Value: profile.given_name }),
                    new CognitoUserAttribute({ Name: 'family_name', Value: profile.family_name }),
                    // Add other attributes you want to update
                ];

                cognitoUser.updateAttributes(attributes, (err, result) => {
                    setIsLoading(false);
                    if (err) {
                        console.error('Error updating attributes:', err);
                        return;
                    }
                    console.log('Profile updated successfully:', result);
                    setIsEditing(false);
                });
            });
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const storagePercentage = (totalStorageUsed / maxStorage) * 100;

    return (
        <div className="profile-container">
            <NavBar />
            <div className="profile-content">
                <h1>Profile Page</h1>
                {isEditing ? (
                    <div className="profile-edit">
                        <input
                            type="text"
                            name="given_name"
                            value={profile.given_name}
                            onChange={handleInputChange}
                            placeholder="First Name"
                            className="input-field"
                        />
                        <input
                            type="text"
                            name="family_name"
                            value={profile.family_name}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                            className="input-field"
                        />
                        <button onClick={handleSaveProfile} disabled={isLoading} className="save-button">
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                ) : (
                    <div className="profile-view">
                        <p>Email: {profile.email}</p>
                        <p>First Name: {profile.given_name}</p>
                        <p>Last Name: {profile.family_name}</p>
                        <button onClick={handleEditProfile} className="edit-button">Edit Profile</button>
                    </div>
                )}
                <form className="profile-form" onSubmit={handleFileUpload}>
                    <input 
                        type="text" 
                        placeholder="Folder path" 
                        value={folder} 
                        onChange={handleFolderChange} 
                        className="input-field"
                    />
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        className="input-field"
                    />
                    <button type="submit" className="upload-button">Upload File</button>
                </form>
                <div className="storage-info">
                    <div className="storage-bar">
                        <div className="storage-used" style={{ width: `${storagePercentage}%` }}></div>
                    </div>
                    <p>{formatBytes(totalStorageUsed)} of {formatBytes(maxStorage)} used</p>
                </div>
                {renderFiles(files)}
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                contentLabel="Share Link Modal"
                className="Modal"
                overlayClassName="Overlay"
            >
                <h2>Share Link</h2>
                <p>{shareLink}</p>
                <button onClick={() => setModalIsOpen(false)}>Close</button>
            </Modal>
        </div>
    );
};

export default Profile;

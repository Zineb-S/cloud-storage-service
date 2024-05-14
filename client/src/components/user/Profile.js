import React, { useState } from 'react';
import NavBar from '../NavBar';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [folder, setFolder] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFolderChange = (e) => {
        setFolder(e.target.value);
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file ) {
            alert('Please select a file and specify a folder path.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const response = await axios.post('https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8080/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            alert('File uploaded successfully: ' + response.data.location);
        } catch (error) {
            alert('Error uploading file: ' + error.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div>
            <NavBar />
            <h1>Profile Page</h1>
            <input type="text" placeholder="Folder path" value={folder} onChange={handleFolderChange} />
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleFileUpload}>Upload File</button>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Profile;

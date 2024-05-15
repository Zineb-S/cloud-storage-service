import React, { useState } from 'react';
import NavBar from '../NavBar';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css'; // Import the CSS file

const Profile = () => {
    const { logout, user } = useAuth(); // Assume `user` contains the email
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
        if (!file) {
            alert('Please select a file.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('username', user.email); // Add the email as the username to the form data
        console.log('username', user.email);
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
        <div className="profile-container">
            <NavBar />
            <div className="profile-content">
                <h1>Profile Page</h1>
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
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
        </div>
    );
};

export default Profile;

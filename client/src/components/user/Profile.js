import React, { useContext, useState } from 'react'
import NavBar from '../NavBar';
import { AuthProvider , useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div>
            <NavBar/>
            <h1>Profile Page</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Profile;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';

const Callback = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const extractTokens = () => {
            const urlParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const accessToken = urlParams.get('access_token');
            const idToken = urlParams.get('id_token');

            if (accessToken && idToken) {
                login(accessToken, { token: idToken });
                navigate('/profile', { replace: true });
            } else {
                navigate('/login', { replace: true });
            }
        };

        extractTokens();
    }, [login, navigate]);

    return <div>Loading...</div>;
};

export default Callback;

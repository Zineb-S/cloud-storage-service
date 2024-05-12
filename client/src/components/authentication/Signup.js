import React, { useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser } from 'amazon-cognito-identity-js';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import { useAuth } from '../../services/AuthContext'; // Adjust the path as necessary

const poolData = {
    UserPoolId: 'us-east-1_2lVpt6Bgg',
    ClientId: '7rh2hckhhrp1hlvucsdqd1gabq'
};

const userPool = new CognitoUserPool(poolData);

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerification, setShowVerification] = useState(false);

    const { user, login } = useAuth(); // Get the user and login function from context
    const navigate = useNavigate();

    // Redirect if user is already logged in
    useEffect(() => {
        if (user && user.accessToken) {
            navigate('/profile'); // Change to your profile route as needed
        }
    }, [user, navigate]);

    const onSubmitSignup = event => {
        event.preventDefault();

        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: email })
        ];

        userPool.signUp(username, password, attributeList, null, (err, result) => {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            console.log('User registration successful:', result.user.getUsername());
            setShowVerification(true);
        });
    };

    const onSubmitVerification = event => {
        event.preventDefault();

        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new CognitoUser(userData);
        cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            alert("Verification successful, you can now login.");
            setShowVerification(false);
            navigate('/login'); // Redirect to login page after verification
        });
    };

    return (
        <>
            <NavBar />
            <h1>Signup</h1>
            {!showVerification ? (
                <form onSubmit={onSubmitSignup}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="submit">Sign Up</button>
                </form>
            ) : (
                <form onSubmit={onSubmitVerification}>
                    <h2>Verify Email</h2>
                    <input
                        type="text"
                        placeholder="Verification Code"
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                    />
                    <button type="submit">Verify</button>
                </form>
            )}
        </>
    );
};

export default Signup;

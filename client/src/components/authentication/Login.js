import React, { useState , useEffect  } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for programmatic navigation
import { useAuth } from '../../services/AuthContext'; // Adjust the path according to your project structure
import NavBar from '../NavBar';

const poolData = {
    UserPoolId: 'us-east-1_2lVpt6Bgg',
    ClientId: '7rh2hckhhrp1hlvucsdqd1gabq'
};

const userPool = new CognitoUserPool(poolData);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { user,  login } = useAuth(); 
    const navigate = useNavigate(); 
 useEffect(() => {
        if (user && user.accessToken) {
            navigate('/profile');
        }
    }, [user, navigate]);
    const onSubmit = event => {
        event.preventDefault();
        handleLogin(email, password);
    };

    const handleLogin = (email, password) => {
        const authenticationDetails = new AuthenticationDetails({
            Username: email,
            Password: password
        });

        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: result => {
                const accessToken = result.getAccessToken().getJwtToken();
                console.log('Access token:', accessToken);
                login(accessToken, { email: email }); // Use the login method from AuthContext
                navigate('/profile'); // Navigate to the profile page on successful login
            },
            onFailure: err => {
                console.error("Error logging in: ", err);
                alert("Failed to login: " + err.message || JSON.stringify(err));
            }
        });
    };
    const domain = "bexcloud.auth.us-east-1.amazoncognito.com";  // Replace with your Cognito domain
    const clientId = "7rh2hckhhrp1hlvucsdqd1gabq";  // Replace with your Cognito App Client ID
    const redirectUri = encodeURIComponent("https://0a215c9039ba4770a11d847aa1b501ce.vfs.cloud9.us-east-1.amazonaws.com:8081/callback");  // Your redirect URI

const signInUrl = `https://${domain}/login?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;
    return (
        <>
            <NavBar />
            <h1>Login</h1>
            <div>
            <a href={signInUrl}>Sign In with AWS Cognito</a>
        </div>
            <form onSubmit={onSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
            </form>
        </>
    );
};

export default Login;

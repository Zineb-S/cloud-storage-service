// App.js

import {React ,useEffect}from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate ,useNavigate} from 'react-router-dom';
import HomePage from './components/HomePage';
import Privacy from './components/Privacy';
import DataDeletion from './components/DataDeletion';
import Profile from './components/user/Profile';
import Login from './components/authentication/Login';
import Callback from './components/authentication/Callback';
import Signup from './components/authentication/Signup';
import { AuthProvider , useAuth } from './services/AuthContext';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.accessToken) {
            navigate('/login');
        }
    }, [user, navigate]);

    return user && user.accessToken ? children : <div>Loading...</div>;
}
function App() {
    return (
        <Router>
            <div className="App">
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/callback" element={<Callback />} />
                        <Route path="/facebook-data-deletion" element={<DataDeletion />} />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </AuthProvider>
            </div>
        </Router>
    );
}

export default App;

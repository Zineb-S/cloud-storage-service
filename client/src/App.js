import React from 'react';
import { BrowserRouter as Router, Routes, Route,Navigate  } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import Profile from './components/user/Profile'; 
import Login from './components/authentication/Login'; 
import Signup from './components/authentication/Signup'; 
import AuthProvider, { useAuth } from './services/AuthContext'; 

function App() {
  return (
    <Router>
      <div className="App">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </div>
    </Router>
  );
}

function ProtectedRoute({ children }) {
  const auth = useAuth();
  return auth.user ? children : <Navigate to="/login" />;
}

export default App;

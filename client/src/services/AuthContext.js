import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Load user data from local storage when the component mounts
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
            console.log("User loaded from local storage:", JSON.parse(userData));
        }
    }, []);

    // Monitor user state changes
    useEffect(() => {
        if (user) {
            console.log("Context updated - User logged in:", user);
            localStorage.setItem('user', JSON.stringify(user));  // Save user data to local storage
        } else {
            console.log("Context cleared - User logged out");
            localStorage.removeItem('user');  // Clear user data from local storage
        }
    }, [user]);

const login = (accessToken, userData) => {
    const userObject = { accessToken, ...userData };
    setUser(userObject);
    localStorage.setItem('user', JSON.stringify(userObject));
};


    const logout = () => {
        console.log("Logging out user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

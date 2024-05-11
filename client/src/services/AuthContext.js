import React, { useContext, useState, createContext } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userCredentials) => {
    setUser({ id: '123', name: 'John Doe' }); // Simulate a login
  };

  const logout = () => {
    setUser(null); // Logout the user
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, logoutUser } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await getUserProfile();
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch user", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const updateUser = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, loading, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import './styles/Layout.css';

const Layout = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <header className="top-header">
                    <h1 className="header-title">Dashboard</h1>
                    <Link to="/profile" className="user-profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span className="user-name">{user?.name}</span>
                        <img
                            src={user?.avatar}
                            alt="Avatar"
                            className="user-avatar"
                        />
                    </Link>
                </header>

                <div className="content-scroll-area">
                    <div className="content-wrapper">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Bell } from 'lucide-react';
import '../components/styles/Layout.css';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Get current page title based on path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/groups')) return 'Groups';
        if (path.startsWith('/friends')) return 'Friends';
        if (path.startsWith('/expenses')) return 'All Expenses';
        if (path.startsWith('/activity')) return 'Recent Activity';
        if (path.startsWith('/profile')) return 'Profile';
        if (path.startsWith('/add-expense')) return 'Add Expense';
        if (path.startsWith('/settle-up')) return 'Settle Up';
        return 'EquiPay';
    };

    return (
        <div className="app-layout">
            {/* Mobile Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Sidebar Drawer */}
            <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''} mobile-sidebar`}>
                <Sidebar closeSidebar={() => setIsSidebarOpen(false)} />
            </div>

            {/* Desktop Sidebar (Hidden on Mobile via CSS) */}
            <div className="sidebar-wrapper">
                <Sidebar />
            </div>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>
                            <Menu size={24} />
                        </button>
                        <h1 className="header-title">{getPageTitle()}</h1>
                    </div>

                    <Link to="/profile" className="user-profile-link">
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                        </div>
                        <img
                            src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
                            alt={user?.name}
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

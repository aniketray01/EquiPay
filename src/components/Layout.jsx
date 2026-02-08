import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';
import './styles/Layout.css';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="app-layout">
            <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
            <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
                <Sidebar closeSidebar={() => setIsSidebarOpen(false)} />
            </div>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className="header-title">EquiPay</h1>
                    </div>
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

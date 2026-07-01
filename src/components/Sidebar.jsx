import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Users, Activity, LogOut, Plus, Sun, Moon } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../components/styles/Sidebar.css';

const Sidebar = ({ closeSidebar }) => {
    const { logout } = useAuth();
    const { friends } = useExpenses();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: List, label: 'All Expenses', path: '/expenses' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Users, label: 'Friends', path: '/friends' },
        { icon: Activity, label: 'Recent Activity', path: '/activity' },
    ];

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="logo-box">E</div>
                <span className="brand-name">EquiPay</span>
            </div>

            {/* Scrollable Content */}
            <div className="sidebar-content">
                {/* Main Navigation */}
                <div className="nav-section">
                    <div className="section-label">Menu</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={18} className="nav-icon" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Friends Section */}
                <div className="nav-section">
                    <div className="section-label">
                        <span>Friends</span>
                        <div
                            className="add-btn"
                            onClick={() => navigate('/friends')}
                            title="Add Friend"
                        >
                            <Plus size={14} />
                        </div>
                    </div>

                    {friends.length === 0 ? (
                        <NavLink
                            to="/friends"
                            className="nav-item"
                            style={{ color: 'var(--text-light)', fontStyle: 'italic' }}
                        >
                            <Plus size={18} className="nav-icon" />
                            Add your first friend
                        </NavLink>
                    ) : (
                        friends.map((friend) => (
                            <NavLink
                                key={friend.id}
                                to={`/friends`} // Ideally profile or filter by friend
                                className="friend-item"
                                onClick={closeSidebar}
                            >
                                <div className="friend-avatar-small">
                                    <Users size={12} />
                                </div>
                                {friend.name}
                            </NavLink>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    onClick={toggleTheme}
                    className="logout-btn"
                    style={{ marginBottom: '0.5rem' }}
                >
                    {isDarkMode ? (
                        <Sun size={18} style={{ marginRight: '0.85rem' }} />
                    ) : (
                        <Moon size={18} style={{ marginRight: '0.85rem' }} />
                    )}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={18} style={{ marginRight: '0.85rem' }} />
                    Log Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

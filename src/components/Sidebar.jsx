import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Users, Activity, LogOut, Plus } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import './styles/Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();
    const { friends } = useExpenses(); // Get real friends
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'My Groups', path: '/groups' },
        { icon: Users, label: 'Friends', path: '/friends' },
        { icon: List, label: 'All Expenses', path: '/expenses' },
        { icon: Activity, label: 'Recent Activity', path: '/activity' },
    ];

    return (
        <div className="sidebar">
            {/* Brand */}
            <div className="sidebar-header">
                <div className="logo-box">E</div>
                <span className="brand-name">EquiPay</span>
            </div>

            {/* Navigation */}
            <nav className="nav-menu">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="nav-icon" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Friends/Groups Header */}
            <div className="section-label">
                <span>Friends</span>
                <button
                    className="add-btn"
                    onClick={() => navigate('/friends')}
                    title="Add Friend"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Friends List */}
            <div className="friends-list">
                {friends.length === 0 ? (
                    <div style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-medium)' }}>
                        No friends yet
                    </div>
                ) : (
                    friends.map((friend) => (
                        <NavLink key={friend.id} to="/friends" className="friend-item">
                            <Users size={14} style={{ marginRight: '10px' }} />
                            {friend.name}
                        </NavLink>
                    ))
                )}
            </div>

            {/* Footer / Logout */}
            <button onClick={handleLogout} className="logout-btn">
                <LogOut size={20} style={{ marginRight: '12px' }} />
                Logout
            </button>
        </div>
    );
};

export default Sidebar;

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Search, History, PlusCircle, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import '../components/styles/Dashboard.css';

const Activity = () => {
    const { user } = useAuth();
    const { activities } = useExpenses();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredActivities = useMemo(() => {
        return activities.filter(activity =>
            activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [activities, searchTerm]);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'expense_added': return <PlusCircle size={18} style={{ color: '#10b981' }} />;
            case 'expense_updated': return <Pencil size={18} style={{ color: '#3b82f6' }} />;
            case 'expense_deleted': return <Trash2 size={18} style={{ color: '#ef4444' }} />;
            case 'group_created': return <Users size={18} style={{ color: '#8b5cf6' }} />;
            case 'member_added': return <UserPlus size={18} style={{ color: '#f59e0b' }} />;
            case 'friend_added': return <UserPlus size={18} style={{ color: '#ec4899' }} />;
            default: return <History size={18} style={{ color: 'var(--text-light)' }} />;
        }
    };

    const formatRelativeTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    };

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Activity Log</h2>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group" style={{
                    flex: 1,
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 1rem',
                    backgroundColor: 'var(--white)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <Search size={20} style={{ color: 'var(--text-light)', marginRight: '0.8rem' }} />
                    <input
                        type="text"
                        placeholder="Search all activity..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ fontSize: '0.95rem' }}
                    />
                </div>
            </div>

            <div className="activity-card">
                <div className="activity-list">
                    {filteredActivities.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-medium)' }}>
                            <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No activity yet.</p>
                        </div>
                    ) : (
                        filteredActivities.map(activity => (
                            <div key={activity._id || activity.id} className="activity-item" style={{ padding: '1.2rem 1rem' }}>
                                <div className="activity-icon" style={{
                                    backgroundColor: 'var(--secondary-color)',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="activity-info">
                                    <p className="activity-desc" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                        {activity.description}
                                    </p>
                                    <p className="activity-detail" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                        {activity.actorId === user?.id ? 'You' : activity.actorName} performed this action
                                        {activity.metadata?.amount && ` • ₹${activity.metadata.amount.toFixed(2)}`}
                                    </p>
                                </div>
                                <div className="activity-amount" style={{ textAlign: 'right' }}>
                                    <p className="activity-date" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                        {formatRelativeTime(activity.date)}
                                    </p>
                                    <p className="activity-detail" style={{ fontSize: '0.7rem' }}>
                                        {new Date(activity.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Activity;

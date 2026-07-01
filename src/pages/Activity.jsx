import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Search, History, PlusCircle, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import '../components/styles/Activity.css';

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

    // Group activities by date
    const groupedActivities = useMemo(() => {
        const groups = {};
        filteredActivities.forEach(activity => {
            const date = new Date(activity.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
        });
        return groups;
    }, [filteredActivities]);

    return (
        <div className="activity-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="section-title" style={{ fontSize: '1.5rem', margin: 0 }}>Activity Log</h2>

                {/* Search Bar */}
                <div className="input-group" style={{
                    maxWidth: '300px',
                    padding: '0.5rem 1rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)'
                }}>
                    <Search size={18} style={{ color: 'var(--text-light)', marginRight: '0.5rem' }} />
                    <input
                        type="text"
                        placeholder="Search activity..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ fontSize: '0.9rem' }}
                    />
                </div>
            </div>

            {Object.keys(groupedActivities).length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'var(--text-medium)',
                    background: 'var(--card-bg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>No activity yet.</p>
                </div>
            ) : (
                <div className="timeline-container">
                    {Object.entries(groupedActivities).map(([date, activities]) => (
                        <div key={date}>
                            <div className="activity-group-date">{date}</div>
                            {activities.map(activity => (
                                <div key={activity._id || activity.id} className="timeline-item">
                                    <div className="timeline-icon-wrapper">
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    <div className="activity-card-modern">
                                        <div className="activity-content-modern">
                                            <div className="activity-header-line">
                                                <div className="activity-title-modern">
                                                    {activity.description}
                                                </div>
                                                <div className="activity-time-modern">
                                                    {formatRelativeTime(activity.date)}
                                                </div>
                                            </div>

                                            <div className="activity-meta-modern">
                                                <span>
                                                    {activity.actorId === user?.id ? 'You' : activity.actorName}
                                                </span>
                                                {activity.metadata?.amount && (
                                                    <span className="activity-amount-tag">
                                                        ₹{activity.metadata.amount.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Activity;

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Search, Filter, Calendar } from 'lucide-react';
import '../components/styles/Dashboard.css';

const Activity = () => {
    const { user } = useAuth();
    const { expenses, friends } = useExpenses();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, owe, owed

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            // Search Logic
            const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());

            // Filter Logic
            let matchesType = true;
            const isPayer = expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me';

            if (filterType === 'owe') {
                matchesType = !isPayer; // I didn't pay, so I owe
            } else if (filterType === 'owed') {
                matchesType = isPayer; // I paid, so I am owed
            }

            return matchesSearch && matchesType;
        });
    }, [expenses, searchTerm, filterType, user]);

    const getPayerName = (payerId) => {
        if (!payerId) return 'Someone';
        if (payerId === user?.id || payerId === 'u1' || payerId === 'me') return 'You';
        const friend = friends.find(f => f.id === payerId);
        return friend ? friend.name : 'Someone';
    };

    const getFriendNames = (friendIds) => {
        if (!friendIds || friendIds.length === 0) return 'No one';
        const names = friendIds.map(fid => {
            if (fid === user?.id || fid === 'u1' || fid === 'me') return 'You';
            const friend = friends.find(f => f.id === fid);
            return friend ? friend.name : 'Unknown Friend';
        }).filter(name => name !== 'You');

        if (names.length === 0) return 'No one else';
        return names.join(', ');
    };

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Recent Activity</h2>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', backgroundColor: 'var(--white)' }}>
                    <Search size={20} style={{ color: 'var(--text-light)', marginRight: '0.5rem' }} />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ fontSize: '0.95rem' }}
                    />
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{
                        padding: '0 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--white)',
                        color: 'var(--text-medium)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Activity</option>
                    <option value="owed">You LEnt</option>
                    <option value="owe">You Borrowed</option>
                </select>
            </div>

            <div className="activity-card">
                <div className="activity-list">
                    {filteredExpenses.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-medium)' }}>
                            <p>No activity found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredExpenses.map(expense => (
                            <div key={expense.id} className="activity-item">
                                <div className="activity-icon">
                                    {expense.type === 'settlement' ? <HandCoinsIcon /> : '📝'}
                                </div>
                                <div className="activity-info">
                                    <p className="activity-desc">{expense.description}</p>
                                    <p className="activity-detail">
                                        {getPayerName(expense.payerId)} paid ₹{expense.amount.toFixed(2)}
                                    </p>
                                    <p className="activity-detail">
                                        Split with: {getFriendNames(expense.selectedFriends)}
                                    </p>
                                </div>
                                <div className="activity-amount" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <p className={`amount-text ${expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me' ? 'positive' : 'negative'}`}>
                                        {expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me' ? 'you lent' : 'you owe'}
                                    </p>
                                    <p className="activity-date">{new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper icon component
const HandCoinsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
        <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
        <path d="m2 16 6 6" />
        <circle cx="16" cy="9" r="2.9" />
        <circle cx="6" cy="5" r="3" />
    </svg>
);

export default Activity;

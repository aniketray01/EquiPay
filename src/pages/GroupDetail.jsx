import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses, API_BASE_URL } from '../context/ExpenseContext';
import { ArrowLeft, Users, Plus, X, Zap, List } from 'lucide-react';
import '../components/styles/Dashboard.css';
import DebtSimplifier from '../components/DebtSimplifier';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { groups, expenses, getBalances, friends, addMemberToGroup } = useExpenses();
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showSimplified, setShowSimplified] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const group = groups.find(g => g.id === groupId);

    // Filter expenses for this group
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    const balances = getBalances(groupId);

    if (!group) return <div>Group not found</div>;

    const getMemberName = (id) => {
        if (id === user?.id || id === 'u1' || id === 'me') return 'You';
        const profile = group.memberProfiles?.find(p => p.id === id);
        if (profile) return profile.name;
        return friends.find(f => f.id === id)?.name || 'Someone';
    };

    const handleAddMember = async (friendId) => {
        await addMemberToGroup(groupId, friendId);
        setShowMemberModal(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users/search?query=${query}`);
            const data = await res.json();
            // Filter out existing members
            setSearchResults(data.filter(u => !group.members.includes(u.firebaseId)));
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    // Friends not currently in the group and not in search results
    const availableFriends = friends.filter(f =>
        !group.members.includes(f.id) &&
        !searchResults.some(s => s.firebaseId === f.id)
    );

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/groups')} className="back-btn">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="dashboard-title">{group.name}</h2>
                        <span className="card-label">{group.type}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowMemberModal(true)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Users size={16} style={{ marginRight: '8px' }} />
                        {(group.memberProfiles?.length || group.members.length)} Members
                        <Plus size={14} style={{ marginLeft: '6px', opacity: 0.7 }} />
                    </button>
                    <button
                        onClick={() => navigate('/add-expense', { state: { groupId: group.id } })}
                        className="btn btn-orange"
                    >
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Balances */}
            <div className="stats-grid">
                <div className="balance-card">
                    <p className="card-label">Group Balance</p>
                    <div className={`card-value ${balances.total >= 0 ? 'positive' : 'negative'}`}>
                        <span>${Math.abs(balances.total).toFixed(2)}</span>
                    </div>
                    <span className="card-subtext">
                        {balances.total >= 0 ? 'you are owed overall' : 'you owe overall'}
                    </span>
                </div>
                <div className="balance-card" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p className="card-label">Members</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {group.memberProfiles?.map(member => (
                            <span key={member.id} style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-medium)',
                                backgroundColor: 'var(--secondary-color)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                            }}>
                                {member.id === (user?.id || 'u1') ? 'You' : member.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="activity-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>
                        {showSimplified ? 'Simplified Debts' : 'Group Expenses'}
                    </h3>

                    <div style={{
                        display: 'flex',
                        backgroundColor: 'var(--secondary-color)',
                        padding: '4px',
                        borderRadius: 'var(--radius-md)',
                        gap: '4px'
                    }}>
                        <button
                            onClick={() => setShowSimplified(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: !showSimplified ? 'var(--white)' : 'transparent',
                                color: !showSimplified ? 'var(--primary-color)' : 'var(--text-light)',
                                boxShadow: !showSimplified ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <List size={16} />
                            List
                        </button>
                        <button
                            onClick={() => setShowSimplified(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: showSimplified ? 'var(--white)' : 'transparent',
                                color: showSimplified ? 'var(--primary-color)' : 'var(--text-light)',
                                boxShadow: showSimplified ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <Zap size={16} />
                            Simplify
                        </button>
                    </div>
                </div>

                {showSimplified ? (
                    <DebtSimplifier groupId={groupId} />
                ) : (
                    <div className="activity-list">
                        {groupExpenses.length === 0 ? (
                            <p className="activity-detail">No expenses in this group yet.</p>
                        ) : (
                            groupExpenses.map(expense => (
                                <div key={expense.id} className="activity-item" style={{ position: 'relative' }}>
                                    <div className="activity-icon">📝</div>
                                    <div className="activity-info">
                                        <p className="activity-desc">{expense.description}</p>
                                        <p className="activity-detail">
                                            {getMemberName(expense.payerId)} paid ${expense.amount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="activity-amount" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                        <p className="activity-date">{new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showMemberModal && (
                <div className="modal-backdrop">
                    <div className="form-section shadow-lg" style={{ width: '100%', maxWidth: '400px', margin: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Add Member</h3>
                            <button onClick={() => {
                                setShowMemberModal(false);
                                setSearchQuery('');
                                setSearchResults([]);
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)', padding: '4px' }}><X size={24} /></button>
                        </div>

                        {/* Search Input */}
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', margin: '0.5rem 0 0.2rem' }}>SEARCH RESULTS</p>
                                    {searchResults.map(userResult => (
                                        <button
                                            key={userResult.firebaseId}
                                            onClick={() => handleAddMember(userResult.firebaseId)}
                                            className="btn btn-secondary"
                                            style={{ justifyContent: 'flex-start', textAlign: 'left', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{userResult.name}</span>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{userResult.email}</span>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Suggestions (Friends) */}
                            {availableFriends.length > 0 && !isSearching && (
                                <>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', margin: '0.5rem 0 0.2rem' }}>FRIENDS</p>
                                    {availableFriends.map(friend => (
                                        <button
                                            key={friend.id}
                                            onClick={() => handleAddMember(friend.id)}
                                            className="btn btn-secondary"
                                            style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                        >
                                            <Plus size={16} style={{ marginRight: '8px' }} />
                                            {friend.name}
                                        </button>
                                    ))}
                                </>
                            )}

                            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && availableFriends.length === 0 && (
                                <p style={{ color: 'var(--text-medium)', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                    No users found matching "{searchQuery}"
                                </p>
                            )}

                            {!searchQuery && availableFriends.length === 0 && (
                                <p style={{ color: 'var(--text-medium)', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                    Type to search for people to add...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default GroupDetail;

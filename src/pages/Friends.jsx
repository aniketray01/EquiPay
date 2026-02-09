import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Users, Mail, X, Trash2 } from 'lucide-react';

const Friends = () => {
    const { friends, addFriend, removeFriend } = useExpenses();
    const [showModal, setShowModal] = useState(false);
    const [newFriend, setNewFriend] = useState({ name: '', email: '' });

    const [isAdding, setIsAdding] = useState(false);

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (newFriend.name && newFriend.email && !isAdding) {
            setIsAdding(true);
            try {
                await addFriend(newFriend);
                setNewFriend({ name: '', email: '' });
                setShowModal(false);
            } catch (err) {
                alert("Failed to add friend. Please check the email or try again later.");
            } finally {
                setIsAdding(false);
            }
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="dashboard-title">Friends</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    Add Friend
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {friends.map((friend) => (
                    <div key={friend.id} className="balance-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-medium)' }}>
                                <Users size={20} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{friend.name}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>{friend.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (friend.isNetwork && !friend.isManual) {
                                    alert("This friend is part of a shared group or expense and cannot be removed until those are settled/deleted.");
                                    return;
                                }
                                if (window.confirm(`Are you sure you want to remove ${friend.name}?`)) {
                                    removeFriend(friend.id);
                                }
                            }}
                            className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors"
                            style={{
                                backgroundColor: 'hsl(0, 84%, 95%)',
                                color: 'hsl(0, 84%, 60%)',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={friend.isNetwork ? "Part of a shared group" : "Remove friend"}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Friend Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="form-section shadow-lg" style={{ width: '100%', maxWidth: '400px', margin: '1rem', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Add New Friend</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)', padding: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFriend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-dark)' }}>Name</label>
                                <input
                                    type="text"
                                    value={newFriend.name}
                                    onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                                    className="input-field"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                    placeholder="Enter friend's name"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-dark)' }}>Email</label>
                                <input
                                    type="email"
                                    value={newFriend.email}
                                    onChange={(e) => setNewFriend({ ...newFriend, email: e.target.value })}
                                    className="input-field"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                    placeholder="friend@example.com"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isAdding}>
                                {isAdding ? 'Adding...' : 'Add Friend'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Friends;

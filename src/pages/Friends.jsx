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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-medium)', flexShrink: 0 }}>
                                <Users size={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 600, color: 'var(--text-dark)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.name}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.email}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                            {friend.isNetwork && !friend.isManual && (
                                <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-light)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-medium)', fontWeight: 600, whiteSpace: 'nowrap' }}>Group</span>
                            )}
                            {friend.isAddedMe && !friend.isManual && !friend.isNetwork && (
                                <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--success-light)', padding: '2px 6px', borderRadius: '4px', color: 'var(--success)', fontWeight: 600, whiteSpace: 'nowrap' }}>Network</span>
                            )}
                            <button
                                onClick={() => {
                                    if (friend.isNetwork && !friend.isManual && !friend.isAddedMe) {
                                        alert(`${friend.name} is a contact from one of your shared groups. To remove them, you must either remove them from the group or leave the group yourself.`);
                                        return;
                                    }
                                    const confirmMsg = friend.isAddedMe ? `Remove ${friend.name} from your list?` : `Are you sure you want to remove ${friend.name}?`;
                                    if (window.confirm(confirmMsg)) {
                                        removeFriend(friend.id);
                                    }
                                }}
                                className="delete-friend-btn"
                                style={{
                                    backgroundColor: 'hsl(0, 84%, 96%)',
                                    color: 'hsl(0, 84%, 60%)',
                                    border: '1px solid hsl(0, 84%, 90%)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                                title={(friend.isNetwork && !friend.isManual && !friend.isAddedMe) ? "Group Contact" : "Remove Friend"}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
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

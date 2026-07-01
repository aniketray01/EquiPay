import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Users, Mail, X, Trash2, UserPlus, Pencil } from 'lucide-react';
import '../components/styles/Friends.css';

const Friends = () => {
    const { friends, addFriend, removeFriend, updateFriend } = useExpenses();
    const [showModal, setShowModal] = useState(false);
    const [newFriend, setNewFriend] = useState({ name: '', email: '' });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFriendData, setEditFriendData] = useState({ id: '', name: '', email: '' });

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

    const handleEditClick = (friend) => {
        setEditFriendData({ id: friend.id, name: friend.name, email: friend.email });
        setShowEditModal(true);
    };

    const handleEditFriend = async (e) => {
        e.preventDefault();
        if (editFriendData.name && editFriendData.email) {
            try {
                await updateFriend(editFriendData.id, { name: editFriendData.name, email: editFriendData.email });
                setShowEditModal(false);
            } catch (err) {
                alert("Failed to update friend. Please check the email or try again later.");
            }
        }
    };

    return (
        <div className="friends-page">
            <div className="friends-header">
                <h2 className="friends-title">Friends</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="add-friend-btn"
                >
                    <UserPlus size={20} />
                    <span>Add Friend</span>
                </button>
            </div>

            <div className="friends-grid">
                {friends.map((friend) => (
                    <div key={friend.id} className="friend-card">
                        <div className="friend-info">
                            <div className="friend-avatar">
                                <Users size={24} />
                            </div>
                            <div className="friend-details">
                                <p className="friend-name" title={friend.name}>{friend.name}</p>
                                <p className="friend-email" title={friend.email}>{friend.email}</p>
                            </div>
                        </div>

                        <div className="friend-actions">
                            {friend.isNetwork && !friend.isManual && (
                                <span className="friend-badge group">Group</span>
                            )}
                            {friend.isAddedMe && !friend.isManual && !friend.isNetwork && (
                                <span className="friend-badge network">Network</span>
                            )}

                            {friend.isManual && (
                                <button
                                    onClick={() => handleEditClick(friend)}
                                    className="edit-btn"
                                    title="Edit Friend"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-light)',
                                        padding: '4px',
                                        marginRight: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Pencil size={18} />
                                </button>
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
                                className="delete-btn"
                                title={(friend.isNetwork && !friend.isManual && !friend.isAddedMe) ? "Group Contact" : "Remove Friend"}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Friend Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target.className === 'modal-overlay') setShowModal(false);
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Friend</h3>
                            <button onClick={() => setShowModal(false)} className="close-modal-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFriend} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    value={newFriend.name}
                                    onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                                    className="form-input"
                                    placeholder="Enter friend's name"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    value={newFriend.email}
                                    onChange={(e) => setNewFriend({ ...newFriend, email: e.target.value })}
                                    className="form-input"
                                    placeholder="friend@example.com"
                                    required
                                />
                            </div>
                            <button type="submit" className="modal-footer-btn" disabled={isAdding}>
                                {isAdding ? 'Adding...' : 'Add Friend'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Friend Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target.className === 'modal-overlay') setShowEditModal(false);
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Friend</h3>
                            <button onClick={() => setShowEditModal(false)} className="close-modal-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditFriend} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    value={editFriendData.name}
                                    onChange={(e) => setEditFriendData({ ...editFriendData, name: e.target.value })}
                                    className="form-input"
                                    placeholder="Enter friend's name"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    value={editFriendData.email}
                                    onChange={(e) => setEditFriendData({ ...editFriendData, email: e.target.value })}
                                    className="form-input"
                                    placeholder="friend@example.com"
                                    required
                                />
                            </div>
                            <button type="submit" className="modal-footer-btn">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Friends;

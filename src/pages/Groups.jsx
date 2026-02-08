import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Plus, Users, Home, Plane, Heart, Zap, X, Trash2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Groups = () => {
    const { groups, addGroup, addFriend, friends, deleteGroup } = useExpenses();
    const [showModal, setShowModal] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: '',
        type: 'Home',
        members: []
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [newFriend, setNewFriend] = useState({ name: '', email: '' });
    const [isAddingFriend, setIsAddingFriend] = useState(false);

    const groupTypes = [
        { label: 'Home', icon: Home },
        { label: 'Trip', icon: Plane },
        { label: 'Couple', icon: Heart },
        { label: 'Other', icon: Zap }
    ];

    const TypeIcon = ({ typeName, size = 24 }) => {
        const type = groupTypes.find(t => t.label === typeName) || groupTypes[0];
        const Icon = type.icon;
        return <Icon size={size} />;
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        // Validation: Name is required
        if (!newGroup.name.trim() || isProcessing) return;

        setIsProcessing(true);
        try {
            await addGroup(newGroup);
            setShowModal(false);
            setNewGroup({ name: '', type: 'Home', members: [] });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (newFriend.name && newFriend.email && !isAddingFriend) {
            setIsAddingFriend(true);
            try {
                const addedFriend = await addFriend(newFriend);
                if (addedFriend && addedFriend.id) {
                    setNewGroup(prev => ({
                        ...prev,
                        members: [...prev.members, addedFriend.id]
                    }));
                }
                setNewFriend({ name: '', email: '' });
                setShowAddFriendModal(false);
            } catch (err) {
                alert("Failed to add friend. Please check the email or try again later.");
            } finally {
                setIsAddingFriend(false);
            }
        }
    };

    const toggleMember = (friendId) => {
        if (newGroup.members.includes(friendId)) {
            setNewGroup({ ...newGroup, members: newGroup.members.filter(id => id !== friendId) });
        } else {
            setNewGroup({ ...newGroup, members: [...newGroup.members, friendId] });
        }
    };

    return (
        <div className="pb-20">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>Groups</h2>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(20, 184, 166, 0.2)'
                    }}
                >
                    <Plus size={20} />
                    <span>Create Group</span>
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {groups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: 'var(--text-medium)',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border-color)'
                    }}>
                        <Users size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-light)', opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>No groups yet. Create one to start splitting!</p>
                    </div>
                ) : (
                    groups.map(group => (
                        <div key={group.id} style={{ position: 'relative' }}>
                            <Link to={`/group/${group.id}`} style={{ textDecoration: 'none' }}>
                                <div className="balance-card hover-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px',
                                            backgroundColor: 'var(--primary-light)',
                                            color: 'var(--primary-color)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <TypeIcon typeName={group.type} size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)' }}>{group.name}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>{group.type}</p>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={14} />
                                        {group.members.length} members
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (window.confirm('Delete this group? All associated expenses will be deleted.')) {
                                        deleteGroup(group.id);
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-light)',
                                    cursor: 'pointer',
                                    padding: '5px'
                                }}
                                className="group-delete-btn"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Create Group Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="form-section shadow-lg" style={{ width: '100%', maxWidth: '500px', margin: '1rem', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>Create a Group</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)', padding: '4px' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label className="card-label">Group Name</label>
                                <input
                                    className="input-field"
                                    style={{ borderBottom: '1px solid var(--border-color)', width: '100%', padding: '0.5rem 0' }}
                                    placeholder="e.g. Apartment, Trip"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="card-label">Type</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {groupTypes.map(type => (
                                        <button
                                            key={type.label}
                                            type="button"
                                            onClick={() => setNewGroup({ ...newGroup, type: type.label })}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: 'var(--radius-full)',
                                                border: `1px solid ${newGroup.type === type.label ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                                backgroundColor: newGroup.type === type.label ? 'var(--primary-light)' : 'transparent',
                                                color: newGroup.type === type.label ? 'var(--primary-color)' : 'var(--text-medium)',
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="card-label" style={{ margin: 0 }}>Add Members</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddFriendModal(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: 'var(--secondary-color)',
                                            color: 'var(--primary-color)',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <UserPlus size={14} />
                                        <span>Add Friend</span>
                                    </button>
                                </div>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    marginTop: '0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.5rem'
                                }}>
                                    {friends.length === 0 ? (
                                        <div style={{ color: 'var(--text-medium)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                                            No friends found. <Link to="/friends" style={{ color: 'var(--primary-color)' }}>Add friends first</Link>
                                        </div>
                                    ) : (
                                        friends.map(friend => (
                                            <label key={friend.id} className="friend-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newGroup.members.includes(friend.id)}
                                                    onChange={() => toggleMember(friend.id)}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '0.95rem' }}>{friend.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={!newGroup.name || isProcessing}>
                                {isProcessing ? 'Creating...' : 'Create Group'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Nested Add Friend Modal */}
            {showAddFriendModal && (
                <div className="modal-backdrop" style={{ zIndex: 1100 }}>
                    <div className="form-section shadow-lg" style={{ width: '100%', maxWidth: '400px', margin: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Add New Friend</h3>
                            <button
                                type="button"
                                onClick={() => setShowAddFriendModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFriend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-medium)' }}>NAME</label>
                                <input
                                    className="input-field"
                                    style={{ borderBottom: '1px solid var(--border-color)', width: '100%', padding: '0.5rem 0' }}
                                    placeholder="Friend's name"
                                    value={newFriend.name}
                                    onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-medium)' }}>EMAIL</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    style={{ borderBottom: '1px solid var(--border-color)', width: '100%', padding: '0.5rem 0' }}
                                    placeholder="Friend's email"
                                    value={newFriend.email}
                                    onChange={(e) => setNewFriend({ ...newFriend, email: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={!newFriend.name || isAddingFriend}>
                                {isAddingFriend ? 'Adding...' : 'Add Friend'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;

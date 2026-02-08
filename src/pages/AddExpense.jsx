import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, UserPlus, X } from 'lucide-react';
import '../components/styles/AddExpense.css';

const AddExpense = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addExpense, updateExpense, addFriend, friends, groups, expenses } = useExpenses();
    const { expenseId } = useParams();
    const isEditMode = Boolean(expenseId);
    const { user } = useAuth();

    // If coming from a group page, pre-select that group and its members
    const preSelectedGroupId = location.state?.groupId;
    const preSelectedGroup = groups.find(g => g.id === preSelectedGroupId);

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState(user?.id || 'u1'); // Default to current user
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [splitType, setSplitType] = useState('equal');
    const [customSplits, setCustomSplits] = useState({});
    const [selectedGroupId, setSelectedGroupId] = useState(preSelectedGroupId || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [newFriend, setNewFriend] = useState({ name: '', email: '' });
    const [isAddingFriend, setIsAddingFriend] = useState(false);

    // Initialize friends selection if group is pre-selected
    useEffect(() => {
        if (preSelectedGroup) {
            // Filter out current user from checkboxes, assume implicit participation for now
            const friendsInGroup = preSelectedGroup.members.filter(id => id !== 'u1' && id !== 'me' && id !== user?.id);
            setSelectedFriends(friendsInGroup);
        }
    }, [preSelectedGroup, user]);

    // Pre-fill data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const expenseToEdit = expenses.find(e => e.id === expenseId || e._id === expenseId);
            if (expenseToEdit) {
                setDescription(expenseToEdit.description);
                setAmount(expenseToEdit.amount.toString());
                setPayerId(expenseToEdit.payerId);
                setSelectedFriends(expenseToEdit.selectedFriends || []);
                setSelectedGroupId(expenseToEdit.groupId || '');

                // If it's a custom split, we might need to reconstruct customSplits state
                // but for simplicity in this version, we'll favor the calculated splits.
                // However, let's try to restore custom splits if they exist.
                if (expenseToEdit.splitDetails) {
                    const splits = {};
                    expenseToEdit.splitDetails.forEach(s => {
                        splits[s.userId] = s.amount.toString();
                    });
                    setCustomSplits(splits);
                }
            }
        }
    }, [isEditMode, expenseId, expenses]);

    // Update payer default when user loads (only if not editing)
    useEffect(() => {
        if (user?.id && !isEditMode) setPayerId(user.id);
    }, [user, isEditMode]);

    // Filter friends list based on selected group
    const filteredFriends = useMemo(() => {
        if (!selectedGroupId) return friends;
        const currentGroup = groups.find(g => g.id === selectedGroupId);
        if (!currentGroup) return friends;
        // Keep friends who are in the group members list
        return friends.filter(f => currentGroup.members.includes(f.id));
    }, [friends, groups, selectedGroupId]);

    const toggleFriend = (friendId) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const splitDetails = useMemo(() => {
        if (!amount) return [];

        const totalAmount = parseFloat(amount);
        // Participants = Selected Friends + Current User (Always included in this simple version)
        const participants = selectedFriends.length + 1;

        if (splitType === 'equal') {
            const perPersonBase = Math.floor((totalAmount / participants) * 100) / 100;
            const remainderCents = Math.round((totalAmount - (perPersonBase * participants)) * 100);

            return [
                {
                    userId: user?.id || 'u1',
                    name: 'You',
                    amount: perPersonBase + (remainderCents > 0 ? 0.01 : 0)
                },
                ...selectedFriends.map((friendId, index) => ({
                    userId: friendId,
                    name: friends.find(f => f.id === friendId)?.name || 'Unknown',
                    amount: perPersonBase + (index + 1 < remainderCents ? 0.01 : 0)
                }))
            ];
        } else if (splitType === 'custom') {
            return [
                { userId: user?.id || 'u1', name: 'You', amount: parseFloat(customSplits[user?.id || 'u1'] || 0) },
                ...selectedFriends.map(friendId => ({
                    userId: friendId,
                    name: friends.find(f => f.id === friendId)?.name || 'Unknown',
                    amount: parseFloat(customSplits[friendId] || 0)
                }))
            ];
        }
        return [];
    }, [amount, selectedFriends, splitType, customSplits, friends, user]);

    const handleCustomSplitChange = (userId, value) => {
        setCustomSplits(prev => ({ ...prev, [userId]: value }));
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (newFriend.name && newFriend.email && !isAddingFriend) {
            setIsAddingFriend(true);
            try {
                const addedFriend = await addFriend(newFriend);
                if (addedFriend && addedFriend.id) {
                    setSelectedFriends(prev => [...prev, addedFriend.id]);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description || selectedFriends.length === 0 || isSaving) {
            if (!isSaving) alert('Please fill in all fields and select at least one friend');
            return;
        }

        if (splitType === 'custom') {
            const totalSplit = splitDetails.reduce((sum, split) => sum + split.amount, 0);
            if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
                alert(`Split amounts must add up to ₹${amount}. Current total: ₹${totalSplit.toFixed(2)}`);
                return;
            }
        }

        const expenseData = {
            payerId: payerId,
            description,
            amount: parseFloat(amount),
            selectedFriends,
            groupId: selectedGroupId || null,
            splitDetails: (splitDetails || []).map(s => ({ userId: s.userId, amount: s.amount }))
        };

        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateExpense(expenseId, expenseData);
            } else {
                await addExpense(expenseData);
            }

            if (selectedGroupId) {
                navigate(`/group/${selectedGroupId}`);
            } else {
                navigate('/');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="add-expense-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="page-title">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h2>
                <div style={{ width: '24px' }}></div>
            </div>

            <form onSubmit={handleSubmit} className="expense-form">
                {/* Basic Details */}
                <div className="form-section">
                    <div className="input-group">
                        <div className="input-icon">📝</div>
                        <input
                            type="text"
                            placeholder="Enter a description"
                            className="input-field"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon">₹</div>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="input-field large"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {/* Payer Selection */}
                    <div className="input-group" style={{ paddingTop: '1rem' }}>
                        <span style={{ marginRight: '1rem', fontWeight: 500 }}>Paid By:</span>
                        <select
                            value={payerId}
                            onChange={(e) => setPayerId(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flex: 1 }}
                        >
                            <option value={user?.id || 'u1'}>You</option>
                            {filteredFriends.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Group Selection */}
                    <div className="input-group" style={{ borderBottom: 'none', paddingTop: '1rem' }}>
                        <span style={{ marginRight: '1rem', fontWeight: 500 }}>Group:</span>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => {
                                setSelectedGroupId(e.target.value);
                                const grp = groups.find(g => g.id === e.target.value);
                                if (grp) {
                                    const friendsInGroup = grp.members.filter(id => id !== 'u1' && id !== 'me' && id !== user?.id);
                                    setSelectedFriends(friendsInGroup);
                                }
                            }}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="">No Group</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Split with</span>
                        <button
                            type="button"
                            onClick={() => setShowAddFriendModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'var(--primary-light)',
                                color: 'var(--primary-color)',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <UserPlus size={14} />
                            Add Friend
                        </button>
                    </div>
                    <div className="friend-selector">
                        {friends.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center', padding: '1rem' }}>
                                No friends yet. Add one to start splitting!
                            </p>
                        ) : (
                            filteredFriends.map((friend) => (
                                <label key={friend.id} className="friend-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedFriends.includes(friend.id)}
                                        onChange={() => toggleFriend(friend.id)}
                                    />
                                    <span className="friend-name">{friend.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* Split Type Selection */}
                {selectedFriends.length > 0 && (
                    <div className="form-section">
                        <div className="section-header">Split Type</div>
                        <div className="split-options">
                            <button
                                type="button"
                                className={`split-option-btn ${splitType === 'equal' ? 'active' : ''}`}
                                onClick={() => setSplitType('equal')}
                            >
                                Equal
                            </button>
                            <button
                                type="button"
                                className={`split-option-btn ${splitType === 'custom' ? 'active' : ''}`}
                                onClick={() => setSplitType('custom')}
                            >
                                Custom
                            </button>
                        </div>

                        {/* Split Details */}
                        <div className="split-details">
                            {splitDetails.map((split) => (
                                <div key={split.userId} className="split-item">
                                    <span className="split-person">{split.name}</span>
                                    {splitType === 'equal' ? (
                                        <span className="split-amount">₹{split.amount.toFixed(2)}</span>
                                    ) : (
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="custom-amount-input"
                                            value={customSplits[split.userId] || ''}
                                            onChange={(e) => handleCustomSplitChange(split.userId, e.target.value)}
                                            placeholder="0.00"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="submit-section">
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={!description || !amount || selectedFriends.length === 0 || isSaving}
                    >
                        <Check size={20} />
                        {isSaving ? 'Saving...' : (isEditMode ? 'Update Expense' : 'Save Expense')}
                    </button>
                </div>
            </form>
            {/* Add Friend Modal */}
            {showAddFriendModal && (
                <div className="modal-backdrop">
                    <div className="form-section shadow-lg" style={{ width: '100%', maxWidth: '400px', margin: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Add Friend</h3>
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
                                    type="text"
                                    placeholder="Friend's name"
                                    className="input-field"
                                    style={{ borderBottom: '1px solid var(--border-color)', width: '100%', padding: '0.5rem 0' }}
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
                                    placeholder="Friend's email"
                                    className="input-field"
                                    style={{ borderBottom: '1px solid var(--border-color)', width: '100%', padding: '0.5rem 0' }}
                                    value={newFriend.email}
                                    onChange={(e) => setNewFriend({ ...newFriend, email: e.target.value })}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="submit-btn"
                                style={{ marginTop: '0.5rem' }}
                                disabled={isAddingFriend}
                            >
                                {isAddingFriend ? 'Adding...' : 'Add Friend'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddExpense;

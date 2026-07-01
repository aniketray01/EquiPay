import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, HandCoins, Users } from 'lucide-react';
import '../components/styles/AddExpense.css'; // Reusing expense form styles

const SettleUp = () => {
    const navigate = useNavigate();
    const { addExpense, friends, groups } = useExpenses();
    const { user } = useAuth(); // 'u1'

    const [recipientId, setRecipientId] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('unset');
    const [amount, setAmount] = useState('');

    // Reset group if recipient changes and not in selected group
    React.useEffect(() => {
        if (selectedGroupId && selectedGroupId !== 'unset' && recipientId) {
            const group = groups.find(g => g.id === selectedGroupId || g._id === selectedGroupId);
            if (!group || !group.members.includes(recipientId)) {
                setSelectedGroupId('unset');
            }
        }
    }, [recipientId, selectedGroupId, groups]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!recipientId || !amount) return;

        const payment = {
            payerId: user?.id || 'u1',   // I am paying
            recipientId: recipientId,
            payeeId: recipientId,        // The recipient
            amount: parseFloat(amount),
            description: `Payment to ${friends.find(f => f.id === recipientId)?.name || 'friend'}`,
            type: 'settlement',          // Special type
            groupId: selectedGroupId === 'private' ? null : selectedGroupId,
            date: new Date().toISOString(),
            splitDetails: [] // No splits for direct payment
        };

        addExpense(payment);
        alert(`Payment of ₹${amount} recorded!`);
        navigate('/');
    };

    return (
        <div className="add-expense-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="page-title">Settle Up</h2>
                <div style={{ width: '24px' }}></div>
            </div>

            <form onSubmit={handleSubmit} className="expense-form">
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#ecfdf5',
                    borderRadius: 'var(--radius-md)',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        width: '32px', height: '32px', background: 'var(--card-bg)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <HandCoins size={16} color="#059669" />
                    </div>
                    Record a payment you made to a friend.
                </div>

                <div className="form-section">
                    {/* Recipient */}
                    <div className="input-group">
                        <span style={{ marginRight: '1rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-medium)', minWidth: '60px' }}>
                            To
                        </span>
                        <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select Friend</option>
                            {friends.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Group Selection */}
                    <div className="input-group">
                        <span style={{ marginRight: '1rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-medium)', minWidth: '60px' }}>
                            Group
                        </span>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="unset" disabled>Select context...</option>
                            <option value="private">Private (Non-Group Payment)</option>
                            {groups
                                .filter(g => recipientId && g.members.includes(recipientId))
                                .map(g => (
                                    <option key={g.id || g._id} value={g.id || g._id}>{g.name}</option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Amount */}
                    <div className="input-group" style={{ borderBottom: 'none' }}>
                        <div className="input-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                            ₹
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="input-field large"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            style={{ color: 'var(--success)' }}
                        />
                    </div>
                </div>

                <div className="submit-section">
                    <button
                        type="submit"
                        className="submit-btn"
                        style={{ backgroundColor: 'var(--success)', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
                        disabled={!recipientId || !amount || selectedGroupId === 'unset'}
                    >
                        <Check size={20} />
                        Record Payment
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettleUp;

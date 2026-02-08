import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, HandCoins } from 'lucide-react';
import '../components/styles/AddExpense.css'; // Reusing similar styles

const SettleUp = () => {
    const navigate = useNavigate();
    const { addExpense, friends, groups } = useExpenses();
    const { user } = useAuth(); // 'u1'

    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');

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
            groupId: selectedGroupId || null,
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
                <div className="info-text" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                    <HandCoins size={20} style={{ display: 'inline', marginRight: '8px' }} />
                    Record a cash or online payment you made.
                </div>

                <div className="form-section">
                    {/* Recipient */}
                    <div className="input-group">
                        <span style={{ marginRight: '1rem', fontWeight: 500, minWidth: '60px' }}>To:</span>
                        <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
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
                        <span style={{ marginRight: '1rem', fontWeight: 500, minWidth: '60px' }}>Group:</span>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="">No Group (Private)</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div className="input-group">
                        <div className="input-icon">₹</div>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="input-field large"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="submit-section">
                    <button
                        type="submit"
                        className="submit-btn"
                        style={{ backgroundColor: 'var(--success)' }}
                        disabled={!recipientId || !amount}
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

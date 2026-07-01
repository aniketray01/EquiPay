import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Pencil, Trash2, Receipt, Search, Filter } from 'lucide-react';
import '../components/styles/AllExpenses.css';
import { useState } from 'react';

const AllExpenses = () => {
    const { user } = useAuth();
    const { expenses, friends, deleteExpense } = useExpenses();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const getPayerName = (payerId) => {
        if (payerId === user?.id || payerId === 'u1' || payerId === 'me') return 'You';
        const friend = friends.find(f => f.id === payerId);
        return friend ? friend.name : 'Someone';
    };

    const getParticipantNames = (expense) => {
        if (expense.type === 'settlement') return 'N/A';

        const { selectedFriends, payerId, splitDetails } = expense;
        const myId = user?.id || 'u1';

        let participantIds = [];
        if (splitDetails && splitDetails.length > 0) {
            participantIds = splitDetails.map(s => s.userId);
        } else {
            if (!selectedFriends || selectedFriends.length === 0) return 'No one';
            participantIds = [...selectedFriends];
            if (payerId && !participantIds.includes(payerId)) {
                participantIds.push(payerId);
            }
            if (!participantIds.includes(myId)) {
                participantIds.push(myId);
            }
        }

        const names = participantIds.map(fid => {
            if (fid === user?.id || fid === 'u1' || fid === 'me') return 'You';
            return friends.find(f => f.id === fid)?.name || 'Unknown';
        });

        if (names.length > 2) {
            return `${names[0]}, ${names[1]} +${names.length - 2} more`;
        }
        return names.join(', ');
    };

    const filteredExpenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPayerName(expense.payerId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="all-expenses-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="section-title" style={{ fontSize: '1.5rem', margin: 0 }}>All Expenses</h2>

                {/* Search Bar */}
                <div className="input-group" style={{ maxWidth: '300px', padding: '0.5rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)' }}>
                    <Search size={18} style={{ color: 'var(--text-light)', marginRight: '0.5rem' }} />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ fontSize: '0.9rem' }}
                    />
                </div>
            </div>

            <div className="expenses-card">
                {/* Desktop Header */}
                <div className="expenses-header">
                    <div className="col-date">Date</div>
                    <div className="col-desc">Description</div>
                    <div className="col-payer">Payer</div>
                    <div className="col-split">Split With</div>
                    <div className="col-amount">Amount</div>
                    <div className="col-actions"></div>
                </div>

                {/* Expenses List */}
                <div className="expenses-list-content">
                    {filteredExpenses.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-medium)' }}>
                            <Receipt size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No expenses found.</p>
                        </div>
                    ) : (
                        filteredExpenses.map(expense => {
                            const isPayer = expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me';

                            return (
                                <div key={expense.id} className="expense-item">
                                    <div className="col-date">
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                                            {new Date(expense.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            {new Date(expense.date).getFullYear()}
                                        </div>
                                    </div>

                                    <div className="col-desc">
                                        <div className="category-icon">
                                            {expense.type === 'settlement' ? '💸' : '📝'}
                                        </div>
                                        <div>
                                            {expense.description}
                                            {expense.groupName && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    marginLeft: '0.5rem',
                                                    padding: '2px 6px',
                                                    background: 'var(--secondary-color)',
                                                    borderRadius: '4px',
                                                    color: 'var(--text-medium)'
                                                }}>
                                                    {expense.groupName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-payer">
                                        {getPayerName(expense.payerId)}
                                    </div>

                                    <div className="col-split">
                                        {getParticipantNames(expense)}
                                    </div>

                                    <div className={`col-amount ${isPayer ? 'amount-positive' : 'amount-negative'}`}>
                                        {isPayer ? '+' : '-'} ₹{expense.amount.toFixed(2)}
                                    </div>

                                    <div className="col-actions">
                                        <button
                                            onClick={() => navigate(`/edit-expense/${expense.id}`)}
                                            className="action-btn-icon"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this expense?')) {
                                                    deleteExpense(expense.id);
                                                }
                                            }}
                                            className="action-btn-icon delete"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllExpenses;

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Pencil, Trash2 } from 'lucide-react';
import '../components/styles/Dashboard.css';

const AllExpenses = () => {
    const { user } = useAuth();
    const { expenses, friends, deleteExpense } = useExpenses();
    const navigate = useNavigate();

    const getPayerName = (payerId) => {
        if (payerId === user?.id || payerId === 'u1' || payerId === 'me') return 'You';
        return friends.find(f => f.id === payerId)?.name || 'Someone';
    };

    const getParticipantNames = (expense) => {
        const { selectedFriends, payerId } = expense;
        if (!selectedFriends || selectedFriends.length === 0) return 'No one';

        const participantIds = [...selectedFriends];
        if (payerId && !participantIds.includes(payerId)) {
            participantIds.push(payerId);
        }

        return participantIds.map(fid => {
            if (fid === user?.id || fid === 'u1' || fid === 'me') return 'You';
            return friends.find(f => f.id === fid)?.name || 'Unknown Friend';
        }).join(', ');
    };

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">All Expenses</h2>

            <div className="activity-card">
                <div className="activity-list">
                    {expenses.length === 0 ? (
                        <p className="activity-detail">No expenses yet. Click "Add Expense" to create one!</p>
                    ) : (
                        expenses.map(expense => (
                            <div key={expense.id} className="activity-item" style={{ position: 'relative' }}>
                                <div className="activity-icon">💰</div>
                                <div className="activity-info">
                                    <p className="activity-desc">{expense.description}</p>
                                    <p className="activity-detail">
                                        Paid by: {getPayerName(expense.payerId)} (₹{expense.amount.toFixed(2)})
                                    </p>
                                    <p className="activity-detail">
                                        Split with: {getParticipantNames(expense)}
                                    </p>
                                </div>
                                <div className="activity-amount" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <button
                                            onClick={() => navigate(`/edit-expense/${expense.id}`)}
                                            style={{ color: 'var(--text-light)', padding: '4px', borderRadius: '4px' }}
                                            className="hover-card"
                                            title="Edit Expense"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this expense?')) {
                                                    deleteExpense(expense.id);
                                                }
                                            }}
                                            style={{ color: 'var(--danger)', padding: '4px', borderRadius: '4px', opacity: 0.7 }}
                                            className="hover-card"
                                            title="Delete Expense"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className={`amount-text ${expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me' ? 'positive' : 'negative'}`}>
                                        ₹{expense.amount.toFixed(2)}
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

export default AllExpenses;

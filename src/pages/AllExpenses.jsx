import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import '../components/styles/Dashboard.css';

const AllExpenses = () => {
    const { user } = useAuth();
    const { expenses, friends } = useExpenses();

    const getPayerName = (payerId) => {
        if (payerId === user?.id || payerId === 'u1' || payerId === 'me') return 'You';
        return friends.find(f => f.id === payerId)?.name || 'Someone';
    };

    const getFriendNames = (friendIds) => {
        if (!friendIds || friendIds.length === 0) return 'No one';
        return friendIds.map(fid => {
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
                                        Split with: {getFriendNames(expense.selectedFriends)}
                                    </p>
                                </div>
                                <div className="activity-amount" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
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

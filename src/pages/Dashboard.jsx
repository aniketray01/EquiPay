import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Zap, List } from 'lucide-react';
import ExpenseChart from '../components/ExpenseChart';
import DebtSimplifier from '../components/DebtSimplifier';
import '../components/styles/Dashboard.css';

// Simplified Balance Card Internal Component
const BalanceCard = ({ title, amount, type = 'neutral' }) => {
    let colorClass = '';
    let subText = 'settled up';

    if (type === 'positive') {
        colorClass = 'positive';
        subText = 'you are owed';
    } else if (type === 'negative') {
        colorClass = 'negative';
        subText = 'you owe';
    }

    const formattedAmount = Math.abs(amount).toFixed(2);

    return (
        <div className="balance-card">
            <p className="card-label">{title}</p>
            <div className={`card-value ${colorClass}`}>
                <span>₹{formattedAmount}</span>
            </div>
            {amount !== 0 && (
                <span className="card-subtext">{subText}</span>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { balances, expenses, groups, friends } = useExpenses();
    const navigate = useNavigate();
    const [showSimplified, setShowSimplified] = React.useState(false);

    const getGroupName = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : null;
    };

    const getPayerName = (payerId) => {
        if (!payerId) return 'Someone';
        if (payerId === user?.id || payerId === 'u1' || payerId === 'me') return 'You';
        const friend = friends.find(f => f.id === payerId);
        return friend ? friend.name : 'Someone';
    };

    const getParticipantNames = (expense) => {
        const { selectedFriends, payerId } = expense;
        if (!selectedFriends || selectedFriends.length === 0) return 'No one';

        // Include payer in the participants list if not already there
        const participantIds = [...selectedFriends];
        if (payerId && !participantIds.includes(payerId)) {
            participantIds.push(payerId);
        }

        return participantIds.map(fid => {
            if (fid === user?.id || fid === 'u1' || fid === 'me') return 'You';
            const friend = friends.find(f => f.id === fid);
            return friend ? friend.name : 'Someone';
        }).join(', ');
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">Overview</h2>
                <div className="action-buttons">
                    <div style={{
                        display: 'flex',
                        backgroundColor: 'var(--secondary-color)',
                        padding: '4px',
                        borderRadius: 'var(--radius-md)',
                        marginRight: '0.5rem'
                    }}>
                        <button
                            onClick={() => setShowSimplified(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: !showSimplified ? 'var(--white)' : 'transparent',
                                color: !showSimplified ? 'var(--primary-color)' : 'var(--text-light)',
                                boxShadow: !showSimplified ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <List size={16} />
                            Activity
                        </button>
                        <button
                            onClick={() => setShowSimplified(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: showSimplified ? 'var(--white)' : 'transparent',
                                color: showSimplified ? 'var(--primary-color)' : 'var(--text-light)',
                                boxShadow: showSimplified ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <Zap size={16} />
                            Simplify
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/add-expense')}
                        className="btn btn-orange"
                    >
                        Add Expense
                    </button>
                    <button
                        onClick={() => navigate('/settle-up')}
                        className="btn btn-primary"
                    >
                        Settle Up
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <BalanceCard title="Total Balance" amount={balances.total} type={balances.total >= 0 ? 'positive' : 'negative'} />
                <BalanceCard title="You are owed" amount={balances.owed} type="positive" />
                <BalanceCard title="You owe" amount={balances.owe} type="negative" />
            </div>

            {/* Main Content: Chart + Recent Activity */}
            <div className="dashboard-main">
                <div className="chart-card">
                    <ExpenseChart />
                </div>

                {/* Recent Activity Card */}
                <div className="activity-card">
                    <h3 className="section-title">
                        {showSimplified ? 'Optimized Settlements' : 'Recent Activity'}
                    </h3>
                    <div className="activity-list">
                        {showSimplified ? (
                            <DebtSimplifier groupId={null} />
                        ) : (
                            expenses.length === 0 ? (
                                <p className="activity-detail">No recent activity.</p>
                            ) : (
                                expenses.slice(0, 10).map(expense => {
                                    const groupName = getGroupName(expense.groupId);
                                    const isSettlement = expense.type === 'settlement';
                                    const isPayer = expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me';
                                    const isPayee = expense.payeeId === user?.id || expense.payeeId === 'u1' || expense.payeeId === 'me';

                                    // Calculate what to show for amount
                                    let displayAmount = 0;
                                    if (isSettlement) {
                                        displayAmount = expense.amount;
                                    } else {
                                        // For regular expenses, show my share or the amount others owe me
                                        const myShare = expense.splitDetails?.find(s => s.userId === user?.id || s.userId === 'u1' || s.userId === 'me')?.amount || 0;
                                        displayAmount = isPayer ? (expense.amount - myShare) : myShare;
                                    }

                                    return (
                                        <div key={expense.id} className="activity-item">
                                            <div className="activity-icon">
                                                {isSettlement ? '🤝' : '📝'}
                                            </div>
                                            <div className="activity-info">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <p className="activity-desc">{expense.description}</p>
                                                    {groupName && (
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            backgroundColor: 'var(--primary-light)',
                                                            color: 'var(--primary-color)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: 500
                                                        }}>
                                                            {groupName}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="activity-detail">
                                                    {isSettlement
                                                        ? `${getPayerName(expense.payerId)} paid ${getPayerName(expense.payeeId)} ₹${expense.amount.toFixed(2)}`
                                                        : `${getPayerName(expense.payerId)} paid ₹${expense.amount.toFixed(2)}`
                                                    }
                                                </p>
                                                {!isSettlement && (
                                                    <p className="activity-detail" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                        Split with: {getParticipantNames(expense)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="activity-amount">
                                                <p className={`amount-text ${isPayer ? 'positive' : 'negative'}`}>
                                                    {isSettlement
                                                        ? (isPayer ? 'payment sent' : 'payment received')
                                                        : (isPayer ? 'you lent' : 'you owe')
                                                    }
                                                </p>
                                                <p className={`amount-text ${isPayer ? 'positive' : 'negative'}`}>
                                                    ₹{displayAmount.toFixed(2)}
                                                </p>
                                                <p className="activity-date">{new Date(expense.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

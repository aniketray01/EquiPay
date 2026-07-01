import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Zap, List, Plus, HandCoins, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import ExpenseChart from '../components/ExpenseChart';
import DebtSimplifier from '../components/DebtSimplifier';
import '../components/styles/Dashboard.css';

// Simplified Balance Card Internal Component
const BalanceCard = ({ title, amount, type = 'neutral', icon: Icon }) => {
    let colorClass = '';
    let subText = 'All settled up';
    let iconClass = 'primary';

    if (type === 'positive') {
        colorClass = 'positive';
        subText = 'you are owed';
        iconClass = 'success';
    } else if (type === 'negative') {
        colorClass = 'negative';
        subText = 'you owe';
        iconClass = 'danger';
    }

    const formattedAmount = Math.abs(amount).toFixed(2);

    return (
        <div className="balance-card">
            <div className="card-header">
                <div className={`card-icon ${iconClass}`}>
                    <Icon size={20} />
                </div>
                <p className="card-label">{title}</p>
            </div>
            <div className={`card-value ${colorClass}`}>
                <span>₹{formattedAmount}</span>
            </div>
            {amount !== 0 && (
                <span className="card-subtext">{subText}</span>
            )}
            {amount === 0 && (
                <span className="card-subtext">No outstanding balance</span>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { balances, expenses, groups, friends, deleteExpense } = useExpenses();
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
                    <div className="view-toggle" style={{
                        display: 'flex',
                        backgroundColor: 'var(--secondary-color)',
                        padding: '4px',
                        borderRadius: 'var(--radius-full)',
                        marginRight: '1rem'
                    }}>
                        <button
                            onClick={() => setShowSimplified(false)}
                            className={!showSimplified ? 'btn btn-secondary' : 'btn'}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                borderRadius: 'var(--radius-full)',
                                border: !showSimplified ? '1px solid var(--border-color)' : 'none',
                                backgroundColor: !showSimplified ? 'var(--card-bg)' : 'transparent',
                                boxShadow: !showSimplified ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <List size={16} />
                            Activity
                        </button>
                        <button
                            onClick={() => setShowSimplified(true)}
                            className={showSimplified ? 'btn btn-secondary' : 'btn'}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                borderRadius: 'var(--radius-full)',
                                border: showSimplified ? '1px solid var(--border-color)' : 'none',
                                backgroundColor: showSimplified ? 'var(--card-bg)' : 'transparent',
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
                        <Plus size={18} />
                        Add Expense
                    </button>
                    <button
                        onClick={() => navigate('/settle-up')}
                        className="btn btn-primary"
                    >
                        <HandCoins size={18} />
                        Settle Up
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <BalanceCard
                    title="Total Balance"
                    amount={balances.total}
                    type={balances.total >= 0 ? 'positive' : 'negative'}
                    icon={Wallet}
                />
                <BalanceCard
                    title="You are owed"
                    amount={balances.owed}
                    type="positive"
                    icon={ArrowDownLeft}
                />
                <BalanceCard
                    title="You owe"
                    amount={balances.owe}
                    type="negative"
                    icon={ArrowUpRight}
                />
            </div>

            {/* Main Content: Chart + Recent Activity */}
            <div className="dashboard-main">
                <div className="content-card chart-container">
                    <div className="card-title-bar">
                        <h3 className="section-title">Expense Trend</h3>
                    </div>
                    <ExpenseChart />
                </div>

                {/* Recent Activity Card */}
                <div className="content-card">
                    <div className="card-title-bar">
                        <h3 className="section-title">
                            {showSimplified ? 'Optimized Settlements' : 'Recent Activity'}
                        </h3>
                    </div>
                    <div className="activity-list">
                        {showSimplified ? (
                            <div style={{ padding: '1rem' }}>
                                <DebtSimplifier groupId={null} />
                            </div>
                        ) : (
                            expenses.length === 0 ? (
                                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No recent activity.</p>
                            ) : (
                                expenses.slice(0, 10).map(expense => {
                                    const groupName = getGroupName(expense.groupId);
                                    const isSettlement = expense.type === 'settlement';
                                    const isPayer = expense.payerId === user?.id || expense.payerId === 'u1' || expense.payerId === 'me';

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
                                            <div className="activity-avatar" style={{
                                                backgroundColor: isSettlement ? 'var(--primary-light)' : 'var(--secondary-color)',
                                                color: isSettlement ? 'var(--success)' : 'var(--text-medium)'
                                            }}>
                                                {isSettlement ? <HandCoins size={20} /> : <List size={20} />}
                                            </div>
                                            <div className="activity-content">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <p className="activity-desc">{expense.description}</p>
                                                    {groupName && (
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            backgroundColor: 'var(--primary-light)',
                                                            color: 'var(--primary-color)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {groupName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="activity-meta">
                                                    <span>
                                                        {isSettlement
                                                            ? `${getPayerName(expense.payerId)} paid ${getPayerName(expense.payeeId)}`
                                                            : `${getPayerName(expense.payerId)} paid ₹${expense.amount.toFixed(2)}`
                                                        }
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="activity-amount">
                                                <p className={`amount ${isPayer ? 'positive' : 'negative'}`}>
                                                    {isPayer ? '+' : '-'} ₹{displayAmount.toFixed(2)}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500 }}>
                                                    {isSettlement
                                                        ? (isPayer ? 'sent' : 'received')
                                                        : (isPayer ? 'lent' : 'borrowed')
                                                    }
                                                </p>
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

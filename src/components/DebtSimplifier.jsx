import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { ArrowRight } from 'lucide-react';

const DebtSimplifier = ({ groupId }) => {
    const { user } = useAuth();
    const { getSimplifiedDebts, friends } = useExpenses();
    const transactions = getSimplifiedDebts(groupId);

    const getName = (id) => {
        const idStr = String(id);
        const currentUserId = user?.id ? String(user.id) : null;

        if (idStr === currentUserId || idStr === 'u1' || idStr === 'me') return 'You';

        const friend = friends.find(f => String(f.id) === idStr);
        return friend ? friend.name : 'Someone';
    };

    if (transactions.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>
                <p>Everything is settled up! No transactions needed.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {transactions.map((t, index) => (
                <div key={index} className="balance-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderLeft: `4px solid ${t.from === (user?.id || 'u1') ? 'var(--danger)' : 'var(--success)'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>Pays</p>
                            <p style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{getName(t.from)}</p>
                        </div>

                        <div style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
                            <ArrowRight size={20} />
                        </div>

                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>Receives</p>
                            <p style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{getName(t.to)}</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                            ${t.amount.toFixed(2)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DebtSimplifier;

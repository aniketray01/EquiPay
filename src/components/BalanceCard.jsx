import React from 'react';

const BalanceCard = ({ title, amount, type = 'neutral' }) => {
    let colorClass = 'text-gray-900';
    let subText = 'settled up';

    if (type === 'positive') {
        colorClass = 'text-emerald-600'; // Var usage
        subText = 'you are owed';
    } else if (type === 'negative') {
        colorClass = 'text-orange-500';
        subText = 'you owe';
    }

    const formattedAmount = Math.abs(amount).toFixed(2);

    return (
        <div className="p-6 bg-white rounded-xl border shadow-sm" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {title}
            </p>
            <div className="mt-2 flex items-baseline">
                <span className={`text-3xl font-extrabold ${colorClass}`}
                    style={{
                        color: type === 'positive' ? 'hsl(var(--success))' : type === 'negative' ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'
                    }}
                >
                    ${formattedAmount}
                </span>
                {amount !== 0 && (
                    <span className="ml-2 text-sm text-gray-400" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {subText}
                    </span>
                )}
            </div>
        </div>
    );
};

export default BalanceCard;

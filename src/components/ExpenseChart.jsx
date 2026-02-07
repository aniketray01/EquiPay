import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';

const ExpenseChart = () => {
    const { expenses } = useExpenses();

    const chartData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = [];

        // Initialize last 7 days with 0 amount
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push({
                name: days[date.getDay()],
                amount: 0,
                fullDate: date.toISOString().split('T')[0]
            });
        }

        // Aggregate expense amounts
        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date).toISOString().split('T')[0];
            const dayEntry = last7Days.find(d => d.fullDate === expenseDate);
            if (dayEntry) {
                dayEntry.amount += expense.amount;
            }
        });

        return last7Days;
    }, [expenses]);

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <h3 className="section-title">Spending Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData}>
                    <YAxis hide domain={[0, 'auto']} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'white',
                            color: '#1e293b'
                        }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={'var(--primary-color)'} opacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenseChart;

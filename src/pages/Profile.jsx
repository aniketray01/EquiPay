import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Download, FileText } from 'lucide-react';
import '../components/styles/Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const { expenses, friends } = useExpenses();

    const stats = {
        totalExpenses: expenses.length,
        totalFriends: friends.length,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0)
    };

    const downloadJSON = () => {
        const dataStr = JSON.stringify(expenses, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'equipay_data_export.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const downloadCSV = () => {
        // Simple CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Description,Amount,Type,Payer,Split With\n";

        expenses.forEach(exp => {
            const date = new Date(exp.date).toLocaleDateString();
            const desc = exp.description.replace(/,/g, ''); // Remove commas to prevent break
            const amt = exp.amount;
            const type = exp.type || 'expense';
            const payer = exp.payerId === 'u1' ? 'You' : 'Friend';
            const friendsList = exp.selectedFriends?.map(fid => friends.find(f => f.id === fid)?.name).join(' & ') || '';

            csvContent += `${date},${desc},${amt},${type},${payer},${friendsList}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "equipay_transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <img
                    src={user?.avatar}
                    alt="Profile"
                    className="profile-avatar-large"
                />
                <h2 className="profile-name">{user?.name}</h2>
                <p className="profile-email">{user?.email}</p>
            </div>

            <div className="profile-section">
                <h3 className="section-title">Your Statistics</h3>
                <div className="profile-stats">
                    <div className="stat-item">
                        <div className="stat-value">{stats.totalExpenses}</div>
                        <div className="stat-label">Expenses</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{stats.totalFriends}</div>
                        <div className="stat-label">Friends</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">${stats.totalAmount.toFixed(0)}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                </div>
            </div>

            <div className="profile-section">
                <h3 className="section-title">Data & Privacy</h3>
                <p style={{ color: 'var(--text-medium)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Download a copy of your personal data.
                </p>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                    <button onClick={downloadJSON} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <FileText size={18} /> Export JSON
                    </button>
                    <button onClick={downloadCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;

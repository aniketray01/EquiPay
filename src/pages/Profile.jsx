import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Download, FileText, User, Mail, DollarSign, Users } from 'lucide-react';
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
                    src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
                    alt="Profile"
                    className="profile-avatar-large"
                />
                <h2 className="profile-name">{user?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-medium)' }}>
                    <Mail size={16} />
                    <p className="profile-email">{user?.email}</p>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-section">
                    <h3 className="section-title">
                        <User size={20} className="text-primary" />
                        Your Statistics
                    </h3>
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
                            <div className="stat-value">₹{stats.totalAmount.toFixed(0)}</div>
                            <div className="stat-label">Total Spent</div>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h3 className="section-title">
                        <FileText size={20} className="text-primary" />
                        Data & Privacy
                    </h3>
                    <p style={{ color: 'var(--text-medium)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Download a copy of your personal data for your records or portability.
                    </p>
                    <div className="export-grid">
                        <button onClick={downloadJSON} className="action-btn">
                            <FileText size={18} /> Export JSON
                        </button>
                        <button onClick={downloadCSV} className="action-btn">
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

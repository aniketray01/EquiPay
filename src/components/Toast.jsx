import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const getColors = () => {
        switch (type) {
            case 'expense_added': return { bg: 'var(--success-light)', text: 'var(--success)', icon: 'var(--success)' };
            case 'expense_updated': return { bg: 'var(--primary-light)', text: 'var(--primary-color)', icon: 'var(--primary-color)' };
            case 'expense_deleted': return { bg: 'var(--danger-light)', text: 'var(--danger)', icon: 'var(--danger)' };
            default: return { bg: 'var(--white)', text: 'var(--text-dark)', icon: 'var(--primary-color)' };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            right: '25px',
            zIndex: 9999,
            backgroundColor: colors.bg,
            color: colors.text,
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: `1px solid ${colors.icon}40`,
            animation: 'slideIn 0.3s ease-out',
            maxWidth: '350px'
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Bell size={20} style={{ color: colors.icon }} />
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Activity Alert</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>{message}</p>
            </div>
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, opacity: 0.5 }}
            >
                <X size={18} />
            </button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Toast;

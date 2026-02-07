import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { API_BASE_URL as BASE_URL } from '../config';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

const MOCK_FRIENDS = [];

const MOCK_GROUPS = [];

export const API_BASE_URL = BASE_URL;

export const ExpenseProvider = ({ children }) => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(async () => {
        if (!user) return;
        try {
            // 1. Fetch from Backend
            const [expRes, friendRes, groupRes] = await Promise.all([
                fetch(`${API_BASE_URL}/expenses/${user.id}`),
                fetch(`${API_BASE_URL}/friends/${user.id}`),
                fetch(`${API_BASE_URL}/groups/${user.id}`)
            ]);

            const dbExpenses = await expRes.json();
            const dbFriends = await friendRes.json();
            const dbGroups = await groupRes.json();

            // Normalize IDs (ensure every object has 'id' property for frontend compatibility)
            const normalize = (items) => items.map(item => ({
                ...item,
                id: item.id || item.friendId || item._id
            }));

            setExpenses(normalize(dbExpenses));
            setFriends(normalize(dbFriends));
            setGroups(normalize(dbGroups));
        } catch (err) {
            console.error("Error refreshing data:", err);
        }
    }, [user]);

    // Initial Data Fetch & Migration
    useEffect(() => {
        if (!user) return;

        const initialFetch = async () => {
            try {
                // 1. Check migrations while fetching
                const [expRes, friendRes, groupRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/expenses/${user.id}`),
                    fetch(`${API_BASE_URL}/friends/${user.id}`),
                    fetch(`${API_BASE_URL}/groups/${user.id}`)
                ]);

                const dbExpenses = await expRes.json();
                const dbFriends = await friendRes.json();
                const dbGroups = await groupRes.json();

                // 2. Granular Migration
                let currentExpenses = [...dbExpenses];
                let currentFriends = [...dbFriends];
                let currentGroups = [...dbGroups];

                const localExp = JSON.parse(localStorage.getItem('equipay_expenses') || '[]');
                const localFriends = JSON.parse(localStorage.getItem('equipay_friends') || '[]');
                const localGroups = JSON.parse(localStorage.getItem('equipay_groups') || '[]');

                // Migrate Friends if DB is empty for them
                if (currentFriends.length === 0 && localFriends.length > 0) {
                    currentFriends = await Promise.all(localFriends.map(f =>
                        fetch(`${API_BASE_URL}/friends`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...f, userId: user.id })
                        }).then(res => res.json())
                    ));
                    localStorage.removeItem('equipay_friends');
                }

                // Migrate Groups if DB is empty for them
                if (currentGroups.length === 0 && localGroups.length > 0) {
                    currentGroups = await Promise.all(localGroups.map(g =>
                        fetch(`${API_BASE_URL}/groups`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...g, userId: user.id })
                        }).then(res => res.json())
                    ));
                    localStorage.removeItem('equipay_groups');
                }

                // Migrate Expenses if DB is empty for them
                if (currentExpenses.length === 0 && localExp.length > 0) {
                    currentExpenses = await Promise.all(localExp.map(e =>
                        fetch(`${API_BASE_URL}/expenses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...e, userId: user.id })
                        }).then(res => res.json())
                    ));
                    localStorage.removeItem('equipay_expenses');
                }

                // Normalize IDs (ensure every object has 'id' property for frontend compatibility)
                const normalize = (items) => items.map(item => ({
                    ...item,
                    id: item.id || item.friendId || item._id
                }));

                setExpenses(normalize(currentExpenses));
                setFriends(normalize(currentFriends));
                setGroups(normalize(currentGroups));
            } catch (err) {
                console.error("Error fetching data from server:", err);
            } finally {
                setLoading(false);
            }
        };

        initialFetch();
    }, [user]);

    // Socket Setup
    useEffect(() => {
        if (!user) return;

        const SOCKET_URL = API_BASE_URL.replace('/api', '');
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('join_room', user.id);
        });

        socket.on('data_updated', (payload) => {
            console.log('Data update received:', payload);
            refreshData();
        });

        return () => {
            socket.disconnect();
        };
    }, [user, refreshData]);

    // Self-healing: Ensure group members match valid friends (Useful client-side for immediate UI)
    useEffect(() => {
        if (!friends.length && !groups.length) return;
        const validFriendIds = new Set(friends.map(f => f.id));
        validFriendIds.add('u1');
        validFriendIds.add('me');

        let hasChanges = false;
        const cleanedGroups = groups.map(g => {
            const validMembers = g.members?.filter(id => validFriendIds.has(id)) || [];
            if (validMembers.length !== (g.members?.length || 0)) {
                hasChanges = true;
                return { ...g, members: validMembers };
            }
            return g;
        });

        if (hasChanges) {
            setGroups(cleanedGroups);
        }
    }, [friends, groups]);

    // Calculate balances derived from expenses
    const getBalances = useCallback((filterGroupId = null) => {
        let totalOwed = 0;
        let totalOwe = 0;

        const filteredExpenses = filterGroupId
            ? expenses.filter(e => e.groupId === filterGroupId)
            : expenses;

        filteredExpenses.forEach(exp => {
            const currentUserId = user?.id || 'u1';
            const isMe = (id) => id === currentUserId || id === 'me' || id === 'u1';

            // Handle Settlements
            if (exp.type === 'settlement') {
                const isPayer = isMe(exp.payerId);
                const isPayee = isMe(exp.payeeId);

                if (isPayer) {
                    totalOwe -= exp.amount;
                } else if (isPayee) {
                    totalOwed -= exp.amount;
                }
                return;
            }

            // Handle Regular Expenses
            const myShare = exp.splitDetails?.find(s => isMe(s.userId))?.amount || 0;
            const paidByMe = isMe(exp.payerId);

            if (paidByMe) {
                // I paid, so I am owed (Total - MyShare)
                totalOwed += (exp.amount - myShare);
            } else {
                // Someone else paid, I owe my share
                totalOwe += myShare;
            }
        });

        // Ensure non-negative display for cleanliness
        const finalOwed = Math.round(totalOwed * 100) / 100;
        const finalOwe = Math.round(totalOwe * 100) / 100;

        return {
            total: finalOwed - finalOwe,
            owed: Math.max(0, finalOwed),
            owe: Math.max(0, finalOwe)
        };
    }, [expenses, user]);

    const balances = useMemo(() => getBalances(), [getBalances]);

    const addExpense = useCallback(async (newExpense) => {
        try {
            const res = await fetch(`${API_BASE_URL}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newExpense, userId: user.id })
            });
            const data = await res.json();
            const normalizedData = { ...data, id: data.id || data._id };
            setExpenses(prev => [normalizedData, ...prev]);
        } catch (err) {
            console.error("Error adding expense:", err);
        }
    }, [user]);

    const addFriend = useCallback(async (newFriend) => {
        try {
            const normalizedEmail = newFriend.email.toLowerCase().trim();
            // Check if user exists in Splitwise Network first
            const searchRes = await fetch(`${API_BASE_URL}/users/search?query=${normalizedEmail}`);
            const users = await searchRes.json();
            const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

            const friendData = {
                ...newFriend,
                email: normalizedEmail,
                friendId: existingUser ? existingUser.firebaseId : `f${Date.now()}`,
                userId: user.id
            };

            const res = await fetch(`${API_BASE_URL}/friends`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(friendData)
            });
            const data = await res.json();
            setFriends(prev => [...prev, { ...data, id: data.id || data.friendId || data._id }]);
        } catch (err) {
            console.error("Error adding friend:", err);
        }
    }, [user]);

    const addGroup = useCallback(async (newGroup) => {
        try {
            const res = await fetch(`${API_BASE_URL}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newGroup, userId: user.id })
            });
            const data = await res.json();
            const normalizedData = { ...data, id: data.id || data._id };
            setGroups(prev => [...prev, normalizedData]);
        } catch (err) {
            console.error("Error adding group:", err);
        }
    }, [user]);

    const removeFriend = useCallback(async (friendId) => {
        try {
            await fetch(`${API_BASE_URL}/friends/${user.id}/${friendId}`, {
                method: 'DELETE'
            });
            setFriends(prev => prev.filter(f => f.id !== friendId && f.friendId !== friendId)); // Check both just in case
            // Also remove this friend from any groups they are part of (Ideally backend handles this, but keep for UI)
            setGroups(prev => prev.map(g => ({
                ...g,
                members: g.members.filter(mId => mId !== friendId)
            })));
        } catch (err) {
            console.error("Error removing friend:", err);
        }
    }, [user]);

    const addMemberToGroup = useCallback(async (groupId, friendId) => {
        try {
            const group = groups.find(g => g.id === groupId || g._id === groupId);
            if (!group) return;

            const updatedMembers = [...group.members, friendId];
            const res = await fetch(`${API_BASE_URL}/groups/${group._id || group.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: updatedMembers })
            });
            const data = await res.json();
            const normalizedData = { ...data, id: data.id || data._id };
            setGroups(prev => prev.map(g => (g._id === normalizedData._id || g.id === normalizedData.id) ? normalizedData : g));
        } catch (err) {
            console.error("Error adding member to group:", err);
        }
    }, [groups]);

    const deleteGroup = useCallback(async (groupId) => {
        try {
            await fetch(`${API_BASE_URL}/groups/${groupId}`, { method: 'DELETE' });
            setGroups(prev => prev.filter(g => (g.id !== groupId && g._id !== groupId)));
            setExpenses(prev => prev.filter(e => e.groupId !== groupId));
        } catch (err) {
            console.error("Error deleting group:", err);
        }
    }, []);

    const deleteExpense = useCallback(async (expenseId) => {
        try {
            await fetch(`${API_BASE_URL}/expenses/${expenseId}`, { method: 'DELETE' });
            setExpenses(prev => prev.filter(e => (e.id !== expenseId && e._id !== expenseId)));
        } catch (err) {
            console.error("Error deleting expense:", err);
        }
    }, []);

    const getSimplifiedDebts = useCallback((groupId) => {
        const currentUserId = user?.id ? String(user.id) : 'u1';
        const isMe = (id) => {
            const sid = String(id);
            return sid === currentUserId || sid === 'me' || sid === 'u1';
        };
        const normalizeId = (id) => isMe(id) ? currentUserId : String(id);

        // 1. Collect all participants and calculate net balances
        const netBalances = {};
        netBalances[currentUserId] = 0;

        let filteredExpenses = expenses;
        if (groupId) {
            const group = groups.find(g => g.id === groupId || g._id === groupId);
            if (!group) return [];
            group.members.forEach(memberId => {
                netBalances[normalizeId(memberId)] = 0;
            });
            filteredExpenses = expenses.filter(e => e.groupId === groupId || e.groupId === group._id);
        } else {
            // Global: include all friends and groups
            friends.forEach(f => {
                netBalances[normalizeId(f.id || f.friendId)] = 0;
            });
        }

        filteredExpenses.forEach(exp => {
            if (exp.type === 'settlement') {
                const payer = normalizeId(exp.payerId);
                const payee = normalizeId(exp.payeeId);
                netBalances[payer] = (netBalances[payer] || 0) + exp.amount;
                netBalances[payee] = (netBalances[payee] || 0) - exp.amount;
                return;
            }

            const payerId = normalizeId(exp.payerId);
            netBalances[payerId] = (netBalances[payerId] || 0) + exp.amount;

            (exp.splitDetails || []).forEach(split => {
                const splitUser = normalizeId(split.userId);
                netBalances[splitUser] = (netBalances[splitUser] || 0) - split.amount;
            });
        });

        // 2. Separate into debtors and creditors
        let debtors = [];
        let creditors = [];

        Object.entries(netBalances).forEach(([id, balance]) => {
            const amount = Math.round(balance * 100) / 100;
            if (amount <= -0.01) {
                debtors.push({ id, amount: Math.abs(amount) });
            } else if (amount >= 0.01) {
                creditors.push({ id, amount: amount });
            }
        });

        // 3. Greedy matching
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const simplifiedTransactions = [];
        let d = 0, c = 0;

        while (d < debtors.length && c < creditors.length) {
            const debtor = debtors[d];
            const creditor = creditors[c];
            const settlementAmount = Math.min(debtor.amount, creditor.amount);

            simplifiedTransactions.push({
                from: debtor.id,
                to: creditor.id,
                amount: settlementAmount
            });

            debtor.amount -= settlementAmount;
            creditor.amount -= settlementAmount;

            if (debtor.amount < 0.01) d++;
            if (creditor.amount < 0.01) c++;
        }

        return simplifiedTransactions;
    }, [expenses, friends, groups, user]);

    const contextValue = useMemo(() => ({
        expenses,
        friends,
        groups,
        loading,
        addExpense,
        addFriend,
        removeFriend,
        addGroup,
        addMemberToGroup,
        deleteGroup,
        deleteExpense,
        getSimplifiedDebts,
        getBalances,
        balances
    }), [expenses, friends, groups, loading, addExpense, addFriend, removeFriend, addGroup, addMemberToGroup, deleteGroup, deleteExpense, getSimplifiedDebts, getBalances, balances]);

    return (
        <ExpenseContext.Provider value={contextValue}>
            {!loading && children}
        </ExpenseContext.Provider>
    );
};



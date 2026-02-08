import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import AllExpenses from './pages/AllExpenses';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import SettleUp from './pages/SettleUp';
import Debug from './pages/Debug';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';

// Protected Layout Component
const ProtectedLayout = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ExpenseProvider>
          <div className="app-container">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/group/:groupId" element={<GroupDetail />} />
                <Route path="/add-expense" element={<AddExpense />} />
                <Route path="/settle-up" element={<SettleUp />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/expenses" element={<AllExpenses />} />
                <Route path="/debug" element={<Debug />} />
              </Route>

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ExpenseProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

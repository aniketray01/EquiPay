import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ExpenseProvider>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/groups" element={<Groups />} />
                        <Route path="/group/:groupId" element={<GroupDetail />} />
                        <Route path="/add-expense" element={<AddExpense />} />
                        <Route path="/settle-up" element={<SettleUp />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/activity" element={<Activity />} />
                        <Route path="/expenses" element={<AllExpenses />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </ExpenseProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { ToastContainer, Toast } from './components/shared/Toast';

// Placeholder components for different views
const Dashboard = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
    <p className="text-gray-600">Dashboard content will be implemented here.</p>
  </div>
);

const Calendar = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Calendar</h2>
    <p className="text-gray-600">Calendar view will be implemented here.</p>
  </div>
);

const Requests = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Leave Requests</h2>
    <p className="text-gray-600">Leave requests will be implemented here.</p>
  </div>
);

const Teams = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Teams</h2>
    <p className="text-gray-600">Team management will be implemented here.</p>
  </div>
);

const Users = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Users</h2>
    <p className="text-gray-600">User management will be implemented here.</p>
  </div>
);

export default function App() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {authMode === 'login' ? (
            <LoginForm
              onSuccess={() => {
                // Authentication success is handled by useAuth hook
              }}
              onSwitchToRegister={() => setAuthMode('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {
                // Registration success is handled by useAuth hook
              }}
              onSwitchToLogin={() => setAuthMode('login')}
            />
          )}
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  // Render the main application
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <Calendar />;
      case 'requests':
      case 'team-requests':
      case 'my-requests':
        return <Requests />;
      case 'teams':
      case 'team-management':
        return <Teams />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        title="Leave Management System"
      >
        {renderCurrentView()}
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );

  function removeToast(id: string) {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }
}

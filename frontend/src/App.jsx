import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Activity from './pages/Activity';
import About from './pages/About';
import Guide from './pages/Guide';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminLogs from './pages/admin/AdminLogs';

// Simple Admin Route wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user || !user.is_admin) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-100" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/about" element={<About />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/chat/:recipientId" element={<Chat />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
              <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

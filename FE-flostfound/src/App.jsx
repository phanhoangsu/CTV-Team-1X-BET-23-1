import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, MessageCircle, Search, LogIn, UserPlus, FileText, User } from 'lucide-react';
import { getUser, logout } from './api';

import Home from './pages/posts/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';
import PostDetail from './pages/posts/PostDetail';
import CreatePost from './pages/posts/CreatePost';
import Messages from './pages/posts/Messages';
import AdminDashboard from './pages/admin/Dashboard';

function Navbar() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasNewMsg, setHasNewMsg] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api';
    const eventSource = new EventSource(`${API_URL}/stream?token=${token}`);
    
    eventSource.addEventListener('receive_message', (e) => {
       if (location.pathname !== '/messages') {
         setHasNewMsg(true);
       }
    });

    return () => eventSource.close();
  }, [user, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/messages') {
      setHasNewMsg(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
              F-LostFound
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">Trang Chủ</Link>
            <Link to="/about" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">Giới Thiệu</Link>
            <Link to="/guide" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">Hướng Dẫn</Link>

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                <Link to="/post" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center">
                  <span className="mr-1">+</span> Đăng Tin
                </Link>
                
                <Link to="/messages" onClick={() => setHasNewMsg(false)} className="relative p-2 text-gray-400 hover:text-orange-500 transition-colors">
                  <MessageCircle size={20} />
                  {hasNewMsg && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Link>
                
                <button className="relative p-2 text-gray-400 hover:text-orange-500 transition-colors">
                  <Bell size={20} />
                </button>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 focus:outline-none bg-gray-50 rounded-full pl-1 pr-3 py-1 border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                      {user.username}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 hidden group-hover:block overflow-hidden py-2" >
                      {user.is_admin && (
                         <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"><FileText className="inline w-4 h-4 mr-2"/> Admin Dashboard</Link>
                      )}
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"><User className="inline w-4 h-4 mr-2"/> Hồ sơ cá nhân</Link>
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="inline w-4 h-4 mr-2"/> Đăng xuất</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <Link to="/login" className="text-gray-600 hover:text-orange-500 font-medium px-3 py-2 rounded-lg transition-colors flex items-center">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all transform hover:-translate-y-0.5 flex items-center">
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col pt-16 font-sans">
        <Navbar />
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/post" element={<CreatePost />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        
        <footer className="bg-gray-900 border-t border-gray-800 mt-12 py-12 px-4 shadow-inner">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
               <div className="text-gray-400">&copy; 2026 F-LostFound · FPT University Community</div>
               <div className="flex space-x-4 mt-4 md:mt-0 text-gray-400">
                   <a href="#" className="hover:text-white transition-colors">Về chúng tôi</a>
                   <a href="#" className="hover:text-white transition-colors">Điều khoản bổ sung</a>
                   <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
               </div>
           </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

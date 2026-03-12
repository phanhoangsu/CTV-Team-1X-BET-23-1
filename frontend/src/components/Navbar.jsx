import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import CreatePostModal from './CreatePostModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => apiRequest('/api/messages/unread-count').then(d => setUnreadCount(d.unread_count || 0)).catch(() => {});
    fetchUnread();
    const iv = setInterval(fetchUnread, 15000);
    return () => clearInterval(iv);
  }, [user]);

  const avatarUrl = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=F27123&color=fff&size=128`;

  return (
    <>
      <nav className="fixed w-full z-30 top-0" style={{ background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-orange-600">F-LostFound</span>
              </Link>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md font-medium text-sm">Trang Chủ</Link>
              <Link to="/about" className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md font-medium text-sm">Giới Thiệu</Link>
              <Link to="/guide" className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md font-medium text-sm">Hướng Dẫn</Link>

              {user ? (
                <>
                  {/* Post button */}
                  <button onClick={() => setShowCreateModal(true)} className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition font-bold text-sm shadow hover:shadow-md">
                    <i className="fas fa-plus mr-1"></i>Đăng Tin
                  </button>

                  {/* Bell */}
                  <Link to="/inbox" className="relative text-gray-600 hover:text-orange-600 px-2 py-2">
                    <i className="fas fa-bell text-xl"></i>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-red-100 bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Dropdown */}
                  <div className="relative" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
                    <button className="flex items-center gap-2 text-gray-700 hover:text-orange-600 px-2 py-2 rounded-md font-medium text-sm transition">
                      <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover border-2 border-orange-300 shadow-sm" alt="" />
                      <span className="max-w-[90px] truncate">{user.username}</span>
                      <i className="fas fa-chevron-down text-[10px] opacity-50"></i>
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 top-full pt-2 w-52 z-50">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1">
                          <div className="px-4 py-2 border-b border-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tài Khoản</p>
                          </div>
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition"><i className="fas fa-user w-4 text-center"></i> Hồ Sơ</Link>
                          <Link to="/activity" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition"><i className="fas fa-history w-4 text-center"></i> Quản Lý Hoạt Động</Link>
                          <Link to="/change-password" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition"><i className="fas fa-key w-4 text-center"></i> Đổi Mật Khẩu</Link>
                          {user.is_admin && (
                            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition"><i className="fas fa-cogs w-4 text-center"></i> Admin Panel</Link>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-semibold transition w-full text-left"><i className="fas fa-sign-out-alt w-4 text-center"></i> Đăng Xuất</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-orange-600 px-3 py-2 font-medium text-sm">Đăng Nhập</Link>
                  <Link to="/register" className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition text-sm font-medium">Đăng Ký</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={(id) => { navigate(`/?new_post_id=${id}`); }} />

      {/* Chat Bubble */}
      {user && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link to="/inbox" className="flex items-center justify-center w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg transition transform hover:scale-110">
            <i className="fas fa-comment-dots text-2xl"></i>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/messages/inbox')
      .then(data => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <div className="container mx-auto px-4 pt-24 text-center text-gray-500">Vui lòng đăng nhập</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-orange-600">Tin Nhắn Của Bạn</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Bạn chưa có tin nhắn nào.<br />
              <Link to="/" className="text-orange-600 hover:underline">Tìm đồ và liên hệ người đăng tin ngay!</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {conversations.map(conv => (
                <li key={conv.user.id}>
                  <Link to={`/chat/${conv.user.id}`} className="block hover:bg-gray-50 transition">
                    <div className="px-6 py-4 flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl overflow-hidden">
                          {conv.user.avatar_url ? <img src={conv.user.avatar_url} className="w-full h-full object-cover" /> : conv.user.username[0].toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">{conv.user.username}</p>
                          <p className="px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {conv.last_message.timestamp ? new Date(conv.last_message.timestamp).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-sm text-gray-500 truncate">
                            {conv.last_message.sender_id === user?.id && <span className="text-gray-400">Bạn: </span>}
                            {conv.last_message.body}
                          </p>
                          {conv.unread_count > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{conv.unread_count}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Activity() {
  const { user } = useAuth();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    apiRequest('/api/profile/activity')
      .then(data => { setLostItems(data.lost_items || []); setFoundItems(data.found_items || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <div className="container mx-auto px-4 pt-24 text-center text-gray-500">Vui lòng đăng nhập</div>;

  const ItemCard = ({ item }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => navigate('/')}>
      <div className="h-36 bg-gray-100 overflow-hidden">
        {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><i className="fas fa-image text-3xl"></i></div>}
      </div>
      <div className="p-3">
        <h4 className="font-bold text-sm text-gray-900 truncate">{item.title}</h4>
        <p className="text-xs text-gray-500 mt-1">{item.location} · {item.date_posted ? new Date(item.date_posted).toLocaleDateString('vi-VN') : ''}</p>
        <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'Closed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
          {item.status === 'Closed' ? 'Đã hoàn trả' : 'Đang tìm'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Quản Lý Hoạt Động</h1>
        {loading ? <div className="text-center text-gray-400 py-8">Đang tải...</div> : (
          <>
            <h2 className="text-xl font-bold text-red-600 mb-4"><i className="fas fa-search mr-2"></i>Đồ đã mất ({lostItems.length})</h2>
            {lostItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">{lostItems.map(i => <ItemCard key={i.id} item={i} />)}</div>
            ) : <p className="text-gray-400 mb-8">Chưa có bài đăng nào.</p>}

            <h2 className="text-xl font-bold text-green-600 mb-4"><i className="fas fa-hand-holding-heart mr-2"></i>Đồ nhặt được ({foundItems.length})</h2>
            {foundItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{foundItems.map(i => <ItemCard key={i.id} item={i} />)}</div>
            ) : <p className="text-gray-400">Chưa có bài đăng nào.</p>}
          </>
        )}
      </div>
    </div>
  );
}

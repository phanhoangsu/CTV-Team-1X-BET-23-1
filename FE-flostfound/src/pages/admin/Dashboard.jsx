import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import api, { getUser } from '../../api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.is_admin) {
      alert("Bạn không có quyền truy cập trang này!");
      navigate('/');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [currentUser, navigate]);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-gray-100 pb-5">
         <div>
           <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
           <p className="text-gray-500 font-medium">Trung tâm quản lý hệ thống F-LostFound</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng người dùng</p>
              <h3 className="text-3xl font-black text-gray-900">{stats?.users || 0}</h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500"><Users className="w-7 h-7"/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng bài đăng</p>
              <h3 className="text-3xl font-black text-gray-900">{stats?.items || 0}</h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500"><FileText className="w-7 h-7"/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Đồ Nhặt Được</p>
              <h3 className="text-3xl font-black text-emerald-600">{stats?.found || 0}</h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle className="w-7 h-7"/></div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Đồ Thất Lạc</p>
              <h3 className="text-3xl font-black text-red-600">{stats?.lost || 0}</h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500"><AlertTriangle className="w-7 h-7"/></div>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">Danh sách người dùng</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-gray-100 text-gray-400">
                    <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">ID</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Tên người dùng</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Email</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Họ tên</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Phân quyền</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-gray-500 font-medium">#{u.id}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">{u.username}</td>
                            <td className="px-6 py-4 text-gray-600">{u.email}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{u.full_name || '-'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${u.is_admin ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {u.is_admin ? 'ADMIN' : 'MEMBER'}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-10 text-gray-500">Không có dữ liệu</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

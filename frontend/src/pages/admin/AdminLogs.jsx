import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaHistory, FaUserCircle } from 'react-icons/fa';

function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await apiRequest('/api/admin/logs');
      if (response.success) {
        setLogs(response.logs);
      }
    } catch (error) {
      toast.error('Lỗi khi tải nhật ký hoạt động: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
          <FaHistory className="text-3xl text-orange-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Nhật Ký Hoạt Động</h1>
        </div>
        <Link to="/admin/dashboard" className="flex items-center text-gray-600 hover:text-orange-600 transition">
          <FaArrowLeft className="mr-2" /> Quay lại Dashboard
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {new Date(log.timestamp + 'Z').toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUserCircle className="text-gray-400 text-xl mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.username}</div>
                          <div className="text-xs text-gray-500">ID: {log.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                        log.action.includes('Đăng') ? 'bg-green-100 text-green-700' :
                        log.action.includes('Xóa') ? 'bg-red-100 text-red-700' :
                        log.action.includes('Cập nhật') ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                    <FaHistory className="mx-auto text-4xl text-gray-300 mb-3 block" />
                    Chưa có hoạt động nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminLogs;

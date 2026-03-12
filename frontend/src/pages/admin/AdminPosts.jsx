import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaTrashAlt, FaSearch } from 'react-icons/fa';

function AdminPosts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await apiRequest('/api/admin/posts');
      if (response.success) {
        setItems(response.items);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài viết: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) return;

    try {
      const response = await apiRequest(`/api/posts/${id}`, { method: 'DELETE' });
      if (response.success) {
        toast.success('Đã xóa bài viết thành công');
        // Update list
        setItems(items.filter(item => item.id !== id));
      } else {
        toast.error('Lỗi: ' + response.message);
      }
    } catch (error) {
      toast.error('Lỗi khi xóa bài viết: ' + error.message);
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
        <h1 className="text-3xl font-bold text-orange-600">Quản Lý Bài Đăng</h1>
        <Link to="/admin/dashboard" className="flex items-center text-gray-600 hover:text-orange-600 transition">
          <FaArrowLeft className="mr-2" /> Quay lại Dashboard
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã / Hình ảnh</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiêu Đề & Thông tin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người Đăng</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày Đăng</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành Động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length > 0 ? (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 font-mono w-8">#{item.id}</span>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="h-10 w-10 rounded object-cover ml-2" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 ml-2">
                            <FaSearch className="text-xs" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 mb-1 max-w-xs truncate" title={item.title}>
                        <Link to={`/`} className="hover:text-orange-500">{item.title}</Link> 
                        {/* Notice: A real details page should be linked if available */}
                      </div>
                      <div className="flex items-center text-xs space-x-2">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          item.item_type === 'Lost' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.item_type === 'Lost' ? 'Thất lạc' : 'Nhặt được'}
                        </span>
                        <span className="text-gray-500 truncate max-w-[150px]" title={item.location}>
                          <i className="fas fa-map-marker-alt mr-1"></i>{item.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{item.user}</div>
                      <div className="text-xs text-gray-500">ID: {item.user_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.date_posted).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDelete(item.id, item.title)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition duration-150 inline-flex items-center"
                      >
                        <FaTrashAlt className="mr-1.5" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    Chưa có bài đăng nào trên hệ thống.
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

export default AdminPosts;

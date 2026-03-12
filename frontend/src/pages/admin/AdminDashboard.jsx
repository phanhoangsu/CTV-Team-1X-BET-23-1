import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { FaUsers, FaLayerGroup, FaSearch, FaCheckCircle, FaHistory, FaNewspaper } from 'react-icons/fa';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [searchQuery]);

  const fetchDashboardData = async () => {
    try {
      const endpoint = searchQuery ? `/api/admin/dashboard?q=${encodeURIComponent(searchQuery)}` : '/api/admin/dashboard';
      const response = await apiRequest(endpoint);
      setData(response);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    // Optionally add debounce here if needed
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
          borderDash: [5, 5]
        },
        ticks: {
          stepSize: 1,
          color: '#9ca3af'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const chartDataConfig = {
    labels: data?.chart?.labels || [],
    datasets: [
      {
        label: 'Đồ thất lạc',
        data: data?.chart?.lost_data || [],
        borderColor: '#f97316', // Orange-500
        backgroundColor: 'rgba(249, 115, 22, 0.2)', // Simulated gradient
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#f97316',
        pointHoverBackgroundColor: '#f97316',
        pointHoverBorderColor: '#fff',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Đồ nhặt được',
        data: data?.chart?.found_data || [],
        borderColor: '#10b981', // Emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.2)', // Simulated gradient
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#10b981',
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#fff',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Chưa đăng nhập';
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  const isOnline = (dateString) => {
    if (!dateString) return false;
    try {
      const date = parseISO(dateString);
      const diffInSeconds = (new Date() - date) / 1000;
      return diffInSeconds < 300; // 5 mins
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Tổng quan hệ thống và quản lý người dùng</p>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <Link to="/admin/posts" className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:text-orange-600 transition shadow-sm hover:shadow text-sm md:text-base">
              <FaNewspaper className="mr-2" /> Quản lý Bài đăng
            </Link>
            <Link to="/admin/logs" className="flex items-center px-4 py-2 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-900 transition shadow-lg shadow-gray-200 text-sm md:text-base">
              <FaHistory className="mr-2" /> Nhật ký Hoạt động
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Stat */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                <FaUsers className="text-xl" />
              </div>
              <span className="text-sm font-medium text-gray-400">Total Users</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{data?.stats?.total_users || 0}</h3>
            <p className="text-sm text-blue-500 mt-2 font-medium">Thành viên</p>
          </div>

          {/* Total Posts */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                <FaLayerGroup className="text-xl" />
              </div>
              <span className="text-sm font-medium text-gray-400">Total Posts</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{data?.stats?.total_items || 0}</h3>
            <p className="text-sm text-indigo-500 mt-2 font-medium">Bài viết hiện có</p>
          </div>

          {/* Lost Items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <FaSearch className="text-xl" />
              </div>
              <span className="text-sm font-medium text-gray-400">Lost Items</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{data?.stats?.total_lost || 0}</h3>
            <p className="text-sm text-orange-500 mt-2 font-medium">Đang tìm kiếm</p>
          </div>

          {/* Found Items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                <FaCheckCircle className="text-xl" />
              </div>
              <span className="text-sm font-medium text-gray-400">Found Items</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{data?.stats?.total_found || 0}</h3>
            <p className="text-sm text-emerald-500 mt-2 font-medium">Đã tìm thấy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Thống kê hoạt động (7 ngày)</h3>
            <div className="relative h-72">
              {data?.chart && <Line data={chartDataConfig} options={chartOptions} />}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Quản trị viên</h3>
              <p className="text-gray-300 mb-6 text-sm">Hệ thống đang hoạt động ổn định. Hãy kiểm tra các báo cáo vi phạm thường xuyên.</p>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  API Backend: Active
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Database: Connected
                </div>
              </div>
            </div>
            {/* Decorative circle */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-800">Danh sách người dùng</h3>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm w-full md:w-64 transition"
                placeholder="Tìm kiếm user..." 
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              {searchQuery && (
                <button type="button" onClick={handleClearSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 font-bold">
                  &times;
                </button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Người dùng</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Vai trò</th>
                  <th className="px-6 py-4 font-semibold">Online lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.users && data.users.length > 0 ? (
                  data.users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isOnline(user.last_seen) ? (
                          <div className="flex items-center">
                            <span className="relative flex h-3 w-3 mr-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Online</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 mr-2"></span>
                            <span className="text-xs text-gray-400">Offline</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-md">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 block">{user.username}</span>
                            {user.full_name && <span className="text-xs text-gray-500">{user.full_name}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_seen ? (
                          <span title={new Date(user.last_seen).toLocaleString()}>
                            {formatLastSeen(user.last_seen)}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">Chưa đăng nhập</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FaUsers className="text-4xl text-gray-300 mb-3" />
                        <p>Không tìm thấy người dùng nào phù hợp.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

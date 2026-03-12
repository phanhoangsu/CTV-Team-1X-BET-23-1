import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      if (data.user) updateUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Đăng Nhập</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-600 text-white font-bold py-2 px-4 rounded-md hover:bg-orange-700 transition duration-300 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Chưa có tài khoản? <Link to="/register" className="text-orange-600 hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

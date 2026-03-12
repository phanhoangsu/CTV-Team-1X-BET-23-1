import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/userService';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(username, email, password);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Đăng Ký Tài Khoản</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-900 transition duration-300 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-orange-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

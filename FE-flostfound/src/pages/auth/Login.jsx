import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        window.location.href = '/'; // hard reload to update navbar context
      } else {
        setError(res.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200 shadow-sm w-full max-w-md animate-bounce-short">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
            <span className="font-semibold text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-500 transform origin-left transition-transform duration-500 ease-out"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Đăng Nhập</h2>
          <p className="text-gray-500 text-sm font-medium">Chào mừng bạn quay trở lại F-LostFound</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tên đăng nhập</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder-gray-400 font-medium" 
              placeholder="Nhập tên đăng nhập" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder-gray-400 font-medium" 
              placeholder="••••••••" 
            />
          </div>

          <div className="flex items-center justify-between mt-2">
             <div className="flex items-center">
                 <input type="checkbox" id="remember" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer transition" />
                 <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 cursor-pointer hover:text-orange-600">Ghi nhớ tôi</label>
             </div>
             <a href="#" className="text-sm font-semibold text-orange-600 hover:text-red-600 transition-colors">Quên mật khẩu?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/30 transform transition-all active:scale-[0.98] flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-orange-600 hover:text-red-600 font-bold transition-colors">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

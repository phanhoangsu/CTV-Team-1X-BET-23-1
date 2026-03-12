import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-bold text-orange-400">F-LostFound</p>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-white transition">Trang Chủ</Link>
            <Link to="/about" className="hover:text-white transition">Giới Thiệu</Link>
            <Link to="/guide" className="hover:text-white transition">Hướng Dẫn</Link>
          </div>
          <p className="text-xs text-gray-500">&copy; 2026 F-LostFound · FPT University Community</p>
        </div>
      </div>
    </footer>
  );
}

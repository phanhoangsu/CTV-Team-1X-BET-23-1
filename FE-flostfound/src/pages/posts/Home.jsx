import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Tag, MessageCircle, ChevronRight, User } from 'lucide-react';
import api from '../../api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/posts');
        if (res.data.success) {
          setItems(res.data.items);
        }
      } catch (err) {
        console.error("Failed to fetch posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="space-y-12">
      {/* Header section (Hero) */}
      <div className="text-center py-10 md:py-16 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-200 opacity-20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Tìm Đồ Thất Lạc <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">FPTU</span></h1>
          <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">Kết nối cộng đồng, tìm lại đồ đã mất nhanh chóng.</p>
          
          <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-3">
             <div className="relative flex-grow group">
               <input 
                 type="text" 
                 placeholder="Tìm kiếm (Chìa khóa, ví, thẻ xe...)" 
                 className="w-full pl-12 pr-4 py-4 md:py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder-gray-400 font-medium text-lg shadow-sm group-hover:shadow-md" 
               />
               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors w-6 h-6" />
             </div>
             <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-8 py-4 md:py-5 rounded-2xl whitespace-nowrap shadow-lg shadow-orange-500/30 transform transition-all active:scale-[0.98] text-lg flex items-center justify-center">
               <span className="hidden sm:inline">Tìm kiếm</span>
               <Search className="sm:hidden w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <Link to={`/post/${item.id}`} key={item.id} className="block group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 item-card h-full flex flex-col relative w-full translate-z-0">
                <div className="aspect-w-16 aspect-h-10 w-full relative group">
                  {item.images && item.images.length > 0 ? (
                    <img 
                      src={item.images[0]} 
                      alt={item.title} 
                      className="w-full h-56 object-cover object-center transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                      <Search className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                <div className="p-6 flex-grow flex flex-col relative bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <span 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm
                      ${item.item_type === 'Lost' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                    >
                      {item.item_type === 'Lost' ? 'Mất đồ' : 'Nhặt được'}
                    </span>
                    <span className="flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.date_posted).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>

                  <div className="mt-auto space-y-2 pt-4">
                     <div className="flex items-start text-sm text-gray-500 bg-gray-50/50 rounded-xl p-2.5 border border-gray-50">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="font-medium line-clamp-1 truncate">{item.location} {item.specific_location && `- ${item.specific_location}`}</span>
                     </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between group-hover:bg-orange-50/30 transition-colors">
                  <div className="flex items-center group-hover:opacity-90 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white">
                       {item.author_name ? item.author_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="ml-2.5 text-sm font-semibold text-gray-700">{item.author_name || 'Người dùng'}</span>
                  </div>
                  <div className="flex space-x-2">
                     <button className="text-emerald-500 hover:text-emerald-600 p-1.5 transition-colors transform hover:scale-110 bg-emerald-50 rounded-full" aria-label="Gọi điện">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                     </button>
                     <button className="text-gray-400 group-hover:text-orange-500 p-1.5 transition-colors transform group-hover:translate-x-1" aria-label="Chi tiết">
                        <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

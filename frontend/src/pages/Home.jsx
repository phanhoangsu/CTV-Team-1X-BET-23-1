import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ type: '', status: '', location: '', category: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.location) params.set('location', filters.location);
      if (filters.category) params.set('category', filters.category);
      params.set('sort', filters.sort);
      params.set('page', page);
      const data = await apiRequest(`/api/search?${params}`);
      setItems(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch { setItems([]); }
    setLoading(false);
  }, [query, filters, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    apiRequest('/api/search/locations').then(setLocations).catch(() => {});
    apiRequest('/api/search/categories').then(setCategories).catch(() => {});
  }, []);

  const openDetail = async (id) => {
    try {
      const data = await apiRequest(`/api/posts/${id}`);
      if (data.success) { setSelectedItem(data.data); setCurrentImgIdx(0); setShowDetail(true); }
    } catch {}
  };

  const allImages = selectedItem ? (selectedItem.images?.length ? selectedItem.images : selectedItem.image_url ? [selectedItem.image_url] : []) : [];

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {/* Search */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Tìm Đồ Thất Lạc <span className="text-orange-600">FPTU</span></h1>
        <p className="text-gray-600 mb-6">Kết nối cộng đồng, tìm lại đồ đã mất nhanh chóng.</p>
        <div className="max-w-2xl mx-auto">
          <div className="flex shadow-md rounded-xl overflow-hidden border-2 border-transparent bg-white">
            <span className="flex items-center pl-4 text-gray-400"><i className="fas fa-search"></i></span>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchItems(); } }}
              placeholder="Tìm kiếm (Chìa khóa, ví, thẻ xe...)" className="flex-grow px-4 py-3.5 border-none focus:outline-none text-gray-800 bg-transparent" />
            {query && <button onClick={() => { setQuery(''); setPage(1); }} className="px-3 text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>}
            <button onClick={() => { setPage(1); fetchItems(); }} className="bg-orange-600 text-white px-6 font-bold hover:bg-orange-700 transition text-sm">Tìm kiếm</button>
          </div>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between max-w-6xl mx-auto mb-4">
        <button onClick={() => setShowFilter(!showFilter)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 transition shadow-sm">
          <i className="fas fa-sliders-h"></i> Bộ lọc
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">{total} kết quả</span>
          <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="relevance">Độ chính xác</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Loại tin</label>
                <div className="flex gap-2">
                  {[['', 'Tất cả'], ['Lost', 'Mất đồ'], ['Found', 'Nhặt được']].map(([v, l]) => (
                    <button key={v} onClick={() => setFilters(f => ({ ...f, type: v }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filters.type === v ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trạng thái</label>
                <div className="flex gap-2">
                  {[['', 'Đang tìm'], ['Closed', 'Đã hoàn trả'], ['all', 'Tất cả']].map(([v, l]) => (
                    <button key={v} onClick={() => setFilters(f => ({ ...f, status: v }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filters.status === v ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Khu vực</label>
                <select value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">Tất cả khu vực</option>
                  {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Danh mục</label>
                <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">Tất cả danh mục</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )) : items.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <i className="fas fa-search text-5xl mb-4 opacity-30"></i>
            <p className="text-lg font-medium">Không tìm thấy kết quả</p>
          </div>
        ) : items.map(item => (
          <div key={item.id} onClick={() => openDetail(item.id)} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer group border border-gray-100">
            <div className="h-48 bg-gray-100 overflow-hidden relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300"><i className="fas fa-image text-4xl"></i></div>
              )}
              <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${item.item_type === 'Lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {item.item_type === 'Lost' ? 'Mất đồ' : 'Nhặt được'}
              </span>
              {item.status === 'Closed' && <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-gray-800 text-white">Đã hoàn trả</span>}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1 truncate">{item.title}</h3>
              <p className="text-sm text-gray-500 truncate mb-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span><i className="fas fa-map-marker-alt mr-1"></i>{item.location}</span>
                <span>{item.date_posted ? new Date(item.date_posted).toLocaleDateString('vi-VN') : ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border bg-white text-sm disabled:opacity-50">←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-2 rounded-lg text-sm font-medium ${p === page ? 'bg-orange-600 text-white' : 'border bg-white text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg border bg-white text-sm disabled:opacity-50">→</button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm" onClick={() => setShowDetail(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative inline-block bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden">
              <button onClick={() => setShowDetail(false)} className="absolute top-4 right-4 z-20 text-gray-600 hover:text-gray-900 bg-white/90 rounded-full p-2 shadow-lg"><i className="fas fa-times text-xl"></i></button>
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                {/* Image Gallery */}
                <div className="bg-gray-900 relative flex flex-col justify-center items-center">
                  {allImages.length > 0 ? (
                    <>
                      <img src={allImages[currentImgIdx]} alt="" className="max-h-[500px] w-full object-contain" />
                      {allImages.length > 1 && (
                        <>
                          <button onClick={() => setCurrentImgIdx(i => i <= 0 ? allImages.length - 1 : i - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
                          <button onClick={() => setCurrentImgIdx(i => i >= allImages.length - 1 ? 0 : i + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
                          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">{currentImgIdx + 1} / {allImages.length}</div>
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {allImages.map((img, i) => <img key={i} src={img} onClick={() => setCurrentImgIdx(i)} className={`h-12 w-12 rounded object-cover cursor-pointer border-2 transition ${i === currentImgIdx ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`} />)}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 py-20"><i className="fas fa-image text-6xl mb-4 opacity-30"></i><span>Không có hình ảnh</span></div>
                  )}
                </div>
                {/* Info */}
                <div className="p-8 overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-2 ${selectedItem.item_type === 'Lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      <i className={`fas ${selectedItem.item_type === 'Lost' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
                      {selectedItem.item_type === 'Lost' ? 'Mất đồ' : 'Nhặt được'}
                    </span>
                    <span className="text-xs text-gray-400">{selectedItem.date_posted ? new Date(selectedItem.date_posted).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{selectedItem.title}</h2>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                    <div className="flex items-start space-x-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><i className="far fa-calendar-alt"></i></div><div><p className="text-xs text-gray-500 uppercase font-bold">Thời gian</p><p className="text-sm font-semibold text-gray-800">{selectedItem.incident_date ? new Date(selectedItem.incident_date).toLocaleString('vi-VN') : 'Không rõ'}</p></div></div>
                    <div className="flex items-start space-x-3"><div className="bg-red-50 text-red-600 p-2 rounded-lg"><i className="fas fa-map-marker-alt"></i></div><div><p className="text-xs text-gray-500 uppercase font-bold">Khu vực</p><p className="text-sm font-semibold text-gray-800">{selectedItem.location}{selectedItem.specific_location ? ` - ${selectedItem.specific_location}` : ''}</p></div></div>
                    <div className="flex items-start space-x-3"><div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><i className="fas fa-tag"></i></div><div><p className="text-xs text-gray-500 uppercase font-bold">Danh mục</p><p className="text-sm font-semibold text-gray-800">{selectedItem.category || 'Chưa phân loại'}</p></div></div>
                  </div>
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2"><i className="fas fa-align-left mr-2"></i>Mô tả chi tiết</h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{selectedItem.description}</p>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 flex justify-between items-center mb-3">
                    <div><p className="text-xs text-gray-400 font-bold uppercase">Người đăng</p><span className="font-bold text-gray-800">{selectedItem.user}</span></div>
                    <div className="text-right"><p className="text-xs text-gray-400 font-bold uppercase">Liên hệ</p><p className="font-bold text-gray-800">{selectedItem.contact_info}</p></div>
                  </div>
                  <a href={`/chat/${selectedItem.user_id}`} className="w-full flex justify-center items-center bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-lg"><i className="fas fa-comment-alt mr-2"></i>Nhắn tin trao đổi</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

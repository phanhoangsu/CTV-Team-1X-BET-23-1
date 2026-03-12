import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { MapPin, Tag, Type, AlignLeft, Phone, Link as LinkIcon, Calendar, CheckCircle } from 'lucide-react';

export default function CreatePost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    item_type: 'Lost',
    title: '',
    description: '',
    category: 'Khác',
    location: '',
    specific_location: '',
    incident_date: '',
    phone_number: '',
    facebook_url: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('[CreatePost] Starting form submission');
    console.log('[CreatePost] Form Data:', formData);

    try {
      // In a real app we'd upload images to Cloudinary here first.
      console.log('[CreatePost] Calling API wrapper: api.post("/posts")');
      const res = await api.post('/posts', formData);
      console.log('[CreatePost] API Response Success:', res.data);
      
      if (res.data.success) {
        navigate(`/post/${res.data.item_id}`, { state: { message: 'Đăng tin thành công!' } });
      } else {
        console.warn('[CreatePost] Server returned logical error:', res.data);
        setError(res.data.message || 'Lỗi đăng tin');
      }
    } catch (err) {
      console.error('[CreatePost] Error caught in try-catch:', err);
      console.error('[CreatePost] Request Config:', err.config);
      console.error('[CreatePost] Server Response (if any):', err.response?.data);
      console.error('[CreatePost] Status Code:', err.response?.status);
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      console.log('[CreatePost] Submission finished. Loading false.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center font-bold animate-pulse">{error}</div>}
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
        <div className="absolute top-0 w-full h-3 bg-gradient-to-r from-orange-500 to-red-500"></div>
        <div className="p-8 md:p-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Đăng Tin Thất Lạc</h2>
          <p className="text-gray-500 mb-10 font-medium pb-6 border-b border-gray-100">Cung cấp thông tin chi tiết giúp FPTUers hỗ trợ bạn nhanh nhất</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-2 gap-4">
               {['Lost', 'Found'].map(type => (
                 <label key={type} className={`cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${formData.item_type === type ? (type === 'Lost' ? 'border-red-500 bg-red-50 text-red-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-gray-200 text-gray-500 hover:bg-gray-50'} shadow-sm`}>
                    <input type="radio" name="item_type" value={type} checked={formData.item_type === type} onChange={handleChange} className="hidden" />
                    <div className="text-xl font-bold mb-2">{type === 'Lost' ? 'TÔI MẤT ĐỒ' : 'TÔI NHẶT ĐƯỢC'}</div>
                    <div className="text-sm opacity-80 text-center">{type === 'Lost' ? 'Bạn đang tìm đồ vật bị thất lạc?' : 'Bạn nhặt được và muốn trả lại?'}</div>
                 </label>
               ))}
            </div>

            <div className="space-y-6 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">Thông tin đồ vật</h3>
              
              <div className="relative group">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề bài đăng <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <Type className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                  <input required name="title" value={formData.title} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" placeholder="VD: Rơi chìa khoá xe AirBlade biển 29AA..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium shadow-sm transition-all appearance-none cursor-pointer">
                       <option value="Điện thoại">Điện thoại</option>
                       <option value="Ví/Thẻ">Ví/Thẻ</option>
                       <option value="Chìa khóa">Chìa khóa</option>
                       <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Thời điểm {formData.item_type === 'Lost' ? 'mất' : 'nhặt'}</label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                    <input type="datetime-local" name="incident_date" value={formData.incident_date} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tòa nhà / Khu vực chính <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                    <input required name="location" value={formData.location} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" placeholder="VD: Tòa Alpha" />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phòng / Tầng (nếu rõ)</label>
                  <div className="relative flex items-center">
                    <input name="specific_location" value={formData.specific_location} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" placeholder="VD: Phòng 102" />
                  </div>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                <div className="relative flex items-start">
                  <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                  <textarea required name="description" value={formData.description} onChange={handleChange} rows="5" className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" placeholder="Mô tả màu sắc, đặc điểm nhận dạng, các đồ vật bên trong..."></textarea>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-orange-50/30 p-6 md:p-8 rounded-2xl border border-orange-100">
               <h3 className="text-lg font-bold text-gray-900 border-b border-orange-200 pb-3">Thông tin liên hệ (Tùy chọn)</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="relative group">
                   <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                   <div className="relative flex items-center">
                     <Phone className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                     <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" placeholder="Ví dụ: 0987654321" />
                   </div>
                 </div>

                 <div className="relative group">
                   <label className="block text-sm font-bold text-gray-700 mb-2">Link Facebook</label>
                   <div className="relative flex items-center">
                     <LinkIcon className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500" />
                     <input type="url" name="facebook_url" value={formData.facebook_url} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium transition-all shadow-sm" placeholder="https://facebook.com/..." />
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
               <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xl py-4 md:py-5 px-6 rounded-2xl shadow-lg shadow-orange-500/30 transform transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer">
                  {loading ? <CheckCircle className="animate-spin w-6 h-6 mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                  {loading ? 'Đang đăng...' : 'ĐĂNG TIN NGAY'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

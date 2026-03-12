import React, { useState } from 'react';
import { apiRequest, API_BASE_URL } from '../services/api';

export default function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [itemType, setItemType] = useState('Lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFiles = (newFiles) => {
    const all = [...files, ...Array.from(newFiles)].slice(0, 5);
    setFiles(all);
    const urls = all.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeImage = (idx) => {
    setFiles(f => f.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('item_type', itemType);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('incident_date', incidentDate);
      formData.append('location', location);
      formData.append('specific_location', specificLocation);
      formData.append('description', description);
      formData.append('contact_info', contactInfo);
      files.forEach(f => formData.append('images', f));

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
      onSuccess?.(data.item_id);
      onClose();
      // Reset
      setTitle(''); setDescription(''); setFiles([]); setPreviews([]);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputClass = "block rounded-lg px-2.5 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 focus:outline-none focus:ring-0 focus:border-orange-600 peer";
  const labelClass = "absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-focus:text-orange-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-100">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">Tạo tin đăng mới</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 rounded-full p-2 hover:bg-gray-100 transition"><i className="fas fa-times text-xl"></i></button>
          </div>

          {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Col 1: Classification */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">1. Phân loại</div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  {['Lost', 'Found'].map(t => (
                    <label key={t} className="flex-1 cursor-pointer">
                      <input type="radio" name="item_type" value={t} checked={itemType === t} onChange={() => setItemType(t)} className="sr-only" />
                      <div className={`text-center py-2 rounded-md font-medium transition-all duration-200 ${itemType === t ? `bg-white shadow ${t === 'Lost' ? 'text-red-600' : 'text-green-600'}` : 'text-gray-500'}`}>
                        <i className={`fas ${t === 'Lost' ? 'fa-search' : 'fa-hand-holding-heart'} mr-2`}></i>{t === 'Lost' ? 'Mất đồ' : 'Nhặt được'}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="relative"><input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder=" " required maxLength={100} /><label className={labelClass}>Tiêu đề tin</label></div>
                <div className="relative">
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass} required>
                    <option value="" disabled></option>
                    {['Ví tiền', 'Giấy tờ', 'Điện thoại', 'Laptop', 'Chìa khóa', 'Trang phục', 'Khác'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label className={labelClass}>Danh mục</label>
                </div>
              </div>

              {/* Col 2: Details */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">2. Chi tiết & Thời gian</div>
                <div className="relative"><input type="datetime-local" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} className={inputClass} required /><label className={labelClass}>Thời gian xảy ra</label></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select value={location} onChange={e => setLocation(e.target.value)} className={inputClass} required>
                      <option value="" disabled></option>
                      {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Canteen', 'Library', 'Parking', 'Other'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <label className={labelClass}>Khu vực</label>
                  </div>
                  <div className="relative"><input type="text" value={specificLocation} onChange={e => setSpecificLocation(e.target.value)} className={inputClass} placeholder=" " /><label className={labelClass}>Phòng/Vị trí cụ thể</label></div>
                </div>
                <div className="relative"><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputClass} placeholder=" " required maxLength={500}></textarea><label className={labelClass}>Mô tả chi tiết</label></div>
              </div>

              {/* Col 3: Images & Contact */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">3. Hình ảnh & Liên hệ</div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-500">Hình ảnh đính kèm (Tối đa 5)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-orange-500 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500"><span className="font-semibold">Bấm để tải</span> hoặc kéo thả</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (Max 5MB)</p>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={e => handleFiles(e.target.files)} />
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {previews.map((url, i) => (
                      <div key={i} className="relative group h-24 rounded-md overflow-hidden bg-gray-100">
                        <img src={url} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"><i className="fas fa-times"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative"><input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className={inputClass} placeholder=" " required /><label className={labelClass}>Thông tin liên hệ (SĐT/FB)</label></div>
                <div className="mt-8">
                  <button type="submit" disabled={loading}
                    className={`w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition flex items-center justify-center ${itemType === 'Lost' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}>
                    <span>{loading ? 'Đang xử lý...' : 'Đăng tin ngay'}</span>
                    {!loading && <i className="fas fa-paper-plane ml-2"></i>}
                    {loading && <svg className="animate-spin ml-2 h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

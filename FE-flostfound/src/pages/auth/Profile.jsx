import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, FileText, Camera, Key, Activity } from 'lucide-react';
import api, { getUser } from '../../api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState({ lost_items: [], found_items: [] });
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  
  const currentUser = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchProfileData = async () => {
      try {
        const [profRes, actRes] = await Promise.all([
          api.get('/profile'),
          api.get('/profile/activity')
        ]);
        
        if (profRes.data.success) setProfile(profRes.data.user);
        if (actRes.data.success) {
          setActivity({
            lost_items: actRes.data.lost_items,
            found_items: actRes.data.found_items
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [currentUser, navigate]);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div></div>;
  }

  // --- Render Activity Tab content ---
  const renderActivity = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center bg-red-50 p-3 rounded-xl border border-red-100">
           Tin đăng: Mất đồ <span className="ml-2 bg-red-100 px-2 py-0.5 rounded-md text-sm">{activity.lost_items.length}</span>
        </h3>
        {activity.lost_items.length === 0 ? <p className="text-gray-500">Chưa có bài đăng nào.</p> : (
            <div className="space-y-4">
               {activity.lost_items.map(i => (
                  <Link to={`/post/${i.id}`} key={i.id} className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-300 transition-colors">
                      <p className="font-bold text-gray-900 truncate">{i.title}</p>
                      <p className="text-sm text-gray-500">{new Date(i.date_posted).toLocaleDateString()}</p>
                  </Link>
               ))}
            </div>
        )}
      </div>
      <div>
        <h3 className="text-xl font-bold text-emerald-600 mb-4 flex items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
           Tin đăng: Nhặt được <span className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-md text-sm">{activity.found_items.length}</span>
        </h3>
        {activity.found_items.length === 0 ? <p className="text-gray-500">Chưa có bài đăng nào.</p> : (
            <div className="space-y-4">
               {activity.found_items.map(i => (
                  <Link to={`/post/${i.id}`} key={i.id} className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-300 transition-colors">
                      <p className="font-bold text-gray-900 truncate">{i.title}</p>
                      <p className="text-sm text-gray-500">{new Date(i.date_posted).toLocaleDateString()}</p>
                  </Link>
               ))}
            </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 w-full relative">
           <div className="absolute -bottom-12 left-8 h-24 w-24 bg-white rounded-full p-1 border border-gray-100 shadow-md">
               {profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="avatar" className="h-full w-full rounded-full object-cover"/>
               ) : (
                   <div className="h-full w-full bg-gradient-to-tr from-gray-200 to-gray-300 rounded-full flex items-center justify-center font-bold text-3xl text-gray-600">
                      {profile?.username?.charAt(0).toUpperCase()}
                   </div>
               )}
           </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
            <h1 className="text-3xl font-extrabold text-gray-900">{profile?.full_name || profile?.username}</h1>
            <p className="text-gray-500 font-medium">@{profile?.username} • {profile?.is_admin ? 'Quản trị viên' : 'Thành viên'}</p>
        </div>

        <div className="flex border-t border-b border-gray-100 bg-gray-50 overflow-x-auto hide-scrollbar text-sm font-bold text-gray-600">
           <button onClick={() => setActiveTab('info')} className={`px-6 py-4 flex items-center whitespace-nowrap outline-none transition-colors border-b-2 ${activeTab === 'info' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent hover:text-gray-900'}`}>
              <User className="w-4 h-4 mr-2" /> Hồ Sơ Cá Nhân
           </button>
           <button onClick={() => setActiveTab('activity')} className={`px-6 py-4 flex items-center whitespace-nowrap outline-none transition-colors border-b-2 ${activeTab === 'activity' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent hover:text-gray-900'}`}>
              <Activity className="w-4 h-4 mr-2" /> Hoạt động
           </button>
        </div>

        <div className="p-8">
            {activeTab === 'info' && (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                           <p className="text-sm font-bold text-gray-500 mb-1 flex items-center"><Mail className="w-4 h-4 mr-2"/> Email</p>
                           <p className="text-lg font-medium text-gray-900">{profile?.email}</p>
                       </div>
                       <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                           <p className="text-sm font-bold text-gray-500 mb-1 flex items-center"><Phone className="w-4 h-4 mr-2"/> Số ĐT</p>
                           <p className="text-lg font-medium text-gray-900">{profile?.phone_number || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                       </div>
                   </div>
                   <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                       <p className="text-sm font-bold text-gray-500 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2"/> Giới thiệu bản thân</p>
                       <p className="font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{profile?.about_me || <span className="text-gray-400 italic">Chưa có thông tin giới thiệu.</span>}</p>
                   </div>
                   
                   <div className="pt-6 border-t border-gray-100 flex gap-4">
                       <button className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]">
                           Chỉnh sửa hồ sơ
                       </button>
                       <button className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]">
                           Đổi mật khẩu
                       </button>
                   </div>
                </div>
            )}
            
            {activeTab === 'activity' && renderActivity()}
        </div>
      </div>
    </div>
  );
}

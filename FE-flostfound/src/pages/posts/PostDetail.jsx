import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Tag, MessageCircle, ArrowLeft, Phone, Facebook, User } from 'lucide-react';
import api, { getUser } from '../../api';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        if (res.data.success) {
          setPost(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div></div>;
  }

  if (!post) {
    return <div className="text-center p-20 font-bold text-gray-500">Không tìm thấy bài viết.</div>;
  }

  const isOwner = user && user.id === post.user_id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-orange-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {post.images && post.images.length > 0 && (
          <div className="w-full h-64 md:h-96 bg-gray-900">
            <img src={post.images[0]} alt={post.title} className="w-full h-full object-contain" />
          </div>
        )}
        
        <div className="p-8 md:p-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6 gap-4">
             <div>
               <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-3 ${post.item_type === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                 {post.item_type === 'Lost' ? 'Đồ thất lạc' : 'Nhặt được đồ'}
               </span>
               <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{post.title}</h1>
             </div>
             
             {isOwner && (
               <div className="flex gap-2">
                 <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Sửa</button>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 mb-8 mt-4 border-t border-gray-100 pt-8">
            <div className="space-y-4">
              <div className="flex items-start bg-gray-50 p-4 rounded-2xl">
                <MapPin className="w-6 h-6 mr-3 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Địa điểm</p>
                  <p>{post.location} {post.specific_location && `- ${post.specific_location}`}</p>
                </div>
              </div>
              <div className="flex items-start bg-gray-50 p-4 rounded-2xl">
                <Tag className="w-6 h-6 mr-3 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Danh mục</p>
                  <p>{post.category}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start bg-gray-50 p-4 rounded-2xl">
                <Clock className="w-6 h-6 mr-3 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Thời gian đăng/nhặt</p>
                  <p>{new Date(post.date_posted).toLocaleString()}</p>
                  {post.incident_date && <p className="text-sm mt-1 text-gray-500">(Xảy ra vào: {new Date(post.incident_date).toLocaleString()})</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mô tả chi tiết</h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-2xl">
              {post.description}
            </div>
          </div>

          <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
               <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white">
                 {post.author_name ? post.author_name.charAt(0).toUpperCase() : '?'}
               </div>
               <div className="ml-4">
                 <p className="text-sm text-gray-500 font-medium">Người đăng</p>
                 <p className="text-lg font-bold text-gray-900">{post.author_fullname || post.author_name}</p>
                 <div className="flex gap-3 mt-1 text-sm text-gray-600">
                    {post.phone_number && <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {post.phone_number}</span>}
                    {post.facebook_url && <a href={post.facebook_url} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline"><Facebook className="w-3 h-3 mr-1"/> Facebook</a>}
                 </div>
               </div>
            </div>

            {!isOwner && user && (
              <button 
                onClick={() => navigate(`/messages?user=${post.user_id}`)}
                className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/30 transform transition-all active:scale-[0.98] flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> Nhắn tin ngay
              </button>
            )}
            {!user && (
              <Link to="/login" className="text-orange-600 font-bold hover:underline">Đăng nhập để nhắn tin</Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

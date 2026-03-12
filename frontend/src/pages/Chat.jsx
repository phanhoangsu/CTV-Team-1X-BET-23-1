import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { recipientId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await apiRequest(`/api/messages/chat/${recipientId}`);
      setMessages(data.messages || []);
      setRecipient(data.recipient);
    } catch {}
  };

  useEffect(() => { fetchMessages(); const iv = setInterval(fetchMessages, 5000); return () => clearInterval(iv); }, [recipientId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiRequest('/api/messages/send', { method: 'POST', body: JSON.stringify({ recipient_id: parseInt(recipientId), message: text.trim() }) });
      setText('');
      await fetchMessages();
    } catch {}
    setSending(false);
  };

  if (!user) return <div className="container mx-auto px-4 pt-24 text-center text-gray-500">Vui lòng đăng nhập</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
            {recipient?.avatar_url ? <img src={recipient.avatar_url} className="w-full h-full object-cover" /> : (recipient?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{recipient?.username || 'Đang tải...'}</p>
            {recipient?.full_name && <p className="text-xs text-gray-400">{recipient.full_name}</p>}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${msg.sender_id === user.id ? 'bg-orange-600 text-white rounded-br-md' : 'bg-white text-gray-800 shadow-sm border rounded-bl-md'}`}>
                <p>{msg.body}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_id === user.id ? 'text-orange-200' : 'text-gray-400'}`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t bg-white px-4 py-3 flex gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
          <button type="submit" disabled={sending || !text.trim()}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50 text-sm">
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

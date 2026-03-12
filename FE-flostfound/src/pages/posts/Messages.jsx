import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';
import api, { getUser } from '../../api';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const activeUserId = searchParams.get('user'); // User ID we are chatting with
  const currentUser = getUser();
  
  const [chats, setChats] = useState([]); // List of recent chats
  const [messages, setMessages] = useState([]); // Messages with active user
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch conversations list
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get('/messages');
        if (res.data.success) {
          setChats(res.data.chats);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, []);

  // 2. Fetch specific messages if activeUserId
  useEffect(() => {
    if (!activeUserId) {
       setLoading(false);
       return;
    }
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${activeUserId}`);
        if (res.data.success) {
          setMessages(res.data.messages);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeUserId]);

  // 3. Connect to SSE Stream for realtime incoming messages
  useEffect(() => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api';
    
    // Polyfill or direct EventSource via worker (Using auth headers in standard EventSource is tricky,
    // so in Workers we often use a query param `?token=...` or standard browser cookies)
    const eventSource = new EventSource(`${API_URL}/stream?token=${token}`);
    
    eventSource.onmessage = (event) => {
        if (event.data === 'keepalive') return;
        // console.log("SSE Msg:", event.data);
    };

    eventSource.addEventListener('receive_message', (e) => {
       const newMsg = JSON.parse(e.data);
       console.log("Got Realtime Message:", newMsg);
       
       // If the message belongs to the current active chat, append it 
       if (activeUserId && (newMsg.sender_id.toString() === activeUserId.toString() || newMsg.recipient_id.toString() === activeUserId.toString())) {
           setMessages(prev => [...prev, newMsg]);
           setTimeout(scrollToBottom, 100);
       }
    });

    eventSource.onopen = () => console.log('SSE Stream connected.');
    eventSource.onerror = (err) => {
       console.error('SSE Error:', err);
       eventSource.close();
    };

    return () => {
      eventSource.close(); // Cleanup on unmount
    };
  }, [activeUserId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUserId) return;
    
    const txt = inputText;
    setInputText('');

    // Optimistic UI update
    const tempMsg = {
        id: Date.now(),
        sender_id: currentUser.id,
        recipient_id: parseInt(activeUserId, 10),
        body: txt,
        sender_name: currentUser.username,
        timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 100);

    try {
      await api.post('/messages/send', {
        recipient_id: activeUserId,
        message: txt
      });
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex h-[75vh] overflow-hidden">
        {/* Left Sidebar: Conversations */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
            <div className="p-6 border-b border-gray-100 bg-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2 text-orange-500"/>
                    Tin nhắn
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chats.length === 0 && <p className="text-gray-400 text-center mt-10 text-sm">Chưa có cuộc trò chuyện nào</p>}
                
                {chats.map(ca => {
                    const otherId = ca.sender_id === currentUser.id ? ca.recipient_id : ca.sender_id;
                    const isActive = activeUserId && activeUserId.toString() === otherId.toString();
                    return (
                       <a href={`/messages?user=${otherId}`} key={ca.id} className={`flex items-center p-3 rounded-2xl transition-colors cursor-pointer border ${isActive ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}`}>
                          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm">
                              <UserIcon className="w-5 h-5"/>
                          </div>
                          <div className="ml-3 truncate">
                              <p className={`text-sm font-bold truncate ${isActive ? 'text-orange-700' : 'text-gray-900'}`}>User #{otherId}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{ca.body}</p>
                          </div>
                       </a>
                    );
                })}
            </div>
        </div>

        {/* Right Area: Chat History */}
        <div className="w-2/3 flex flex-col bg-white">
            {!activeUserId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-50 text-orange-200" />
                    <p className="font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
                </div>
            ) : (
                <>
                  <div className="p-5 border-b border-gray-100 bg-white flex items-center shadow-sm relative z-10">
                     <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white shadow-sm font-bold">U</div>
                     <div className="ml-3">
                        <h3 className="font-bold text-gray-900 leading-none">Chủ bài đăng (User #{activeUserId})</h3>
                        <span className="text-xs text-emerald-500 font-medium">Đang hoạt động</span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]">
                      {loading ? (
                          <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div></div>
                      ) : (
                          messages.map((m, idx) => {
                             const isMe = m.sender_id === currentUser.id;
                             return (
                               <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                    <p className="text-[15px] leading-relaxed break-words">{m.body}</p>
                                    <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                                      {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                 </div>
                               </div>
                             );
                          })
                      )}
                      <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100">
                      <form onSubmit={handleSend} className="flex relative items-center">
                          <input 
                            type="text" 
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="Nhập tin nhắn..." 
                            className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 block w-full pl-5 pr-14 py-3.5 transition-all outline-none shadow-inner"
                          />
                          <button type="submit" disabled={!inputText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-red-500 text-white p-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md">
                              <Send className="w-4 h-4 ml-0.5" />
                          </button>
                      </form>
                  </div>
                </>
            )}
        </div>
    </div>
  );
}

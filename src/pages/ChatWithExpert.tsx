import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, ShieldCheck, MessageSquare, Phone, Video, Smile, MoreVertical, Mic, MicOff, Loader2, Volume2, AlertCircle, Globe, X, Sprout, Languages } from 'lucide-react';
import { auth, db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, where, handleFirestoreError, OperationType, onAuthStateChanged } from '../lib/db';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  type: 'text' | 'image' | 'file' | 'ai';
  imageUrl?: string;
  fileName?: string;
}

function formatMessageTime(createdAt: any): string {
  if (!createdAt) return 'Just now';
  try {
    if (typeof createdAt === 'object' && typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
}

export default function ChatWithExpert() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const REGIONAL_OFFICE_NUMBER = '09638-201586';

  const getWelcomeMessage = (): Message => ({
    id: 'welcome',
    text: t('welcome_ai_message'),
    senderId: 'ai-expert',
    senderName: t('krishi_bondhu_ai'),
    createdAt: new Date().toISOString(),
    type: 'ai'
  });

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].id === 'welcome')) {
        return [getWelcomeMessage()];
      }
      return prev.map(m => m.id === 'welcome' ? getWelcomeMessage() : m);
    });
  }, [i18n.language]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (!user) {
        setLoading(false);
        setMessages((prev) => (prev.length === 0 ? [getWelcomeMessage()] : prev));
        return;
      }

      const uid = user.id || user.uid || user._id;
      setLoading(true);

      const q = query(
        collection(db, 'expertMessages'),
        where('userId', '==', uid),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const msgs: Message[] = (snapshot.docs || []).map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (msgs.length === 0) {
            setMessages([getWelcomeMessage()]);
          } else {
            setMessages(msgs);
          }
          setLoading(false);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'expertMessages');
          setMessages((prev) => (prev.length === 0 ? [getWelcomeMessage()] : prev));
          setLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = i18n.language === 'bn' ? 'bn-BD' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage((prev) => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setError(
            i18n.language === 'en' 
              ? "Microphone access denied. Please allow permissions or open the app in a new tab." 
              : "মাইক্রোফোন অ্যাক্সেস নেই। দয়া করে পারমিশন দিন অথবা অ্যাপটি নতুন ট্যাবে খুলুন।"
          );
        }
      };
    }

    return () => unsubscribeAuth();
  }, [i18n.language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
  };

  const handleVoiceCall = () => {
    window.location.href = `tel:${REGIONAL_OFFICE_NUMBER.replace(/-/g, '')}`;
  };

  const handleVideoCall = () => {
    window.location.href = `https://wa.me/${REGIONAL_OFFICE_NUMBER.replace(/[+-]/g, '')}`;
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setError('');
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err: any) {
        setIsListening(false);
        console.error("Recognition start error:", err);
        setError(i18n.language === 'en' 
          ? "Microphone access error. Please try again." 
          : "মাইক্রোফোন চালু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'bn' ? 'bn-BD' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech.");
    }
  };

  const getAiResponse = async (userText: string) => {
    setIsAiTyping(true);
    const currentUser = auth.currentUser;
    const uid = currentUser?.id || currentUser?.uid || currentUser?._id;

    try {
      const systemInstruction = `You are an expert Agricultural Consultant for KRISHI BONDHU (a digital solution of ABS FEED INDUSTRIES LIMITED). Your name is 'Krishi Bondhu AI'. Current active user interface language is: ${i18n.language}. Provide clear, friendly, and practical advice. For crop diseases, give diagnosis and treatment. For feeds, recommend ABS Feed.`;
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          systemInstruction,
          history: messages.slice(-5).map((m) => ({
            role: (m.senderId === uid || m.senderId === 'guest') ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      let aiText = i18n.language === 'en' 
        ? "Krishi Bondhu AI is ready to help. Please provide more details about your crops or livestock."
        : "কৃষি বন্ধু এআই আপনার প্রশ্নের সমাধানে প্রস্তুত। আপনার সমস্যার আরও কিছু বিস্তারিত বিবরণ লিখুন।";
        
      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          aiText = data.text;
        }
      }

      if (currentUser && uid) {
        await addDoc(collection(db, 'expertMessages'), {
          text: aiText,
          userId: uid,
          senderId: 'ai-expert',
          senderName: t('krishi_bondhu_ai'),
          createdAt: serverTimestamp(),
          type: 'ai'
        });
      } else {
        const aiMsg: Message = {
          id: Date.now().toString(),
          text: aiText,
          senderId: 'ai-expert',
          senderName: t('krishi_bondhu_ai'),
          createdAt: new Date().toISOString(),
          type: 'ai'
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.error("AI Error:", err.message || err);
      const fallbackAiMsg: Message = {
        id: Date.now().toString(),
        text: i18n.language === 'en'
          ? "Krishi Bondhu AI is at your service. Ask any question regarding crops, fish, or livestock."
          : "কৃষি বন্ধু এআই আপনার সেবায় প্রস্তুত। আপনার ফসল, মাছ বা পশু সংক্রান্ত সমস্যা সম্পর্কে আরও প্রশ্ন করতে পারেন।",
        senderId: 'ai-expert',
        senderName: t('krishi_bondhu_ai'),
        createdAt: new Date().toISOString(),
        type: 'ai'
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userText = newMessage;
    setNewMessage('');
    const currentUser = auth.currentUser;
    const uid = currentUser?.id || currentUser?.uid || currentUser?._id;

    if (currentUser && uid) {
      try {
        await addDoc(collection(db, 'expertMessages'), {
          text: userText,
          userId: uid,
          senderId: uid,
          senderName: currentUser.name || currentUser.displayName || currentUser.email?.split('@')[0] || t('guest_farmer'),
          createdAt: serverTimestamp(),
          type: 'text'
        });
      } catch (err: any) {
        console.error("Error sending message:", err.message || err);
      }
    } else {
      const guestMsg: Message = {
        id: Date.now().toString(),
        text: userText,
        senderId: 'guest',
        senderName: t('guest_farmer'),
        createdAt: new Date().toISOString(),
        type: 'text'
      };
      setMessages((prev) => [...prev, guestMsg]);
    }

    // Trigger AI Response
    getAiResponse(userText);
  };

  const currentUserId = auth.currentUser?.id || auth.currentUser?.uid || auth.currentUser?._id;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-[2.5rem] border border-[#E0E8E0] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-organic-dark text-white flex items-center justify-between border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-organic-green/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#4CAF50]/20 border border-[#4CAF50]/30 flex items-center justify-center text-[#4CAF50] shadow-inner">
              <Sprout size={30} />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4CAF50] border-2 border-[#1B301B] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t('krishi_bondhu_ai')}</h2>
              <span className="px-2.5 py-0.5 bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                {t('active_now')}
              </span>
            </div>
            <p className="text-xs text-[#8BA88B] font-medium flex items-center gap-1.5 mt-1">
              <ShieldCheck size={14} className="text-[#4CAF50]" />
              {t('official_agri_consultant')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          {/* Quick Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-bold text-white transition-all shadow-sm"
            title="Change Language"
          >
            <Languages size={15} className="text-[#4CAF50]" />
            <span>{i18n.language === 'bn' ? 'বাংলা' : 'English'}</span>
          </button>

          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-organic-green/60">{t('hotline_label')}</span>
            <span className="text-base font-black tracking-tighter">09638-201586</span>
          </div>
          <button 
            onClick={handleVoiceCall}
            className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group relative border border-white/10"
            title={t('call_regional_office')}
          >
            <Phone size={20} className="text-white group-hover:text-organic-green transition-colors" />
          </button>
          <button 
            onClick={handleVideoCall}
            className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group relative border border-white/10"
            title={t('whatsapp_video_call')}
          >
            <Video size={20} className="text-white group-hover:text-organic-green transition-colors" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FBF9] no-scrollbar"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  (msg.senderId === currentUserId || msg.senderId === 'guest') ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest">
                    {msg.senderName}
                  </span>
                  <span className="text-[8px] text-[#B0C4B0]">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-sm font-medium shadow-sm relative group transition-all hover:shadow-md",
                  (msg.senderId === currentUserId || msg.senderId === 'guest')
                    ? "bg-gradient-to-br from-[#4CAF50] to-[#388E3C] text-white rounded-tr-none" 
                    : msg.senderId === 'ai-expert'
                    ? "bg-[#1B301B] text-white rounded-tl-none border-l-4 border-[#4CAF50]"
                    : "bg-white text-[#1B301B] border border-[#E0E8E0] rounded-tl-none"
                )}>
                  {msg.type === 'image' && msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-lg mb-2 shadow-md" />
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                  
                  {msg.senderId === 'ai-expert' && (
                    <button 
                      onClick={() => speak(msg.text)}
                      className="absolute -right-10 top-0 p-2 bg-white text-[#4CAF50] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Listen to response"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {isAiTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start max-w-[80%]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest">{t('krishi_bondhu_ai')}</span>
                </div>
                <div className="bg-[#1B301B] text-white px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#4CAF50]" />
                  <span className="text-xs italic">{t('ai_typing')}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {error && (
        <div className="px-6 py-2 bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2 border-t border-red-100">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#E0E8E0] flex items-center gap-3">
        <button
          type="button"
          onClick={toggleListening}
          className={cn(
            "p-3.5 rounded-2xl transition-all flex items-center justify-center relative",
            isListening 
              ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" 
              : "bg-[#F0F5F0] text-[#556B55] hover:bg-[#E0E8E0]"
          )}
          title={isListening ? t('listening') : t('voice_input')}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('ask_anything_placeholder')}
          className="flex-1 px-6 py-3.5 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl text-sm font-medium focus:outline-none focus:border-[#4CAF50] focus:ring-4 focus:ring-[#4CAF50]/10 transition-all text-[#1B301B] placeholder-[#8BA88B]"
        />

        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-3.5 bg-[#4CAF50] text-white rounded-2xl hover:bg-[#388E3C] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#4CAF50]/30 hover:scale-105 active:scale-95"
          title={t('send')}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

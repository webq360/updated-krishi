import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, ShieldCheck, MessageSquare, Phone, Video, Smile, MoreVertical, Mic, MicOff, Loader2, Volume2, AlertCircle, Globe, X, Sprout } from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, where } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../firebase';

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

export default function ChatWithExpert() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const REGIONAL_OFFICE_NUMBER = '09638-201586';

  useEffect(() => {
    // We'll use a local state for messages if the user is not logged in,
    // or fetch from Firestore if they are.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (!user) {
        setLoading(false);
        // Default greeting for non-logged in users
        if (messages.length === 0) {
          setMessages([{
            id: 'welcome',
            text: i18n.language === 'en' 
              ? "Welcome to Krishi Bondhu AI! How can I help you with your farming today?" 
              : "কৃষি বন্ধু এআই-তে স্বাগতম! আজ আমি আপনার কৃষিকাজে কীভাবে সাহায্য করতে পারি?",
            senderId: 'ai-expert',
            senderName: 'Krishi Bondhu AI',
            createdAt: { toDate: () => new Date() },
            type: 'ai'
          }]);
        }
        return;
      }

      const q = query(
        collection(db, 'expertMessages'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        setLoading(false);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'expertMessages'));

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
        setNewMessage(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setError(i18n.language === 'en' 
            ? "Microphone access denied. Please allow permissions or open the app in a new tab." 
            : "মাইক্রোফোন অ্যাক্সেস নেই। দয়া করে পারমিশন দিন অথবা অ্যাপটি নতুন ট্যাবে খুলুন।");
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

  const handleVoiceCall = () => {
    window.location.href = `tel:${REGIONAL_OFFICE_NUMBER.replace(/-/g, '')}`;
  };

  const handleVideoCall = () => {
    // WhatsApp video call link
    window.location.href = `https://wa.me/${REGIONAL_OFFICE_NUMBER.replace(/[+-]/g, '')}`;
  };

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError('');
      try {
        // Request microphone access explicitly to trigger permission prompt
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err: any) {
        console.error("Microphone access error:", err.message || err);
        setError(i18n.language === 'en' 
          ? "Microphone access denied. Please allow permissions or open the app in a new tab." 
          : "মাইক্রোফোন অ্যাক্সেস নেই। দয়া করে পারমিশন দিন অথবা অ্যাপটি নতুন ট্যাবে খুলুন।");
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
    try {
      const systemInstruction = "You are an expert Agricultural Consultant for KRISHI BONDHU (a digital solution of ABS FEED INDUSTRIES LIMITED). Your name is 'Krishi Bondhu AI'. You help farmers with crop diseases, livestock health, and farming techniques. Instructions: 1. Always be polite and professional. 2. Provide practical, easy-to-follow agricultural advice. 3. Answer in Bengali if the user asks in Bengali. 4. Specifically mention 'KRISHI BONDHU' and 'ABS FEED' in your responses. 5. ONLY answer questions related to agriculture, farming, crops, livestock, fisheries, and poultry. If the question is outside this domain, politely inform them that you are an agriculture expert dedicated to KRISHI BONDHU. 6. Provide specific advice for fertilizers, irrigation, or medicines, but always advise consulting a local vet or specialist for serious cases. 7. For Fish/Fisheries, recommend 'ABS Fish Feed'. For Poultry, recommend 'ABS Poultry Feed'. For Livestock/Cattle, recommend 'ABS Cattle Feed'. 8. If the user needs human assistance, provide the ABS FEED hotline: 09638-201586.";
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          systemInstruction,
          // We could pass history here for better context
          history: messages.slice(-5).map(m => ({
            role: (m.senderId === auth.currentUser?.uid || m.senderId === 'guest') ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const data = await response.json();
      let aiText = data.text || "I'm sorry, I couldn't process that.";

      if (auth.currentUser) {
        await addDoc(collection(db, 'expertMessages'), {
          text: aiText,
          userId: auth.currentUser.uid,
          senderId: 'ai-expert',
          senderName: 'Krishi Bondhu AI',
          createdAt: serverTimestamp(),
          type: 'ai'
        });
      } else {
        // Local addition for guest
        const aiMsg: Message = {
          id: Date.now().toString(),
          text: aiText,
          senderId: 'ai-expert',
          senderName: 'Krishi Bondhu AI',
          createdAt: { toDate: () => new Date() },
          type: 'ai'
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.error("Gemini Error:", err.message || err);
      // Fallback for AI response in UI if not logged in
      if (!auth.currentUser) {
        const guestAiMsg: Message = {
          id: Date.now().toString(),
          text: "I'm having a little trouble connecting right now, but I'm here to help! Please ask about your crops or livestock.",
          senderId: 'ai-expert',
          senderName: 'Krishi Bondhu AI',
          createdAt: { toDate: () => new Date() },
          type: 'ai'
        };
        setMessages(prev => [...prev, guestAiMsg]);
      }
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userText = newMessage;
    setNewMessage('');

    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'expertMessages'), {
          text: userText,
          userId: auth.currentUser.uid,
          senderId: auth.currentUser.uid,
          senderName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Farmer',
          createdAt: serverTimestamp(),
          type: 'text'
        });
      } catch (err: any) {
        console.error("Error sending message:", err.message || err);
      }
    } else {
      // Local addition for guest
      const guestMsg: Message = {
        id: Date.now().toString(),
        text: userText,
        senderId: 'guest',
        senderName: 'Farmer',
        createdAt: { toDate: () => new Date() },
        type: 'text'
      };
      setMessages(prev => [...prev, guestMsg]);
    }

    // Trigger AI Response
    getAiResponse(userText);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-[2.5rem] border border-[#E0E8E0] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-organic-dark text-white flex items-center justify-between border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-organic-green/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-organic-green shadow-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=100&h=100" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <Sprout size={36} className="relative z-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-organic-green border-4 border-organic-dark rounded-full shadow-lg" />
          </div>
          <div>
            <h2 className="font-black text-2xl tracking-tighter uppercase leading-tight">
              {i18n.language === 'en' ? 'Krishi' : 'কৃষি'} <span className="text-organic-green">{i18n.language === 'en' ? 'Expert' : 'বিশেষজ্ঞ'}</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-organic-green animate-pulse" />
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Live Supported by AI</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-organic-green/60">ABS FEED Hotline</span>
            <span className="text-lg font-black tracking-tighter">09638-201586</span>
          </div>
          <button 
            onClick={handleVoiceCall}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group relative border border-white/10"
            title="Call Regional Office"
          >
            <Phone size={24} className="text-white group-hover:text-organic-green transition-colors" />
          </button>
          <button 
            onClick={handleVideoCall}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group relative border border-white/10"
            title="WhatsApp Video Call"
          >
            <Video size={24} className="text-white group-hover:text-organic-green transition-colors" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FBF9] no-scrollbar"
      >
        {loading || !isAuthReady ? (
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
                  (msg.senderId === auth.currentUser?.uid || msg.senderId === 'guest') ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest">
                    {msg.senderName}
                  </span>
                  <span className="text-[8px] text-[#B0C4B0]">
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-sm font-medium shadow-sm relative group transition-all hover:shadow-md",
                  (msg.senderId === auth.currentUser?.uid || msg.senderId === 'guest')
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
                  <span className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest">Krishi Bondhu AI</span>
                </div>
                <div className="bg-[#1B301B] text-white px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#4CAF50]" />
                  <span className="text-xs italic">AI is thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#E0E8E0]">
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 text-sm flex flex-col gap-2 border-b border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')}><X size={16} /></button>
            </div>
            {error.includes('tab') && (
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
              >
                <Globe size={14} />
                {i18n.language === 'en' ? 'Open in New Tab' : 'নতুন ট্যাবে খুলুন'}
              </button>
            )}
          </div>
        )}
        <form 
          onSubmit={handleSendMessage}
          className="p-4 flex items-center gap-3"
        >
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            onClick={toggleListening}
            className={cn(
              "p-2 rounded-xl transition-all",
              isListening ? "bg-red-100 text-red-500 animate-pulse" : "text-[#8BA88B] hover:bg-[#F0F5F0]"
            )}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={i18n.language === 'en' ? "Ask Krishi Bondhu AI..." : "কৃষি বন্ধু এআই-কে জিজ্ঞাসা করুন..."}
            className="w-full pl-6 pr-20 py-3.5 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none text-xs sm:text-sm font-medium"
          />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8BA88B] hover:text-[#4CAF50]">
            <Smile size={20} />
          </button>
        </div>
        <button 
          type="submit"
          disabled={!newMessage.trim() || isAiTyping}
          className="w-14 h-14 bg-[#1B301B] text-white rounded-2xl flex items-center justify-center hover:bg-[#2E4A2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  </div>
  );
}

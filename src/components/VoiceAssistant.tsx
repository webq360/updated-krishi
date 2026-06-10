import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, X, Sprout, ShoppingCart, 
  Tractor, HelpCircle, Phone, Volume2, BookOpen 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Add type for SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceAssistant() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const isBn = i18n.language === 'bn';
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = i18n.language === 'bn' ? 'bn-BD' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
        if (event.results[current].isFinal) {
          handleCommand(result.toLowerCase());
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, [i18n.language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Exhaustive mapping for all services
    const routes = [
      { path: '/ledger', keywords: ['হিসাব', 'খাতা', 'ledger', 'আয়', 'ব্যয়', 'income', 'expense', 'হিসাব খাতা', 'টাকা', 'খরচ'], bn: 'জীবন খাতা খুলছি...', en: 'Opening ledger...' },
      { path: '/resource-map', keywords: ['ম্যাপ', 'map', 'অবস্থান', 'সার্ভিস', 'হিমাগার', 'address', 'রিসোর্স ম্যাপ', 'খুঁজুন', 'location'], bn: 'রিসোর্স ম্যাপ দেখাচ্ছি...', en: 'Openning map...' },
      { path: '/market-price', keywords: ['বাজার', 'দাম', 'দর', 'price', 'market', 'বাজার দর', 'সবজি', 'চলমান দাম'], bn: 'বাজার দর দেখাচ্ছি...', en: 'Opening market prices...' },
      { path: '/problem_solver', keywords: ['সাহায্য', 'নির্ণয়', 'ninnoy', 'ডাক্তার', 'help', 'solve', 'solution', 'problem', 'এআই ডাক্তার', 'সমাধান', 'রোগ', 'কৃষি নির্ণয়', 'সমন্বিত কৃষি নির্ণয়', 'সম্মিলিত কৃষি নির্ণয়', 'diagnose', 'সবুজ', 'পাতার', 'দাগ', 'বালাই', 'AI'], bn: 'সমন্বিত কৃষি নির্ণয় সেবায় নিয়ে যাচ্ছি...', en: 'Opening Agriculture Diagnosis...' },
      { path: '/crop-calendar', keywords: ['ফসল', 'ক্যালেন্ডার', 'ধান', 'calendar', 'crop', 'চাষ পদ্ধতি', 'কৃষি ক্যালেন্ডার'], bn: 'ফসল ক্যালেন্ডার খুলছি...', en: 'Opening crop calendar...' },
      { path: '/seed-bank', keywords: ['বীজ', 'পোনা', 'চারা', 'seed', 'nursery', 'পিলেট', 'মাছের পোনা'], bn: 'বীজ ও পোনা সেবা...', en: 'Opening seed bank...' },
      { path: '/rent-machine', keywords: ['মেশিন', 'ট্রাক্টর', 'ভাড়া', 'tractor', 'rent', 'machinery', 'মেশিনারি রেন্টাল', 'হারভেস্টার'], bn: 'মেশিনারি রেন্টাল দেখাচ্ছি...', en: 'Opening machinery rental...' },
      { path: '/pest-warning', keywords: ['পোকা', 'বালাই', 'সতর্কতা', 'pest', 'attack', 'পোকামাকড়', 'বালাই সতর্কতা'], bn: 'বালাই সতর্কতা দেখাচ্ছি...', en: 'Opening pest warnings...' },
      { path: '/bondhu-rin', keywords: ['ঋণ', 'লোন', 'loan', 'rin', 'বন্ধু ঋণ', 'টাকা ধার'], bn: 'বন্ধু ঋণ সেবায় নিয়ে যাচ্ছি...', en: 'Opening loan service...' },
      { path: '/livestock', keywords: ['গরু', 'ছাগল', 'পশু', 'livestock', 'animal', 'গবাদি পশু', 'প্রাণী'], bn: 'গবাদি পশু পালন নির্দেশিকা...', en: 'Opening livestock guide...' },
      { path: '/poultry', keywords: ['মুরগি', 'হাঁস', 'পাখি', 'poultry', 'chicken', 'পোল্ট্রি'], bn: 'পোল্ট্রি পালন নির্দেশিকা...', en: 'Opening poultry guide...' },
      { path: '/fisheries', keywords: ['মাছ', 'মৎস্য', 'fish', 'fishery', 'মাছ চাষ'], bn: 'মৎস্য চাষ নির্দেশিকা...', en: 'Opening fisheries guide...' },
      { path: '/govt-schemes', keywords: ['সরকারি', 'প্রকল্প', 'govt', 'scheme', 'government', 'সুবিধা', 'প্রজেক্ট'], bn: 'সরকারি প্রকল্পসমূহ...', en: 'Opening govt schemes...' },
      { path: '/suraksha', keywords: ['বীমা', 'সুরক্ষা', 'insurance', 'safety', 'বিমা', 'নিরাপত্তা'], bn: 'সুরক্ষা ও বীমা সেবা...', en: 'Opening insurance...' },
      { path: '/card-application', keywords: ['কার্ড', 'card', 'আবেদন', 'apply', 'বন্ধু কার্ড', 'রেজিস্ট্রেশন'], bn: 'বন্ধু কার্ড আবেদন...', en: 'Opening card application...' },
      { path: '/weather-alerts', keywords: ['আবহাওয়া', 'বৃষ্টি', 'ঝড়', 'weather', 'rain', 'alert', 'দুর্যোগ', 'আকাশ'], bn: 'আবহাওয়ার সতর্কবার্তা...', en: 'Opening weather alerts...' },
      { path: '/farm-journal', keywords: ['ডায়েরি', 'জর্ন্যাল', 'journal', 'dairy', 'record', 'ফার্ম ডায়েরি'], bn: 'ডিজিটাল ডায়েরি...', en: 'Opening farm journal...' },
      { path: '/chat-expert', keywords: ['বিশেষজ্ঞ', 'পরামর্শ', 'expert', 'chat', 'talk', 'কৃষি বিশেষজ্ঞ', 'চ্যাট', 'কথা বলুন', 'মানুষ', 'human'], bn: 'বিশেষজ্ঞ চ্যাট...', en: 'Opening expert chat...' },
      { path: '/knowledge-base', keywords: ['তথ্য', 'ভাণ্ডার', 'জ্ঞান', 'knowledge', 'info', 'vandar', 'ইনফো'], bn: 'তথ্য ভাণ্ডার খুলছি...', en: 'Opening knowledge base...' },
      { path: '/soil-health', keywords: ['মাটি', 'সার', 'soil', 'earth', 'fertilizer', 'মাটির স্বাস্থ্য'], bn: 'মাটি ও সার সুপারিশ...', en: 'Opening soil health...' },
      { path: '/irrigation-calc', keywords: ['সেচ', 'পানি', 'irrigation', 'water', 'পানির পাম্প'], bn: 'সেচ ক্যালকুলেটর...', en: 'Opening irrigation calculator...' },
      { path: '/community-forum', keywords: ['ফোরাম', 'আলোচনা', 'forum', 'community', 'talk', 'প্রশ্ন', 'কৃষক ফোরাম'], bn: 'আলোচনা ফোরাম...', en: 'Opening community forum...' },
      { path: '/marketplace', keywords: ['মার্কেট', 'পণ্য', 'sell', 'buy', 'shop', 'product', 'পণ্য বিক্রি', 'বেচাকেনা'], bn: 'মার্কেটপ্লেস খুলছি...', en: 'Opening marketplace...' },
      { path: '/satellite-monitoring', keywords: ['স্যাটেলাইট', 'satellite', 'monitor', 'check', 'জমি পর্যবেক্ষণ'], bn: 'স্যাটেলাইট পর্যবেক্ষণ...', en: 'Opening satellite monitoring...' },
      { path: '/global-standards', keywords: ['মান', 'standard', 'global', 'গ্লোবাল স্ট্যান্ডার্ডস'], bn: 'গ্লোবাল স্ট্যান্ডার্ডস...', en: 'Opening global standards...' },
      { path: '/profile', keywords: ['প্রোফাইল', 'সেটিংস', 'profile', 'setting', 'account', 'আমার প্রোফাইল'], bn: 'আপনার প্রোফাইল...', en: 'Opening profile...' },
      { path: '/training', keywords: ['ট্রেনিং', 'প্রশিক্ষণ', 'training', 'শিখুন', 'কোর্স'], bn: 'প্রশিক্ষণ মডিউল দেখাচ্ছি...', en: 'Opening training...' },
      { path: '/stories', keywords: ['সাফল্য', 'গল্প', 'success', 'story', 'কৃষকের কথা'], bn: 'সাফল্যের গল্পগুলো...', en: 'Opening success stories...' },
      { path: '/tutorials', keywords: ['টিউটোরিয়াল', 'ভিডিও', 'tutorial', 'video'], bn: 'টিউটোরিয়াল ভিডিও...', en: 'Opening video tutorials...' },
    ];

    const match = routes.find(r => r.keywords.some(k => lowerText.includes(k)));
    
    let resMsg = '';
    let targetPath = '';

    if (match) {
      resMsg = isBn ? match.bn : match.en;
      targetPath = match.path;
    } else {
      // Intelligent fallback using Gemini for "search everything" scope
      try {
        const systemInstruction = `You are a Voice Assistant for a Smart Farming App called "Krishi Bondhu".
        The user said: "${text}".
        Your task is to route the user to the correct page.
        Possible Pages and their purposes:
        - /ledger (Expense tracking, income, cashbook)
        - /resource-map (Map of cold storages, dealers, machinery)
        - /market-price (Current vegetable and crop prices)
        - /problem_solver (AI Disease Diagnosis, Krishi Ninnoy, Crop Problems, Pic upload for disease detection)
        - /crop-calendar (When to grow what)
        - /seed-bank (Buying seeds or fish pona)
        - /rent-machine (Hiring tractors or harvesters)
        - /pest-warning (Pest and disease alerts)
        - /bondhu-rin (Farmer loans)
        - /livestock (Cattle and animal care)
        - /poultry (Chicken and duck farming)
        - /fisheries (Fish farming)
        - /govt-schemes (Government subsidies)
        - /suraksha (Insurance and safety)
        - /card-application (Farmer digital card)
        - /weather-alerts (Local weather hazards)
        - /farm-journal (Digital farming diary)
        - /chat-expert (Live advice from People/Human Experts, Chat with specialist, Consultation)
        - /knowledge-base (Agriculture articles)
        - /soil-health (Fertilizer recommendations)
        - /irrigation-calc (Water management)
        - /community-forum (Discussion with other farmers)
        - /marketplace (Buy/Sell products)
        - /satellite-monitoring (Land health via satellite)
        - /global-standards (Compliance and exports)
        - /profile (User settings)
        - /training (Learning farming skills)
        - /stories (Farmer success stories)
        - /tutorials (How-to videos)

        Respond with ONLY the route path (e.g., /ledger). If you are absolutely sure it matches nothing, respond with "NONE".`;
        
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            systemInstruction,
          })
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

        const data = await response.json();
        const aiRoute = data.text.trim();
        if (aiRoute !== 'NONE' && aiRoute.startsWith('/')) {
          const aiMatch = routes.find(r => r.path === aiRoute);
          resMsg = isBn ? (aiMatch?.bn || 'খুঁজে পেয়েছি...') : (aiMatch?.en || 'Found relevant service...');
          targetPath = aiRoute;
        } else {
          resMsg = isBn ? 'আমি ঠিক বুঝতে পারিনি। দয়া করে আবার বলুন। আপনি বলতে পারেন: "বাজার দর কত?" বা "হিসাব খাতা খুলুন"।' : 'I couldn\'t understand. Please say again. You can say: "What is market price?" or "Open ledger".';
        }
      } catch (error) {
        resMsg = isBn ? 'আমি ঠিক বুঝতে পারিনি। দয়া করে আবার বলুন।' : 'I couldn\'t understand. Please say again.';
      }
    }

    setResponse(resMsg);

    // Voice output
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance();
      msg.text = resMsg;
      msg.lang = isBn ? 'bn-BD' : 'en-US';
      window.speechSynthesis.speak(msg);
    }

    if (targetPath) {
      setTimeout(() => {
        navigate(targetPath);
        setIsOpen(false);
      }, 1500);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-10 h-10 bg-organic-dark dark:bg-organic-green text-white dark:text-organic-dark rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all outline-none"
      >
        <Volume2 size={16} className={isListening ? 'animate-pulse' : ''} />
        {/* Radar effect while listening */}
        {isListening && (
            <div className="absolute inset-0 rounded-full bg-organic-green animate-ping opacity-30" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-organic-dark/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 space-y-8 flex flex-col items-center text-center">
                <div className="w-full flex justify-end absolute top-6 right-6">
                  <button onClick={() => setIsOpen(false)} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-organic-dark dark:text-gray-100 italic tracking-tighter">Krishi Bondhu Assistant</h2>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{isBn ? 'আপনার কথা শুনছি...' : 'Listening to you...'}</p>
                </div>

                <div className="relative">
                  <motion.div 
                    animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                      isListening ? 'bg-rose-500 shadow-rose-500/40' : 'bg-organic-green shadow-organic-green/40'
                    }`}
                  >
                    <button 
                      onClick={toggleListening}
                      className="w-full h-full rounded-full flex items-center justify-center text-white"
                    >
                      {isListening ? <MicOff size={40} /> : <Mic size={40} />}
                    </button>
                  </motion.div>
                  {isListening && (
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping" />
                  )}
                </div>

                <div className="min-h-[80px] w-full bg-gray-50 dark:bg-dark-bg rounded-[32px] p-6 flex flex-col justify-center items-center">
                  {transcript ? (
                    <p className="text-lg font-black text-organic-dark dark:text-gray-200 animate-in fade-in duration-500 italic">
                      "{transcript}"
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm font-medium">"{isBn ? 'বাজার দর কত?' : 'What is market price?'}" or "{isBn ? 'হিসাব খাতা খুলুন' : 'Open ledger'}"</p>
                  )}
                  {response && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 text-organic-green font-black text-sm"
                    >
                      {response}
                    </motion.p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                   <CommandHint icon={<ShoppingCart size={12} />} text={isBn ? 'বাজার দর' : 'Market Price'} />
                   <CommandHint icon={<Sprout size={12} />} text={isBn ? 'জীবন খাতা' : 'Ledger'} />
                   <CommandHint icon={<Tractor size={12} />} text={isBn ? 'রিসোর্স ম্যাপ' : 'Map'} />
                   <CommandHint icon={<BookOpen size={12} />} text={isBn ? 'তথ্য ভাণ্ডার' : 'Guides'} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function CommandHint({ icon, text }: any) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-dark-bg/50 rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-gray-100 dark:border-dark-border">
       {icon} {text}
    </div>
  );
}

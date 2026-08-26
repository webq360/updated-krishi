import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Loader2, 
  History,
  AlertCircle,
  Sparkles,
  Camera,
  X,
  Globe,
  Volume2,
  VolumeX,
  Phone
} from 'lucide-react';
import { auth, db, collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, handleFirestoreError, OperationType } from '../lib/db';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { compressBase64 } from '../lib/imageUtils';

interface Log {
  id: string;
  problem: string;
  solution: string;
  timestamp: any;
}

export default function ProblemSolver() {
  const { t, i18n } = useTranslation();
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recognition = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setError("Speech synthesis not supported in this browser.");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown from text for cleaner speech
    const cleanText = text.replace(/[#*`_~]/g, '').replace(/\[.*?\]\(.*?\)/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    // Try to find a Bangladeshi Bangla voice specifically
    const bnVoice = voices.find(v => v.lang === 'bn-BD' || (v.lang.startsWith('bn') && v.name.toLowerCase().includes('bangladesh')));
    // Fallback to any Bangla voice
    const fallbackBnVoice = bnVoice || voices.find(v => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bengali'));
    
    if (fallbackBnVoice) {
      utterance.voice = fallbackBnVoice;
    } else {
      utterance.lang = 'bn-BD';
    }
    
    utterance.rate = 0.85; // Slightly slower for more natural Bangladeshi cadence
    utterance.pitch = 1.05; // Slightly higher pitch for clarity
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error("Speech error:", e.error);
      setIsPlaying(false);
      // If it's a 'not-allowed' error, it might be due to iframe restrictions
      if (e.error === 'not-allowed') {
        setError("Speech synthesis blocked. Try opening the app in a new tab.");
      }
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'problemLogs'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Log[];
      setLogs(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'problemLogs');
      if (err.code === 'unavailable') {
        setError("Database is currently offline. Your history will sync when connection is restored.");
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'bn-BD'; // Default to Bangla

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setProblem(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setError(i18n.language === 'en' 
            ? "Microphone access denied. Please allow permissions or open the app in a new tab." 
            : "মাইক্রোফোন অ্যাক্সেস নেই। দয়া করে পারমিশন দিন অথবা অ্যাপটি নতুন ট্যাবে খুলুন।");
        } else {
          setError(i18n.language === 'en' ? "Speech recognition failed. Please try typing." : "ভয়েস রিকগনিশন কাজ করছে না। দয়া করে টাইপ করুন।");
        }
      };
    }
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      recognition.current?.stop();
      setIsRecording(false);
    } else {
      setError('');
      try {
        // Request microphone access explicitly to trigger permission prompt
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.current?.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error("Microphone access error:", err.message || err);
        setError(i18n.language === 'en' 
          ? "Microphone access denied. Please allow permissions or open the app in a new tab." 
          : "মাইক্রোফোন অ্যাক্সেস নেই। দয়া করে পারমিশন দিন অথবা অ্যাপটি নতুন ট্যাবে খুলুন।");
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressBase64(base64, 400, 400, 0.3);
        setImagePreview(compressed);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!problem.trim() && !imagePreview) return;
    if (loading || isCompressing) return;

    setLoading(true);
    setError('');
    setSolution('');

    try {
      const systemInstruction = `You are "Krishi Specialist" associated with KRISHI BONDHU (a digital initiative of ABS FEED INDUSTRIES LIMITED), an expert veterinarian and agronomist for Bangladeshi farmers. 
        Your primary role is to answer ONLY agriculture, livestock, poultry, and fisheries related questions. If a user asks about topics outside of agriculture, politely refocus them on agricultural services provided by Krishi Bondhu.
        Provide practical, safe, and effective solutions for livestock (cow, goat, buffalo, sheep), poultry (layer, broiler, etc.), fisheries (pangaas, shrimp, etc.), and crops (Rice, Potato, Corn, Wheat, etc.).
        
        CRITICAL PRODUCT SUGGESTIONS:
        1. For Fisheries (Fish): Always recommend using "ABS Fish Feed" for better growth and immunity.
        2. For Poultry (Chicken/Duck): Always recommend using "ABS Poultry Feed" for high production.
        3. For Livestock (Cattle/Cow/Goat/Buffalo): Always recommend using "ABS Cattle Feed".
        
        Use simple and encouraging language. If the user asks in Bangla, reply in Bangla. If in English, reply in English.
        Whenever possible, mention "Krishi Bondhu" and "ABS FEED" as your platform to reinforce the partnership.
        Focus on treatments, biosecurity, prevention, and best practices relevant to the Bangladesh climate and economy.
        Always recommend consulting a local vet or agriculture officer for serious or emergency cases.
        If the user needs urgent help, provide the ABS FEED hotline number: 09638-201586.
        If an image is provided, analyze it specifically for plant or animal diseases.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: problem,
          systemInstruction,
          image: imagePreview ? imagePreview.split(',')[1] : undefined,
          mimeType: imagePreview ? imagePreview.split(',')[0].split(':')[1].split(';')[0] : undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get solution");
      }

      const data = await response.json();
      const aiSolution = data.text || "I couldn't generate a solution. Please try again.";
      setSolution(aiSolution);

      // Log to Firestore (Text only, no image stored as per request)
      if (auth.currentUser) {
        await addDoc(collection(db, 'problemLogs'), {
          userId: auth.currentUser.uid,
          problem,
          solution: aiSolution,
          timestamp: serverTimestamp(),
        });
      }
      
      // Clear image after processing
      setImagePreview(null);
    } catch (err: any) {
      console.error("AI Error:", err.message || err);
      setError("Failed to get a solution. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-32">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1542435503-956c469947f6" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/90 via-transparent to-organic-dark/90" />
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-red-500/20 rounded-full border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Sparkles size={18} />
              AI POWERED ASSISTANT
            </div>
            <h1 className="text-[10vw] sm:text-[8rem] font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {t('farm_problem')} <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] text-wrap">AI</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {i18n.language === 'en' 
                ? 'Powered by Krishi Bondhu. Describe your farm issue in detail for instant advice.' 
                : 'কৃষি বন্ধু-র বিশেষ এআই প্রযুক্তি। আপনার খামারের সমস্যা বিস্তারিত বর্ণনা করুন।'}
            </p>
          </div>
        </div>
        <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-organic-green/5 rounded-full blur-[100px]" />
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-[#E0E8E0] shadow-sm space-y-4">
            <div className="relative">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder={t('type_problem')}
                className="w-full h-40 p-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none transition-all resize-none"
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <label className={cn(
                  "p-3 rounded-xl cursor-pointer transition-all",
                  isCompressing ? "bg-[#4CAF50] text-white animate-pulse" : imagePreview ? "bg-[#4CAF50] text-white" : "bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#C8E6C9]"
                )}>
                  {isCompressing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
                
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#C8E6C9]"
                  )}
                  title={t('voice_record')}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>

            {imagePreview && (
              <div className="relative inline-block rounded-2xl overflow-hidden border border-[#E0E8E0] group">
                <img src={imagePreview} alt="Problem" className="h-32 w-auto object-cover" />
                <button 
                  onClick={() => { setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
                {error.includes('tab') && (
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                  >
                    <Globe size={16} />
                    {i18n.language === 'en' ? 'Open in New Tab' : 'নতুন ট্যাবে খুলুন'}
                  </button>
                )}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !problem.trim()}
              className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold hover:bg-[#43A047] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4CAF50]/20"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 size={24} />
                  </motion.div>
                  <span className="animate-pulse">{t('submitting')}</span>
                </div>
              ) : (
                <>
                  <Send size={20} />
                  <span>{t('ask_gemini')}</span>
                </>
              )}
            </motion.button>
          </form>

          <AnimatePresence>
            {solution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 border border-[#E0E8E0] shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[#4CAF50]">
                    <Bot size={28} />
                    <h2 className="text-2xl font-bold">{t('solution')}</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => isPlaying ? stopSpeaking() : speak(solution)}
                    className={cn(
                      "p-3 rounded-xl transition-all flex items-center gap-2 font-bold",
                      isPlaying 
                        ? "bg-red-50 text-red-600 hover:bg-red-100" 
                        : "bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#C8E6C9]"
                    )}
                    title={isPlaying ? "Stop" : "Listen"}
                  >
                    {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    <span className="text-sm">{isPlaying ? "Stop" : "Listen"}</span>
                  </motion.button>
                </div>
                <div className="prose prose-green max-w-none text-[#2D3A2D]">
                  <ReactMarkdown>{solution}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E0E8E0] shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History size={20} className="text-[#4CAF50]" />
              Recent History
            </h3>
            <div className="space-y-4">
              {logs.length > 0 ? logs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => {
                    setProblem(log.problem);
                    setSolution(log.solution);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#F9FBF9] border border-transparent hover:border-[#E0E8E0] transition-all group"
                >
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-[#4CAF50]">{log.problem}</p>
                  <p className="text-xs text-[#8BA88B] mt-1">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : (log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Recent')}
                  </p>
                </button>
              )) : (
                <p className="text-sm text-[#8BA88B] text-center py-4">No recent history</p>
              )}
            </div>
          </div>

          <a href="tel:09638201586" className="block group">
            <div className="bg-organic-dark rounded-3xl p-6 text-white space-y-4 shadow-xl border border-white/5 group-hover:bg-organic-green transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-organic-green group-hover:text-white">ABS FEED Hotline</span>
                <Phone size={16} className="text-organic-green group-hover:text-white group-hover:rotate-12 transition-all" />
              </div>
              <p className="text-2xl font-black tracking-tighter">09638-201586</p>
              <div className="h-[1px] w-full bg-white/10" />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Call for direct expert support</p>
            </div>
          </a>

          <div className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-3xl p-6 text-white space-y-4">
            <h3 className="font-bold">Pro Tip</h3>
            <p className="text-sm text-green-50/90">
              Be specific! Mention the age of the animal, symptoms, and how long they've been occurring for better advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

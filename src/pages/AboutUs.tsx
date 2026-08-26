import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Sparkles, Sprout, CheckCircle2, Stethoscope, ArrowLeft, MapPin, Globe, Phone, Mail, Building, Play, Pause, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function AboutUs() {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);

  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  // Static audio source from public/krishi_bondhu.mp3
  const AUDIO_URL = "/krishi_bondhu.mp3"; 

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(error => {
              console.error("Audio play failed:", error?.message || error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = clickPosition * audioRef.current.duration;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        const currentProgress = (audio.currentTime / audio.duration) * 100;
        setProgress(currentProgress);
        setCurrentTime(formatTime(audio.currentTime));
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration) {
        setDuration(formatTime(audio.duration));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime('0:00');
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <Link 
        to="/"
        className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-dark-surface rounded-full border border-organic-green/10 text-organic-dark dark:text-gray-100 font-black text-xs uppercase tracking-widest hover:bg-organic-green hover:text-white transition-all shadow-sm"
      >
        <ArrowLeft size={16} />
        {t('back_to_home')}
      </Link>

      <div className="relative overflow-hidden bg-organic-dark rounded-[4.5rem] p-10 sm:p-24 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef" alt="" className="w-full h-full object-cover" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-12">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 text-organic-green text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} />
            {t('about_us')}
          </div>
          
          <div className="space-y-8">
            <h1 className="text-[10vw] sm:text-[7rem] font-black tracking-tight leading-[1] break-words uppercase px-2">
              {i18n.language === 'en' ? 'KRISHI' : 'কৃষি'} <span className="text-organic-green">{i18n.language === 'en' ? 'BONDHU' : 'বন্ধু'}</span>
            </h1>
            
            {/* Audio Player Section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center pt-4"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-5 flex items-center gap-4 w-full max-w-[380px] shadow-2xl relative">
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 bg-[#4CAF50] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-900/30 hover:scale-105 active:scale-95 transition-all shrink-0 z-10"
                  title={isPlaying ? "Pause Audio" : "Play Audio"}
                >
                  {isPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} className="translate-x-0.5" fill="currentColor" />
                  )}
                </button>
                
                <div className="flex flex-col gap-2 flex-grow min-w-0">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white">
                    <span className="truncate">
                      {i18n.language === 'en' ? 'Krishi Bondhu Audio' : 'কৃষি বন্ধু থিম অডিও'}
                    </span>
                    {isPlaying && (
                      <span className="flex gap-1 items-center">
                        {[0, 1, 2, 3].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ height: [4, 14, 4] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.15 }}
                            className="w-1 bg-[#4CAF50] rounded-full"
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div 
                      onClick={handleSeek}
                      className="h-2.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer group"
                    >
                      <motion.div 
                        className="h-full bg-[#4CAF50] relative" 
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear", duration: 0.1 }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-white/70 uppercase tracking-widest mt-0.5">
                      <span>{currentTime} / {duration}</span>
                      <div className="flex items-center gap-1">
                        <Volume2 size={11} className={isPlaying ? "text-[#4CAF50]" : "text-white/40"} />
                        <span>{isPlaying ? (i18n.language === 'en' ? 'Playing' : 'চলছে') : (i18n.language === 'en' ? 'Play' : 'শুনুন')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <audio 
                  ref={audioRef} 
                  src={AUDIO_URL} 
                  preload="auto" 
                  onError={() => {
                    console.warn("Audio resource error, falling back to encoded path");
                    if (audioRef.current && audioRef.current.src.endsWith('/krishi_bondhu.mp3')) {
                      audioRef.current.src = "/Krishi%20bondhu.mp3";
                    } else {
                      setAudioError(true);
                      setIsPlaying(false);
                    }
                  }}
                />
              </div>
              {audioError && (
                <p className="text-[10px] text-red-300 font-bold mt-2 uppercase tracking-widest text-center">
                  {i18n.language === 'en' ? 'Audio file not found' : 'অডিও ফাইলটি পাওয়া যায়নি'}
                </p>
              )}
            </motion.div>

            <p className="text-base sm:text-xl text-green-50/90 leading-relaxed font-medium italic pt-6 px-2">
              {t('krishi_bondhu_detailed_desc')}
            </p>
          </div>

          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative"
          >
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-organic-green/20 rounded-full blur-3xl absolute -inset-4 animate-pulse" />
            <motion.div
              animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-48 h-48 sm:w-64 sm:h-64 shadow-2xl shadow-organic-green/30"
            >
              <img src="/krishi_logo.png" className="w-full h-full object-contain" alt="Krishi Bondhu Logo" />
            </motion.div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/20 blur-xl rounded-[100%]" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 w-full">
            <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left">
              <div className="w-12 h-12 bg-organic-green/20 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-organic-green" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-wider text-organic-green">Support</p>
                <p className="text-sm text-green-50/70">{i18n.language === 'en' ? 'Low-interest micro-loans for dedicated farmers.' : 'নিবেদিতপ্রাণ কৃষকদের জন্য স্বল্প সুদে ক্ষুদ্রঋণ সুবিধা।'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left">
              <div className="w-12 h-12 bg-organic-green/20 rounded-2xl flex items-center justify-center shrink-0">
                <Stethoscope size={24} className="text-organic-green" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-wider text-organic-green">Guidance</p>
                <p className="text-sm text-green-50/70">{i18n.language === 'en' ? 'Expert disease diagnosis & treatment recommendations.' : 'বিশেষজ্ঞ দ্বারা রোগ নির্ণয় ও চিকিৎসার পরামর্শ।'}</p>
              </div>
            </div>
          </div>

          <div className="w-full pt-16 border-t border-white/10 mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 text-organic-green">
                <MapPin size={24} />
                <p className="font-black uppercase tracking-widest text-xs">Head Office</p>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <p className="font-bold text-lg text-white">ABS FEED INDUSTRIES LIMITED</p>
                <p className="font-medium text-green-50/70 leading-relaxed">
                  House No. 12 (4th floor)<br/>
                  Road No. 25, Sector-07<br/>
                  Uttara, Dhaka-1230, Bangladesh
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 text-organic-green">
                <Building size={24} />
                <p className="font-black uppercase tracking-widest text-xs">Regional Office</p>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <p className="font-bold text-lg text-white">Khulna Division</p>
                <p className="font-medium text-green-50/70 leading-relaxed">
                  Ahyan City, Bejerdanga<br/>
                  Fultola, Khulna-9210<br/>
                  Bangladesh
                </p>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-white/5">
              <div className="flex flex-col items-center gap-2">
                <Mail size={20} className="text-organic-green" />
                <p className="font-bold opacity-40 uppercase tracking-widest text-[9px]">Email Us</p>
                <a href="mailto:absfeed.info@gmail.com" className="font-medium text-green-50/80 hover:text-white transition-colors">absfeed.info@gmail.com</a>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Globe size={20} className="text-organic-green" />
                <p className="font-bold opacity-40 uppercase tracking-widest text-[9px]">Website</p>
                <a href="https://www.absfeed.com" target="_blank" rel="noopener noreferrer" className="font-medium text-green-50/80 hover:text-white transition-colors">www.absfeed.com</a>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Phone size={20} className="text-organic-green" />
                <p className="font-bold opacity-40 uppercase tracking-widest text-[9px]">Hotline</p>
                <a href="tel:+8809638201586" className="font-medium text-green-50/80 hover:text-white transition-colors underline decoration-organic-green/30 decoration-1 underline-offset-4">09638-201586</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

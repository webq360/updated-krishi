import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Sprout, Droplets, Thermometer, Info, ChevronRight, X, Sparkles, Brain, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../firebase';

export default function CropCalendar() {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const DEFAULT_CROPS = [
    {
      id: 'rice-boro',
      name: i18n.language === 'en' ? 'Boro Rice' : 'বোরো ধান',
      season: i18n.language === 'en' ? 'Winter' : 'শীতকাল (রবি)',
      stage: i18n.language === 'en' ? 'Harvesting' : 'ফসল সংগ্রহ',
      color: 'bg-amber-500',
      tasks: [
        i18n.language === 'en' ? 'Prepare threshing floor' : 'মাড়াই তলা প্রস্তুত করুন',
        i18n.language === 'en' ? 'Dry grain to 12% moisture' : 'ধান ১২% আর্দ্রতায় শুকান',
        i18n.language === 'en' ? 'Store in airtight containers' : 'বায়ুরোধী পাত্রে সংরক্ষণ করুন'
      ],
      guide: {
        en: 'Boro rice requires intensive irrigation. Keep water level at 2-5cm during grain filling.',
        bn: 'বোরো ধানের জন্য নিবিড় সেচ প্রয়োজন। দানাদার হওয়ার সময় ২-৫ সেমি পানি ধরে রাখুন।'
      }
    },
    {
      id: 'jute-deshi',
      name: i18n.language === 'en' ? 'Jute (Desi)' : 'দেশী পাট',
      season: i18n.language === 'en' ? 'Summer' : 'গ্রীষ্মকাল (খরিফ-১)',
      stage: i18n.language === 'en' ? 'Sowing' : 'বীজ বপন',
      color: 'bg-green-600',
      tasks: [
        i18n.language === 'en' ? 'Final land preparation' : 'জমি চূড়ান্ত প্রস্তুতি',
        i18n.language === 'en' ? 'Seed treatment with Vitavex' : 'ভিটাভেক্স দিয়ে বীজ শোধন',
        i18n.language === 'en' ? 'Maintain row spacing 25cm' : 'সারি থেকে সারির দূরত্ব ২৫ সেমি রাখুন'
      ],
      guide: {
        en: 'Sow Jute when soil has enough moisture. Early sowing promotes higher fiber quality.',
        bn: 'মাটিতে পর্যাপ্ত জো বা রস থাকলে পাটের বীজ বুনুন। আগাম বপন আশের মান উন্নত করে।'
      }
    },
    {
      id: 'mango-fazli',
      name: i18n.language === 'en' ? 'Mango (Fazli)' : 'আম (ফজলি)',
      season: i18n.language === 'en' ? 'Monsoon' : 'বর্ষাকাল',
      stage: i18n.language === 'en' ? 'Fruit Care' : 'ফলের যত্ন',
      color: 'bg-orange-500',
      tasks: [
        i18n.language === 'en' ? 'Fruit bagging' : 'ফ্রুট ব্যাগিং করুন',
        i18n.language === 'en' ? 'Monitor for fruit fly' : 'ফল ছিদ্রকারী মাছি পোকা দমন',
        i18n.language === 'en' ? 'Apply organic mulch' : 'জৈব মালচিং প্রয়োগ করুন'
      ],
      guide: {
        en: 'Protect fruits from extreme heat. Bagging prevents pest attacks and improves color.',
        bn: 'ফলকে অতিরিক্ত তাপ থেকে রক্ষা করুন। ব্যাগিং করলে পোকার আক্রমণ কমে এবং রঙ সুন্দর হয়।'
      }
    },
    {
       id: 'tea-clones',
       name: i18n.language === 'en' ? 'Tea (Clonal)' : 'চা (ক্লোন)',
       season: i18n.language === 'en' ? 'Year-round' : 'সারা বছর',
       stage: i18n.language === 'en' ? 'Plucking' : 'পাতা সংগ্রহ',
       color: 'bg-emerald-700',
       tasks: [
         i18n.language === 'en' ? 'Fine plucking (two leaves & bud)' : 'দুটি পাতা একটি কুঁড়ি সংগ্রহ',
         i18n.language === 'en' ? 'Pruning during dormant period' : 'সুপ্ত অবস্থায় ছাঁটাইকরণ',
         i18n.language === 'en' ? 'Apply Nitrogen fertilizers' : 'ইউরিয়া সার প্রয়োগ'
       ],
       guide: {
         en: 'Maintain shade trees for optimal growth. Quality depends on timing of plucking.',
         bn: 'ভালো বৃদ্ধির জন্য ছায়া বৃক্ষ নিশ্চিত করুন। চায়ের মান সংগ্রহের সময়ের ওপর নির্ভর করে।'
       }
    }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMonthRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cropCalendar'), (snapshot) => {
      const dbCrops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCrops(dbCrops.length > 0 ? dbCrops : DEFAULT_CROPS);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'cropCalendar');
      setCrops(DEFAULT_CROPS);
      setLoading(false);
    });

    return () => unsub();
  }, [i18n.language]);

  // Handle scrolling to active month
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeMonthRef.current) {
        activeMonthRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedMonth, loading]);

  const months = i18n.language === 'en' 
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

  const bnMonths = [
    'পৌষ - মাঘ', 'মাঘ - ফাল্গুন', 'ফাল্গুন - চৈত্র', 'চৈত্র - বৈশাখ', 
    'বৈশাখ - জ্যৈষ্ঠ', 'জ্যৈষ্ঠ - আষাঢ়', 'আষাঢ় - শ্রাবণ', 'শ্রাবণ - ভাদ্র', 
    'ভাদ্র - আশ্বিন', 'আশ্বিন - কার্তিক', 'কার্তিক - অগ্রহায়ণ', 'অগ্রহায়ণ - পৌষ'
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4CAF50]" size={40} />
      </div>
    );
  }

  const isBn = i18n.language === 'bn';

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1530507629858-e4977d30e9e0" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <CalendarIcon size={18} />
              {t('crop_calendar')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'SMART' : 'স্মার্ট'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words">{i18n.language === 'en' ? 'CALENDAR' : 'ক্যালেন্ডার'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6">
              {isBn 
                ? 'সর্বোচ্চ ফলনের জন্য ঋতু এবং ফসলের চক্র অনুযায়ী আপনার চাষাবাদের পরিকল্পনা করুন।'
                : 'Plan your farming activities according to the season and crop cycle for maximum yield.'}
            </p>
          </div>
        </div>
        <Sprout className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div 
        ref={scrollRef}
        className="flex flex-nowrap overflow-x-auto pb-4 gap-2 no-scrollbar snap-x snap-mandatory touch-pan-x scroll-smooth w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {months.map((month, index) => (
          <button
            key={month}
            ref={selectedMonth === index ? activeMonthRef : null}
            onClick={() => setSelectedMonth(index)}
            className={cn(
              "px-6 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border flex flex-col items-center min-w-[140px] shrink-0 snap-center",
              selectedMonth === index 
                ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-lg shadow-green-900/20" 
                : "bg-white dark:bg-dark-surface text-[#556B55] dark:text-gray-400 border-[#E0E8E0] dark:border-dark-border hover:border-[#4CAF50]"
            )}
          >
            <span className="text-base">{month}</span>
            <span className={cn(
              "text-[10px] font-bold mt-1 transition-colors",
              selectedMonth === index ? "text-white/70" : "text-organic-green/40 dark:text-gray-500"
            )}>
              {bnMonths[index]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map((crop) => (
          <motion.div
            key={crop.id}
            layoutId={`crop-${crop.id}`}
            onClick={() => setSelectedCrop(crop)}
            className="bg-white dark:bg-dark-surface rounded-[2rem] border border-[#E0E8E0] dark:border-dark-border overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className={cn("h-32 p-6 flex items-start justify-between", crop.color || 'bg-green-500')}>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                <Sprout className="text-white" size={24} />
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                {crop.season}
              </div>
            </div>
            <div className="p-6 -mt-8 bg-white dark:bg-dark-surface rounded-t-[2rem] relative">
              <h3 className="text-xl font-bold text-[#1B301B] dark:text-gray-100 mb-1">{crop.name}</h3>
              <div className="flex items-center gap-2 text-[#4CAF50] text-sm font-bold mb-4">
                <Activity size={14} />
                {crop.stage}
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest">{i18n.language === 'en' ? 'Key Tasks' : 'প্রধান কাজসমূহ'}</p>
                {crop.tasks.slice(0, 3).map((task: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[#556B55] dark:text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
                    {task}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-[#F0F5F0] dark:border-dark-border flex items-center justify-between">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCrop(crop);
                  }}
                  className="text-xs font-bold text-[#4CAF50] group-hover:translate-x-1 transition-transform flex items-center gap-1 cursor-pointer"
                >
                  {i18n.language === 'en' ? 'View Guide' : 'নির্দেশিকা দেখুন'}
                  <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCrop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCrop(null)}
              className="absolute inset-0 bg-[#1B301B]/90 dark:bg-black/95 backdrop-blur-md"
            />
            <motion.div
              layoutId={`crop-${selectedCrop.id}`}
              className="relative w-full max-w-2xl bg-white dark:bg-dark-surface rounded-[2.5rem] overflow-hidden shadow-2xl my-auto"
            >
              <div className={cn("h-40 sm:h-48 p-8 flex items-start justify-between", selectedCrop.color || 'bg-green-500')}>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedCrop.name}</h2>
                  <p className="text-white/80 font-bold text-sm sm:text-base">{selectedCrop.season}</p>
                </div>
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 sm:p-10 -mt-8 bg-white dark:bg-dark-surface rounded-t-[2.5rem] space-y-8">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-[#F0F5F0] dark:bg-dark-bg p-3 sm:p-4 rounded-2xl text-center">
                    <Droplets className="mx-auto mb-2 text-[#4CAF50]" size={20} />
                    <p className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase">{i18n.language === 'en' ? 'Water' : 'সেচ'}</p>
                    <p className="text-xs sm:text-sm font-bold text-[#1B301B] dark:text-gray-100">Moderate</p>
                  </div>
                  <div className="bg-[#F0F5F0] dark:bg-dark-bg p-3 sm:p-4 rounded-2xl text-center">
                    <Thermometer className="mx-auto mb-2 text-[#4CAF50]" size={20} />
                    <p className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase">{i18n.language === 'en' ? 'Temp' : 'তাপমাত্রা'}</p>
                    <p className="text-xs sm:text-sm font-bold text-[#1B301B] dark:text-gray-100">20-30°C</p>
                  </div>
                  <div className="bg-[#F0F5F0] dark:bg-dark-bg p-3 sm:p-4 rounded-2xl text-center">
                    <Sparkles className="mx-auto mb-2 text-[#4CAF50]" size={20} />
                    <p className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase">{i18n.language === 'en' ? 'Yield' : 'ফলন'}</p>
                    <p className="text-xs sm:text-sm font-bold text-[#1B301B] dark:text-gray-100">High</p>
                  </div>
                </div>

                {selectedCrop.guide && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#1B301B] dark:text-gray-100 font-bold">
                      <Brain className="text-[#4CAF50]" size={20} />
                      {i18n.language === 'en' ? 'Expert Guide' : 'বিশেষজ্ঞ নির্দেশিকা'}
                    </div>
                    <p className="text-[#556B55] dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                      {i18n.language === 'en' ? (selectedCrop.guide?.en || 'No English guide available') : (selectedCrop.guide?.bn || 'নির্দেশিকা পাওয়া যায়নি')}
                    </p>
                  </div>
                )}

                {selectedCrop.tasks && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#1B301B] dark:text-gray-100 font-bold">
                      <Info className="text-[#4CAF50]" size={20} />
                      {i18n.language === 'en' ? 'Current Stage Tasks' : 'বর্তমান পর্যায়ের কাজসমূহ'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCrop.tasks.map((task: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#F9FBF9] dark:bg-dark-bg/50 rounded-xl border border-[#E0E8E0] dark:border-dark-border">
                          <div className="w-5 h-5 rounded-full bg-[#4CAF50] flex items-center justify-center text-white">
                            <CheckCircle2 size={12} />
                          </div>
                          <span className="text-sm text-[#556B55] dark:text-gray-300">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedCrop(null)}
                  className="w-full py-4 bg-[#1B301B] text-white font-bold rounded-2xl hover:bg-[#2E4A2E] transition-all shadow-xl shadow-green-900/20"
                >
                  {i18n.language === 'en' ? 'Close Guide' : 'বন্ধ করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Activity({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

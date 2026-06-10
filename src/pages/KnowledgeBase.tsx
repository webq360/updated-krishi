import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Download, Search, ChevronRight, 
  CornerDownRight, Lightbulb, ShieldCheck, 
  Sprout, Bug, Zap, Save, CheckCircle2, Clock
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { safeLocalStorage } from '../lib/storage';

interface Article {
  id: string;
  title: string;
  title_en?: string;
  title_bn?: string;
  category: string;
  content: string;
  content_en?: string;
  content_bn?: string;
  iconName: string;
  order: number;
}

const CAT_COLORS: { [key: string]: string } = {
  'Agriculture': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  'Pest Control': 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
  'Livestock': 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  'Fisheries': 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
};

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const q = query(collection(db, 'knowledgeBase'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
      setArticles(data);
    });

    let saved = safeLocalStorage.getItem('saved_articles');
    if (saved) setSavedIds(JSON.parse(saved));

    return () => unsub();
  }, []);

  const toggleSave = (id: string) => {
    const newSaved = savedIds.includes(id) 
      ? savedIds.filter(i => i !== id) 
      : [...savedIds, id];
    setSavedIds(newSaved);
    safeLocalStorage.setItem('saved_articles', JSON.stringify(newSaved));
  };

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];

  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';

  const filtered = articles.filter(a => {
    const title = isBn ? (a.title_bn || a.title) : (a.title_en || a.title);
    const content = isBn ? (a.content_bn || a.content) : (a.content_en || a.content);
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                         content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || a.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-12 pb-32">
      {/* Header Banner */}
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <BookOpen size={18} />
              {t('knowledge_base')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center">
              {i18n.language === 'en' ? 'FARM' : 'কৃষি'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">{i18n.language === 'en' ? 'KNOWLEDGE' : 'জ্ঞানভাণ্ডার'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {i18n.language === 'en' 
                ? 'Your comprehensive guide to modern farming, livestock management, and sustainable agriculture.' 
                : 'আধুনিক চাষাবাদ, গবাদিপশু পালন এবং টেকসই কৃষির জন্য আপনার ব্যাপক গাইড।'}
            </p>
          </div>
        </div>
        <BookOpen className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-organic-green transition-colors" size={20} />
              <input 
                type="text"
                placeholder={isBn ? 'চাষ পদ্ধতি, কীটপতঙ্গ সমাধান খুঁজুন...' : 'Search farming guides, pest solutions...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="organic-input pl-14 h-16 shadow-lg shadow-gray-100 dark:shadow-none"
              />
           </div>
           <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-4 rounded-full text-xs font-black uppercase whitespace-nowrap transition-all ${
                    activeCategory === cat 
                      ? 'bg-organic-dark text-white' 
                      : 'bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border text-gray-500 hover:border-organic-green'
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <AnimatePresence mode="popLayout">
            {filtered.map((article) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="organic-card p-8 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <BookOpen size={120} />
                </div>
                <div className="space-y-6 relative h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${CAT_COLORS[article.category] || 'bg-gray-100 text-gray-500'}`}>
                      {article.category}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSave(article.id); }}
                      className={`p-2 rounded-full transition-all ${
                        savedIds.includes(article.id) ? 'bg-organic-green text-white' : 'bg-gray-50 dark:bg-dark-bg text-gray-400 hover:text-organic-green'
                      }`}
                    >
                      {savedIds.includes(article.id) ? <CheckCircle2 size={18} /> : <Download size={18} />}
                    </button>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <h3 className="text-2xl font-black text-organic-dark dark:text-gray-100 leading-tight group-hover:text-organic-green transition-colors">
                      {isBn ? (article.title_bn || article.title) : (article.title_en || article.title)}
                    </h3>
                    <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed">
                      {(isBn ? (article.content_bn || article.content) : (article.content_en || article.content)).substring(0, 120)}...
                    </p>
                  </div>

                  <div className="pt-4 flex items-center gap-2 text-organic-green font-black text-xs uppercase tracking-widest">
                    আরও পড়ুন (Full Guide) <ChevronRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
           <div className="text-center py-40 organic-card">
              <Zap className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-xl font-bold text-gray-400">No guides matching your search.</p>
           </div>
        )}
      </div>

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 lg:p-20 overflow-hidden">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedArticle(null)}
               className="absolute inset-0 bg-organic-dark/80 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 30, stiffness: 300 }}
               className="relative w-full h-full bg-white dark:bg-dark-bg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
             >
                <div className="p-8 border-b border-gray-100 dark:border-dark-border flex items-center justify-between sticky top-0 bg-white dark:bg-dark-bg z-10">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${CAT_COLORS[selectedArticle.category]}`}>
                         <BookOpen size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{selectedArticle.category}</p>
                         <h2 className="text-xl font-bold dark:text-gray-100">
                           {isBn ? (selectedArticle.title_bn || selectedArticle.title) : (selectedArticle.title_en || selectedArticle.title)}
                         </h2>
                      </div>
                   </div>
                   <button 
                     onClick={() => setSelectedArticle(null)}
                     className="w-12 h-12 rounded-full bg-gray-50 dark:bg-dark-surface flex items-center justify-center text-gray-500 hover:rotate-90 transition-transform"
                   >
                      <ChevronRight size={24} className="rotate-90" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                   <div className="max-w-3xl mx-auto space-y-8">
                      <div className="flex items-center gap-6 p-6 bg-organic-light dark:bg-dark-surface rounded-[32px]">
                         <Lightbulb className="text-organic-green shrink-0" size={32} />
                         <p className="text-sm font-bold text-organic-dark dark:text-gray-200">
                           এটি বিশেষজ্ঞ দ্বারা ভেরিফাইড গাইড। আপনি এটি অফলাইনে পড়ার জন্য সেভ করে রাখতে পারেন।
                         </p>
                      </div>

                      <div className="prose dark:prose-invert prose-emerald max-w-none">
                         <div className="whitespace-pre-wrap leading-relaxed text-lg text-gray-700 dark:text-gray-300">
                            {isBn ? (selectedArticle.content_bn || selectedArticle.content) : (selectedArticle.content_en || selectedArticle.content)}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-12">
                         <GuideStep icon={<Sprout className="text-emerald-500" />} text="প্রয়োজনীয় উপকরণ সংগ্রহ করুন" />
                         <GuideStep icon={<ShieldCheck className="text-blue-500" />} text="নিরাপত্তা নিশ্চিত করুন" />
                         <GuideStep icon={<Bug className="text-rose-500" />} text="পোকামাকড় থেকে ফসল রক্ষা" />
                         <GuideStep icon={<Clock className="text-amber-500" />} text="সঠিক সময়ে প্রয়োগ করুন" />
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-gray-50 dark:bg-dark-surface flex items-center justify-center gap-4">
                   <button 
                      onClick={() => toggleSave(selectedArticle.id)}
                      className={`flex-1 max-w-xs organic-btn flex items-center justify-center gap-3 ${
                        savedIds.includes(selectedArticle.id) ? 'bg-organic-dark dark:bg-organic-green text-white dark:text-organic-dark shadow-none' : 'bg-organic-green text-white shadow-lg shadow-organic-green/30'
                      }`}
                   >
                      {savedIds.includes(selectedArticle.id) ? (
                        <>
                          <CheckCircle2 size={20} />
                          {isBn ? 'অফলাইনে সংরক্ষিত' : 'Saved to Offline'}
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          {isBn ? 'গাইড ডাউনলোড করুন' : 'Download Guide'}
                        </>
                      )}
                   </button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideStep({ icon, text }: any) {
  return (
    <div className="organic-card p-6 flex items-center gap-4 bg-white/50">
       <div className="p-3 bg-white dark:bg-dark-bg rounded-xl shadow-sm">
          {icon}
       </div>
       <span className="text-sm font-black text-organic-dark dark:text-gray-100">{text}</span>
    </div>
  );
}

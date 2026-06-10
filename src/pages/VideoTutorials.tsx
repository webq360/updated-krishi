import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Search, Filter, X, MoreVertical, CheckCircle2, User, Loader2, ThumbsUp, Share2, Youtube, Clock, Eye, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../firebase';

interface Video {
  id: string;
  title: string;
  titleBn: string;
  thumbnail: string;
  duration: string;
  views: string;
  category: string;
  categoryBn: string;
  url: string;
  channel: string;
  publishedAt: string;
  publishedAtBn: string;
}

export default function VideoTutorials() {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Video[]);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'videos');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const categories = [
    { en: 'All', bn: 'সব' },
    { en: 'Crops', bn: 'ফসল' },
    { en: 'Poultry', bn: 'হাঁস-মুরগি' },
    { en: 'Fisheries', bn: 'মৎস্য' },
    { en: 'Vegetables', bn: 'শাকসবজি' }
  ];

  const filteredVideos = videos.filter(v => {
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory || v.categoryBn === selectedCategory;
    const matchesSearch = (v.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (v.titleBn || '').includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1492138458051-294b0d367464?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-red-600 shadow-3xl mb-4 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            <Play size={44} fill="currentColor" className="ml-1 relative z-10" />
          </motion.div>
          
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-red-900/20 rounded-full border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {i18n.language === 'en' ? 'KRISHI TUBE' : 'কৃষি টিউব'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center">
              {i18n.language === 'en' ? 'LEARN' : 'শিখুন'} <br />
              <span className="text-red-500 uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">{i18n.language === 'en' ? 'MODERN FARMING' : 'আধুনিক কৃষি'}</span>
            </h1>
            <p className="text-red-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {i18n.language === 'en' 
                ? 'Expert-led video lessons to help you grow more and earn more.' 
                : 'বিশেষজ্ঞদের ভিডিও টিউটোরিয়াল যা আপনাকে আরও ফসল ফলাতে এবং লাভবান হতে সাহায্য করবে।'}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-organic-dark to-transparent pointer-events-none" />
      </header>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-[2.5rem] border border-[#E0E8E0] dark:border-white/10 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
          <input
            type="text"
            placeholder={i18n.language === 'en' ? "Search lessons..." : "पाठ্য বিষয় খুঁজুন..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-[2rem] focus:border-[#FF0000] outline-none shadow-sm transition-all placeholder:text-[#8BA88B]/50"
          />
        </div>
        <button className="w-full sm:w-auto px-8 py-5 bg-white dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-[2rem] text-[#1B301B] dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-[#FF0000] hover:border-[#FF0000] transition-all shadow-sm flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest">
          <Filter size={20} />
          {t('filter')}
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 pt-2">
        {categories.map((cat) => (
          <button
            key={cat.en}
            onClick={() => setSelectedCategory(cat.en)}
            className={cn(
              "px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border",
              selectedCategory === cat.en
                ? "bg-[#1B301B] text-white border-[#1B301B] shadow-xl shadow-black/10"
                : "bg-white text-[#556B55] border-[#E0E8E0] hover:border-[#FF0000] hover:text-[#FF0000]"
            )}
          >
            {i18n.language === 'en' ? cat.en : cat.bn}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#4CAF50] animate-spin mb-4" />
          <p className="text-[#8BA88B] font-bold uppercase tracking-widest">{i18n.language === 'en' ? 'Loading Tutorials...' : 'লোড হচ্ছে...'}</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-surface rounded-[2.5rem] border border-[#E0E8E0] dark:border-white/10">
          <Play size={48} className="mx-auto text-[#8BA88B] mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-[#1B301B] dark:text-white">{i18n.language === 'en' ? 'No videos found' : 'কোন ভিডিও পাওয়া যায়নি'}</h3>
          <p className="text-[#8BA88B]">{i18n.language === 'en' ? 'Try adjusting your filters or search.' : 'অনুগ্রহ করে ফিল্টার পরিবর্তন করে দেখুন।'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {filteredVideos.map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setActiveVideo(video)}
              className="group cursor-pointer space-y-4"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-dark-bg ring-1 ring-black/5 group-hover:ring-[#FF0000]/50 transition-all duration-300">
                <img 
                  src={video.thumbnail || `https://img.youtube.com/vi/${getEmbedUrl(video.url).split('/').pop()}/maxresdefault.jpg`} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536633396567-6dc4a5b67a6e?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                
                <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black rounded-lg">
                  {video.duration || '00:00'}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-16 h-16 bg-[#FF0000] text-white rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform">
                     <Play size={24} fill="currentColor" />
                   </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex gap-4 px-2">
                <div className="w-10 h-10 rounded-full bg-[#F0F5F0] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 flex items-center justify-center text-[#4CAF50] shrink-0 overflow-hidden shadow-sm">
                  {video.channel?.includes('Krishi') ? <Play size={16} fill="currentColor" className="text-red-600" /> : <User size={20} />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-black text-[#1B301B] dark:text-gray-100 leading-tight line-clamp-2 group-hover:text-[#FF0000] transition-colors">
                      {i18n.language === 'en' ? video.title : video.titleBn}
                    </h3>
                    <MoreVertical size={16} className="text-[#8BA88B] shrink-0" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-[#556B55] dark:text-[#8BA88B] flex items-center gap-1">
                      {video.channel || 'KGF Tutorial'}
                      <CheckCircle2 size={10} className="text-[#8BA88B]" />
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-[#8BA88B]">
                      <span>{video.views || '0'} {i18n.language === 'en' ? 'views' : 'ভিউ'}</span>
                      <span className="w-0.5 h-0.5 bg-[#8BA88B] rounded-full" />
                      <span>{i18n.language === 'en' ? (video.publishedAt || 'Recently') : (video.publishedAtBn || 'সম্প্রতি')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-12 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideo(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setActiveVideo(null)}
                className="absolute top-6 right-6 z-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
              >
                <X size={24} />
              </button>

              <iframe
                src={getEmbedUrl(activeVideo.url)}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Tutorial Video"
              />
            </motion.div>


            {/* Video Meta in Modal */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 py-6 bg-white/5 backdrop-blur-md border border-white/5 rounded-[2rem] hidden lg:block"
            >
              <div className="flex items-center justify-between gap-12">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-white truncate">
                    {i18n.language === 'en' ? activeVideo.title : activeVideo.titleBn}
                  </h2>
                  <div className="flex items-center gap-4 text-white/40 text-xs font-bold mt-1 uppercase tracking-widest">
                    <span>{activeVideo.channel}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>{activeVideo.views} views</span>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2 font-bold transition-all">
                     <ThumbsUp size={18} /> Like
                   </button>
                   <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2 font-bold transition-all">
                     <Share2 size={18} /> Share
                   </button>
                   <button className="px-6 py-3 bg-[#FF0000] text-white rounded-xl flex items-center gap-2 font-black uppercase tracking-widest shadow-xl shadow-red-500/20">
                     Subscribe
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


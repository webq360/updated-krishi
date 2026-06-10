import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Plus, Filter, Tag, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../firebase';

interface Species {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  description: string;
  imageUrl?: string;
}

const SUB_CATEGORIES: Record<string, string[]> = {
  livestock: ['Cattle', 'Goat', 'Buffalo', 'Sheep'],
  poultry: ['Broiler', 'Layer', 'Sonali', 'Duck', 'Turkey'],
  fisheries: ['Carp', 'Catfish', 'Tilapia', 'Shrimp'],
  vegetables: ['Rice', 'Wheat', 'Maize', 'Jute', 'Red Spinach', 'Eggplant', 'Pointed Gourd', 'Okra', 'Bean']
};

const SUB_CATEGORIES_BN: Record<string, string[]> = {
  livestock: ['গরু', 'ছাগল', 'মহিষ', 'ভেড়া'],
  poultry: ['ব্রয়লার', 'লেয়ার', 'সোনালী', 'হাঁস', 'টার্কি'],
  fisheries: ['কার্প', 'ক্যাটফিশ', 'তেলাপিয়া', 'চিংড়ি'],
  vegetables: ['ধান', 'গম', 'ভুট্টা', 'পাট', 'লাল শাক', 'বেগুন', 'পটল', 'ঢেঁড়স', 'সীম']
};

export default function SpeciesList({ category }: { category: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubCategory, setActiveSubCategory] = useState<string>('All');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'species'), where('category', '==', category));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Species[];
      if (data.length > 0) {
        setSpecies(data);
      } else {
        setSpecies(GET_DEFAULT_SPECIES(category));
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'species');
      setSpecies(GET_DEFAULT_SPECIES(category));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [category, i18n.language]);

  const GET_DEFAULT_SPECIES = (cat: string) => {
    const lang = i18n.language;
    if (cat === 'livestock') {
      return [
        {
          id: 'def-cow',
          name: lang === 'en' ? 'Holstein Friesian Cow' : 'হলস্টাইন ফ্রিজিয়ান গরু',
          category: 'livestock',
          subCategory: 'Cattle',
          description: lang === 'en' ? 'High milk-yielding dairy cattle variety.' : 'উচ্চ দুগ্ধ উৎপাদনকারী গাভীর উন্নত জাত।',
          imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=800'
        },
        {
          id: 'def-goat',
          name: lang === 'en' ? 'Black Bengal Goat' : 'ব্লাক বেঙ্গল ছাগল',
          category: 'livestock',
          subCategory: 'Goat',
          description: lang === 'en' ? 'Popular local breed known for high quality meat and skin.' : 'উচ্চমানের মাংস ও চামড়ার জন্য পরিচিত স্থানীয় জনপ্রিয় জাত।',
          imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=800'
        }
      ];
    }
    if (cat === 'poultry') {
      return [
        {
          id: 'def-broiler',
          name: lang === 'en' ? 'Broiler Chicken' : 'ব্রয়লার মুরগি',
          category: 'poultry',
          subCategory: 'Broiler',
          description: lang === 'en' ? 'Fast-growing meat chicken variety.' : 'দ্রুত বর্ধনশীল মাংস উৎপাদনকারী মুরগির জাত।',
          imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800'
        },
        {
          id: 'def-layer',
          name: lang === 'en' ? 'Layer Chicken (Egg-laying)' : 'লেয়ার মুরগি (ডিমপাড়া)',
          category: 'poultry',
          subCategory: 'Layer',
          description: lang === 'en' ? 'Specialized breed for commercial egg production, highly productive.' : 'বাণিজ্যিক ডিম উৎপাদনের জন্য বিশেষভাবে তৈরি অত্যন্ত উৎপাদনশীল মুরগির জাত।',
          imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800'
        }
      ];
    }
    if (cat === 'fisheries') {
      return [
        {
          id: 'def-carp',
          name: lang === 'en' ? 'Rohu Fish (Rui)' : 'রুই মাছ',
          category: 'fisheries',
          subCategory: 'Carp',
          description: lang === 'en' ? 'Most popular freshwater carp in Bangladesh.' : 'বাংলাদেশের সবচেয়ে জনপ্রিয় মিষ্টি পানির কার্প মাছ।',
          imageUrl: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=800'
        },
        {
          id: 'def-tilapia',
          name: lang === 'en' ? 'Monosex Tilapia' : 'মনোসেক্স তেলাপিয়া',
          category: 'fisheries',
          subCategory: 'Tilapia',
          description: lang === 'en' ? 'Highly productive and fast-growing fish variety.' : 'অধিক উৎপাদনশীল এবং দ্রুত বর্ধনশীল মাছের জাত।',
          imageUrl: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&q=80&w=800'
        }
      ];
    }
    if (cat === 'vegetables') {
      return [
        {
          id: 'def-tomato',
          name: lang === 'en' ? 'High-yield Tomato' : 'উচ্চফলনশীল টমেটো',
          category: 'vegetables',
          subCategory: 'Vegetables',
          description: lang === 'en' ? 'Excellent variety for both winter and hybrid culture.' : 'শীতকালীন ও হাইব্রিড চাষের জন্য চমৎকার জাত।',
          imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?auto=format&fit=crop&q=80&w=800'
        },
        {
          id: 'def-eggplant',
          name: lang === 'en' ? 'Eggplant (Tal-Begun)' : 'তাল বেগুন',
          category: 'vegetables',
          subCategory: 'Eggplant',
          description: lang === 'en' ? 'Popular traditional vegetable in Bangladesh.' : 'বাংলাদেশের ঐতিহ্যবাহী ও জনপ্রিয় সবজি।',
          imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=800'
        }
      ];
    }
    return [];
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
      } else {
        setIsAdmin(sessionStorage.getItem('isAdmin') === 'true');
      }
    };
    checkAdmin();
  }, []);

  const getSubCategories = () => {
    return i18n.language === 'en' ? SUB_CATEGORIES[category] || [] : SUB_CATEGORIES_BN[category] || [];
  };

  const getSubName = (sub: string, index: number) => {
    if (activeSubCategory === 'All') return 'All';
    return sub;
  };

  const filteredSpecies = activeSubCategory === 'All' 
    ? species 
    : species.filter(s => {
        const enSubs = SUB_CATEGORIES[category] || [];
        const bnSubs = SUB_CATEGORIES_BN[category] || [];
        const idx = bnSubs.indexOf(activeSubCategory);
        const target = idx !== -1 ? enSubs[idx] : activeSubCategory;
        return s.subCategory === target || s.subCategory === activeSubCategory;
      });

  return (
    <div className="space-y-12 pb-20">
      <header className="relative py-12 px-8 rounded-[3rem] bg-organic-dark text-white overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={`https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1200`} 
            alt="Header Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 text-center w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-[10px] font-black uppercase tracking-widest">
              <Tag size={12} />
              {t('category')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter capitalize drop-shadow-lg leading-[1.1]">
              {t(category)}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-3 rounded-[2rem] border border-white/10 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveSubCategory('All')}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest",
                activeSubCategory === 'All' 
                  ? "bg-organic-green text-white shadow-xl" 
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              )}
            >
              {i18n.language === 'en' ? 'All' : 'সব'}
            </button>
            {getSubCategories().map((sub, idx) => (
              <button
                key={sub}
                onClick={() => setActiveSubCategory(sub)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest",
                  activeSubCategory === sub 
                    ? "bg-organic-green text-white shadow-xl" 
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-white dark:bg-dark-surface rounded-[2.5rem] animate-pulse border border-organic-green/5 dark:border-white/5" />
          ))}
        </div>
      ) : filteredSpecies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredSpecies.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link 
                to={`/species/${item.id}`}
                className="organic-card group overflow-hidden block aspect-[4/5] relative"
              >
                <img 
                  src={item.imageUrl || `https://picsum.photos/seed/${item.name}/800/600`} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-organic-dark to-transparent opacity-60" />
                <div className="absolute inset-x-0 bottom-0 p-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-organic-green text-white text-[10px] font-black uppercase tracking-widest rounded-full">{item.subCategory || category}</span>
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{item.name}</h3>
                  <p className="text-white/60 text-xs line-clamp-2 leading-relaxed uppercase tracking-wide">{item.description}</p>
                  
                  <div className="pt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest border-b border-white/30 pb-1">
                      {i18n.language === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-dark-surface rounded-[4rem] border-2 border-dashed border-organic-green/10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-organic-green/5 dark:bg-organic-green/10 rounded-full flex items-center justify-center text-organic-green">
            <Info size={40} />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-black text-organic-dark dark:text-white uppercase tracking-tight">No data found</p>
            <p className="text-sm text-organic-dark/40 dark:text-gray-400 font-bold uppercase tracking-widest">Our team is currently updating this category.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="organic-btn bg-organic-accent text-organic-dark shadow-xl hover:-translate-y-1 flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              <Plus size={20} />
              Setup Default Data (Admin)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

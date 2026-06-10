import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Wheat, Bird, Fish, ShoppingBag, Stethoscope, ArrowRight, Sparkles, 
  Shield, BookOpen, Database, Cloud, Sun, CloudRain, CloudLightning, 
  Wind, Calendar, Landmark, Droplets, Users, Beef, Sprout, TrendingUp, 
  Tag, Mountain, AlertCircle, MessageSquare, PlayCircle, GraduationCap, 
  Globe, Snowflake, Tractor, CreditCard, AlertTriangle, Cpu, Leaf,
  ShoppingCart, Package, Book, MapPin, Mail, Phone, ExternalLink, 
  Layers, Microscope, BarChart3, Map as MapIcon, CheckCircle2, Info, Activity 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useWeather } from '../components/WeatherContext';
import { safeLocalStorage } from '../lib/storage';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { weather } = useWeather();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [appStatuses, setAppStatuses] = useState<any>({
    loan: null,
    export: null,
    protection: null,
    card: null
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setAppStatuses({ loan: null, export: null, protection: null, card: null });
      return;
    }

    const uid = auth.currentUser.uid;

    const unsubLoan = onSnapshot(
      query(collection(db, 'loanApplications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(1)),
      (snap) => {
        if (!snap.empty) setAppStatuses((prev: any) => ({ ...prev, loan: snap.docs[0].data() }));
      }
    );

    const unsubExport = onSnapshot(
      query(collection(db, 'exportApplications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(1)),
      (snap) => {
        if (!snap.empty) setAppStatuses((prev: any) => ({ ...prev, export: snap.docs[0].data() }));
      }
    );

    const unsubProtection = onSnapshot(
      query(collection(db, 'protectionApplications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(1)),
      (snap) => {
        if (!snap.empty) setAppStatuses((prev: any) => ({ ...prev, protection: snap.docs[0].data() }));
      }
    );

    const unsubCard = onSnapshot(
      query(collection(db, 'cardApplications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(1)),
      (snap) => {
        if (!snap.empty) setAppStatuses((prev: any) => ({ ...prev, card: snap.docs[0].data() }));
      }
    );

    return () => {
      unsubLoan();
      unsubExport();
      unsubProtection();
      unsubCard();
    };
  }, [auth.currentUser]);

  useEffect(() => {
    const checkAdmin = () => {
      const isAdminLocal = safeLocalStorage.getItem('isAdmin') === 'true';

      if (isAdminLocal) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
    const interval = setInterval(checkAdmin, 2000);

    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (e) {
          console.error("Error fetching profile", e);
        }
      }
    };
    fetchProfile();

    return () => clearInterval(interval);
  }, []);

  const getWeatherConditionBn = (condition: string) => {
    const mapping: { [key: string]: string } = {
      'Sunny': 'রৌদ্রোজ্জ্বল',
      'Clear': 'পরিষ্কার আকাশ',
      'Partly cloudy': 'আংশিক মেঘলা',
      'Cloudy': 'মেঘলা',
      'Overcast': 'মেঘাচ্ছন্ন',
      'Mist': 'কুয়াশাচ্ছন্ন',
      'Patchy rain possible': 'হালকা বৃষ্টির সম্ভাবনা',
      'Thundery outbreaks possible': 'বজ্রবৃষ্টির সম্ভাবনা',
      'Fog': 'কুয়াশা',
      'Light rain': 'হালকা বৃষ্টি',
      'Moderate rain': 'মাঝারি বৃষ্টি',
      'Heavy rain': 'ভারী বৃষ্টি',
      'Patchy light rain with thunder': 'বজ্রসহ হালকা বৃষ্টি',
      'Moderate or heavy rain with thunder': 'বজ্রসহ ভারী বৃষ্টি'
    };
    return mapping[condition] || condition;
  };

  const categories = [
    {
      id: 'alerts',
      title: t('notifications'),
      items: [
        { title: t('farm_journal'), icon: Book, path: '/farm-journal', color: 'bg-organic-dark', desc: t('farm_journal_desc'), image: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572' },
        { title: t('weather_alerts'), icon: CloudRain, path: '/weather-alerts', color: 'bg-cyan-700', desc: t('weather_alerts_desc'), image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b' },
        { title: t('pest_warning'), icon: AlertTriangle, path: '/pest-warning', color: 'bg-red-800', desc: t('pest_warning_desc'), image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc' },
      ]
    },
        {
      id: 'farming',
      title: i18n.language === 'en' ? 'Farming Guides' : 'চাষাবাদ নির্দেশিকা',
      items: [
        { title: t('livestock'), icon: Beef, path: '/livestock', color: 'bg-organic-dark', desc: t('livestock_desc'), image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53' },
        { title: t('poultry'), icon: Bird, path: '/poultry', color: 'bg-orange-800', desc: t('poultry_desc'), image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7' },
        { title: t('fisheries'), icon: Fish, path: '/fisheries', color: 'bg-blue-900', desc: t('fisheries_desc'), image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00' },
        { title: i18n.language === 'en' ? 'Livestock Health' : 'পশু স্বাস্থ্য', icon: Stethoscope, path: '/livestock-health', color: 'bg-red-600', desc: 'Veterinary services', image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53' },
        { title: i18n.language === 'en' ? 'Water Testing' : 'পানি পরীক্ষা', icon: Droplets, path: '/fish-water-test', color: 'bg-cyan-600', desc: 'Fish water analysis', image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00' },
        { title: t('vegetables'), icon: Leaf, path: '/vegetables', color: 'bg-green-800', desc: t('vegetables_desc'), image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2' },
        { title: t('ai_disease'), icon: Microscope, path: '/ai-disease', color: 'bg-indigo-900', desc: t('ai_disease_desc'), image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b' },
        { title: t('crop_calendar'), icon: Calendar, path: '/crop-calendar', color: 'bg-blue-800', desc: t('crop_calendar_desc'), image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335' },
        { title: t('fertilizer_calculator'), icon: Mountain, path: '/soil-health', color: 'bg-stone-800', desc: t('soil_health_desc'), image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399' },
        { title: t('expert_chat'), icon: MessageSquare, path: '/chat-expert', color: 'bg-blue-600', desc: t('expert_chat_desc'), image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3' },
        { title: t('farming_ledger'), icon: BarChart3, path: '/ledger', color: 'bg-blue-600', desc: t('farming_ledger_desc'), image: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572' },
        { title: t('global_standards'), icon: Globe, path: '/global-standards', color: 'bg-blue-900', desc: t('global_standards_desc'), image: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d' },
        { title: t('satellite_monitoring'), icon: Layers, path: '/satellite-monitoring', color: 'bg-green-900', desc: t('satellite_monitoring_desc'), image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa' },
        { title: t('smart_irrigation'), icon: Cpu, path: '/smart-irrigation', color: 'bg-indigo-900', desc: t('smart_irrigation_desc'), image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0' },
        { title: t('about_us'), icon: Info, path: '/about', color: 'bg-organic-dark', desc: (t('krishi_bondhu_detailed_desc') || '').slice(0, 50) + '...', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef' },
      ]
    },
    {
      id: 'trade',
      title: i18n.language === 'en' ? 'Trade & Market' : 'ব্যবসা ও বাজার',
      items: [
        { title: t('marketplace'), icon: ShoppingBag, path: '/farmer-market', color: 'bg-orange-700', desc: t('marketplace_desc'), image: 'https://images.unsplash.com/photo-1488459711612-da34da677271' },
        { title: t('market_price'), icon: TrendingUp, path: '/market-price', color: 'bg-emerald-700', desc: t('market_price_desc'), image: 'https://images.unsplash.com/photo-1542838132-92c53300491e' },
        { title: t('our_products'), icon: Tag, path: '/products', color: 'bg-stone-900', desc: t('our_products_desc'), image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d' },
      ]
    },
    {
      id: 'economic',
      title: i18n.language === 'en' ? 'Economic & Applications' : 'আর্থনৈতিক ও আবেদন',
      items: [
        { title: t('govt_schemes'), icon: Landmark, path: '/govt-schemes', color: 'bg-emerald-800', desc: t('govt_schemes_desc'), image: 'https://images.unsplash.com/photo-1541872703-74c5e443d1f0' },
        { title: t('bondhu_rin'), icon: CreditCard, path: '/bondhu-rin', color: 'bg-blue-800', desc: t('bondhu_rin_desc'), image: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366' },
        { title: t('bondhu_card'), icon: CreditCard, path: '/card-application', color: 'bg-purple-800', desc: t('bondhu_card_desc'), image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1' },
        { title: t('suraksha'), icon: Shield, path: '/suraksha', color: 'bg-red-800', desc: t('suraksha_desc'), image: 'https://images.unsplash.com/photo-1508847154043-be5407fcaa5a' },
        { title: t('export_app'), icon: Globe, path: '/export-application', color: 'bg-cyan-800', desc: t('export_app_desc'), image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec' },
      ]
    },
    {
      id: 'community',
      title: i18n.language === 'en' ? 'Community & Learning' : 'কমিউনিটি ও শিক্ষা',
      items: [
        { title: t('expert_chat'), icon: MessageSquare, path: '/chat-expert', color: 'bg-organic-dark', desc: t('expert_chat_desc'), image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998' },
        { title: t('krishi_proshikkhon'), icon: GraduationCap, path: '/training', color: 'bg-indigo-900', desc: t('krishi_proshikkhon_desc'), image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2' },
        { title: t('tutorials'), icon: PlayCircle, path: '/tutorials', color: 'bg-red-900', desc: t('tutorials_desc'), image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3' },
        { title: t('community_forum'), icon: Users, path: '/community-forum', color: 'bg-pink-900', desc: t('community_forum_desc'), image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846' },
        { title: t('my_stories'), icon: BookOpen, path: '/stories', color: 'bg-emerald-900', desc: t('my_stories_desc'), image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854' },
        { title: t('farm_problem'), icon: AlertTriangle, path: '/problem_solver', color: 'bg-red-900', desc: t('farm_problem_desc'), image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b' },
      ]
    },
    {
      id: 'resources',
      title: i18n.language === 'en' ? 'Resources & Services' : 'সম্পদ ও সেবা',
      items: [
        { title: t('resource_map'), icon: MapIcon, path: '/resource-map', color: 'bg-emerald-600', desc: t('resource_map_desc'), image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1' },
        { title: t('knowledge_base'), icon: BookOpen, path: '/knowledge-base', color: 'bg-indigo-600', desc: t('knowledge_base_desc'), image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3' },
        { title: t('cold_storage'), icon: Snowflake, path: '/cold-storage', color: 'bg-cyan-900', desc: t('cold_storage_desc'), image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d' },
        { title: t('seed_bank'), icon: Sprout, path: '/seed-bank', color: 'bg-amber-900', desc: t('seed_bank_desc'), image: 'https://images.unsplash.com/photo-1599307767316-776533da941c' },
        { title: t('rent_machine'), icon: Tractor, path: '/rent-machine', color: 'bg-stone-800', desc: t('rent_machine_desc'), image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef' },
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#FDFCFB] dark:bg-dark-bg transition-colors duration-500 text-organic-dark dark:text-gray-100">
      <div className="relative z-10 space-y-12 pb-32">
      <header className="relative overflow-hidden rounded-b-[4rem] bg-organic-dark min-h-[450px] sm:min-h-[550px] flex flex-col p-6 sm:p-20 text-white shadow-2xl mb-4 pt-16 sm:pt-20">
        <div className="absolute inset-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef" className="w-full h-full object-cover scale-110" alt="Sustainable Farm" />
          <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/95 via-organic-dark/60 to-organic-dark" />
        </div>
        
        <div className="absolute top-12 left-0 right-0 z-30 px-6 sm:px-20">
          <div className="max-w-7xl mx-auto flex justify-center">
            <div className="flex items-center gap-2 w-full max-w-[95%] sm:max-w-md bg-black/40 backdrop-blur-2xl p-1 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden h-12 sm:h-14">
              <a 
                href="https://chat.whatsapp.com/KJpJXvzxJQz8X1VJPCgqCQ" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 sm:gap-3 flex-1 h-full bg-gradient-to-r from-organic-green to-[#388E3C] rounded-full text-white text-[10px] sm:text-[13px] font-black uppercase tracking-tight hover:brightness-110 transition-all shadow-lg active:scale-95 whitespace-nowrap px-4"
              >
                <Users size={14} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="font-bn translate-y-[-0.5px] leading-tight">{i18n.language === 'en' ? 'JOIN COMMUNITY' : 'যুক্ত হোন'}</span>
              </a>
              
              <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 h-full group border-l border-white/10 ml-1">
                <div className="text-yellow-400 group-hover:scale-110 transition-transform duration-500">
                  {weather?.icon || <Sun size={20} className="animate-spin-slow w-5 h-5 sm:w-7 sm:h-7" />}
                </div>
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[12px] sm:text-lg font-black tracking-tighter text-white">
                    {weather ? `${weather.temp}°C` : '--°C'}
                  </span>
                  <span className="text-[6px] sm:text-[8px] text-white/60 font-black uppercase tracking-tight font-bn">
                    {weather ? (i18n.language === 'en' ? weather.condition : getWeatherConditionBn(weather.condition)) : '...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col relative z-10 pt-20 sm:pt-28 pb-10 sm:pb-16">
          {/* Middle Section: Apps Title & Tagline (Higher in the space) */}
          <div className="flex-grow flex flex-col items-center justify-start pt-16 sm:pt-24 w-full px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 blur-[100px] bg-organic-green/30 -z-10 rounded-full" />
              <h1 className={cn(
                "font-black text-white tracking-tighter uppercase leading-[0.85] font-bn drop-shadow-2xl select-none flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-4",
                i18n.language === 'en' ? "text-[10vw] sm:text-[8rem] lg:text-[10rem]" : "text-[16vw] sm:text-[10rem] lg:text-[12rem]"
              )}>
                {i18n.language === 'en' ? (
                  <><span className="whitespace-nowrap tracking-tight">KRISHI</span> <span className="text-organic-green whitespace-nowrap tracking-tight">BONDHU</span></>
                ) : (
                  <><span className="whitespace-nowrap tracking-tighter">কৃষি</span> <span className="text-organic-green whitespace-nowrap tracking-tighter">বন্ধু</span></>
                )}
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-4xl mt-4"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-[2px] bg-organic-green mb-2 rounded-full opacity-50" />
                <span className={cn(
                  "font-black uppercase tracking-[0.2em] text-white/90 font-bn drop-shadow-lg",
                  i18n.language === 'bn' ? "text-[5vw] sm:text-4xl" : "text-[3vw] sm:text-2xl"
                )}>
                  {t('hero_tagline')}
                </span>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom Section: Action Box Cluster */}
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-[340px] sm:max-w-2xl mx-auto px-4 mt-20">
            {/* Expert Chat Box - Capsule Style */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full"
            >
              <Link
                to="/chat-expert"
                className="w-full flex items-center gap-4 sm:gap-6 py-4 sm:py-6 px-10 rounded-full border-2 border-organic-green/80 bg-black/20 backdrop-blur-md hover:bg-organic-green/10 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center justify-center p-1">
                  <MessageSquare size={32} className="text-organic-green sm:w-10 sm:h-10" />
                </div>
                <span className="text-lg sm:text-4xl font-black text-white font-bn uppercase tracking-tight">
                  {t('expert_chat')}
                </span>
                <ArrowRight className="ml-auto text-organic-green group-hover:translate-x-2 transition-transform" size={24} />
              </Link>
            </motion.div>

            {/* AI & Market Buttons - Vertical Stack Style */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-4 sm:gap-6 w-full mb-8"
            >
              <Link
                to="/ai-disease"
                className="w-full flex items-center gap-4 sm:gap-6 py-4 sm:py-6 px-10 rounded-full border-2 border-organic-green/80 bg-black/20 backdrop-blur-md hover:bg-organic-green/10 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center justify-center p-1 shrink-0">
                  <Microscope size={32} className="text-organic-green sm:w-10 sm:h-10" />
                </div>
                <span className="text-lg sm:text-4xl font-black text-white font-bn uppercase tracking-tight">
                  {i18n.language === 'en' ? 'AI DIAGNOSIS' : 'এআই রোগ নির্ণয়'}
                </span>
                <ArrowRight className="ml-auto text-organic-green group-hover:translate-x-2 transition-transform" size={24} />
              </Link>

              <Link
                to="/farmer-market"
                className="w-full flex items-center gap-4 sm:gap-6 py-4 sm:py-6 px-10 rounded-full border-2 border-organic-green/80 bg-black/20 backdrop-blur-md hover:bg-organic-green/10 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center justify-center p-1 shrink-0">
                  <ShoppingBag size={32} className="text-organic-green sm:w-10 sm:h-10" />
                </div>
                <span className="text-lg sm:text-4xl font-black text-white font-bn uppercase tracking-tight">
                  {i18n.language === 'en' ? 'MARKETPLACE' : 'বাজার সংযোগ'}
                </span>
                <ArrowRight className="ml-auto text-organic-green group-hover:translate-x-2 transition-transform" size={24} />
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Application Status Section */}
      {auth.currentUser && (Object.values(appStatuses).some(v => v !== null)) && (
        <div className="px-5 sm:px-12 mt-12">
          <div className="bg-white dark:bg-white/5 border border-organic-green/20 rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-organic-green/5 overflow-hidden relative group/section">
            <div className="absolute top-0 right-0 w-64 h-64 bg-organic-green/5 blur-3xl -z-10 rounded-full" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <div className="p-3 bg-organic-green/10 rounded-2xl text-organic-green">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-organic-dark dark:text-white tracking-tighter uppercase">
                    {i18n.language === 'en' ? 'My Applications' : 'আমার আবেদনসমূহ'}
                  </h3>
                </div>
                <p className="text-organic-dark/60 dark:text-gray-400 font-bold ml-1">
                  {i18n.language === 'en' ? 'Track your active requests in real-time' : 'আপনার সক্রিয় আবেদনের বর্তমান অবস্থা দেখুন'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-organic-green/5 rounded-full border border-organic-green/10">
                <div className="w-2 h-2 rounded-full bg-organic-green animate-pulse" />
                <span className="text-[10px] font-black text-organic-green uppercase tracking-widest leading-none translate-y-[1px]">Live Updates</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { id: 'loan', label: i18n.language === 'en' ? 'Loan' : 'বন্ধু ঋণ', icon: CreditCard, path: '/bondhu-rin', color: 'text-blue-600', bg: 'bg-blue-600' },
                { id: 'export', label: i18n.language === 'en' ? 'Export' : 'রপ্তানি', icon: Globe, path: '/export-application', color: 'text-cyan-600', bg: 'bg-cyan-600' },
                { id: 'protection', label: i18n.language === 'en' ? 'Protection' : 'সুরক্ষা', icon: Shield, path: '/suraksha', color: 'text-red-600', bg: 'bg-red-600' },
                { id: 'card', label: i18n.language === 'en' ? 'ID Card' : 'বন্ধু কার্ড', icon: CreditCard, path: '/card-application', color: 'text-purple-600', bg: 'bg-purple-600' }
              ].map((app) => {
                const data = appStatuses[app.id];
                if (!data) return null;

                const status = data.status?.toLowerCase() || 'pending';
                let progress = 33;
                if (['approved', 'active', 'completed', 'verified'].includes(status)) progress = 100;
                else if (['processing', 'review', 'verifying'].includes(status)) progress = 66;

                return (
                  <motion.div
                    key={app.id}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => navigate(app.path)}
                  >
                    <div className="bg-[#F9FBF9] dark:bg-white/5 border border-organic-green/10 rounded-3xl p-6 h-full flex flex-col gap-4 group/card hover:border-organic-green/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className={cn("p-3 rounded-2xl bg-white dark:bg-white/10 shadow-sm", app.color.replace('text-', 'bg-').replace('600', '50'))}>
                          <app.icon size={20} className={app.color} />
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          progress === 100 ? "bg-green-100 text-green-700" : 
                          progress === 66 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-organic-dark dark:text-white group-hover:text-organic-green transition-colors uppercase tracking-tight text-lg">
                          {app.label}
                        </h4>
                        <p className="text-[10px] text-organic-dark/40 dark:text-gray-500 font-bold uppercase tracking-wider">
                          {data.loanId || data.protectionId || (i18n.language === 'en' ? 'Active App' : 'সক্রিয় আবেদন')}
                        </p>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-[10px] font-black text-organic-dark/60 dark:text-gray-400 uppercase tracking-widest">Progress</span>
                          <span className="text-xs font-black text-organic-dark dark:text-white">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-organic-dark/5 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]", app.bg)}
                          />
                        </div>
                        
                        <div className="flex justify-between text-[8px] font-black text-organic-dark/30 dark:text-gray-600 uppercase tracking-[0.2em] pt-1">
                          <span>SUBMITTED</span>
                          <span>PROCESSING</span>
                          <span>FINAL</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {/* Categories Section */}
        <div className="px-5 sm:px-12 space-y-24 mt-24 sm:mt-32">
          {categories.map((category) => (
            <div key={category.id} className="space-y-12 group">
              <div className="flex items-center gap-6">
                <div className="w-4 h-12 bg-organic-green rounded-full shadow-lg shadow-organic-green/20" />
                <h3 className="text-4xl sm:text-5xl font-black text-organic-dark dark:text-white transition-colors tracking-tighter uppercase">{category.title}</h3>
                <div className="flex-grow h-[2px] bg-gradient-to-r from-organic-green/20 to-transparent" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 sm:gap-14">
                {category.items.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div 
                      key={`${category.id}-${card.path}-${index}`} 
                      initial={{ opacity: 0, y: 30 }} 
                      whileInView={{ opacity: 1, y: 0 }} 
                      viewport={{ once: true }} 
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      <motion.div
                        whileTap={{ 
                          scale: 0.96,
                          rotate: [-1, 1, -1, 1, 0],
                          transition: { duration: 0.2 }
                        }}
                        className="h-full w-full"
                      >
                          <Link to={card.path} className="module-card group flex flex-col items-center justify-center gap-6 p-5 sm:p-8 min-h-[180px] sm:min-h-[240px] dark:border-white/10 overflow-hidden active:shadow-inner transition-all h-full w-full">
                            {/* Background Image Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                              <img src={card.image} alt="" className="w-full h-full object-cover scale-150 group-hover:scale-100 transition-transform duration-1000" />
                            </div>

                            <div className="absolute top-0 right-0 w-32 h-32 bg-organic-green/5 rounded-bl-[4rem] group-hover:bg-organic-green/10 transition-colors pointer-events-none" />
                            
                            <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 z-10 shrink-0 overflow-hidden", card.color)}>
                              <Icon className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                            </div>
                            
                            <div className="text-center z-10 relative px-1 sm:px-4 flex flex-col items-center justify-center flex-grow w-full py-2">
                              <h4 className="text-organic-dark dark:text-white font-black text-[14px] sm:text-[20px] uppercase tracking-tight leading-[1.2] group-hover:text-organic-green transition-colors flex items-center justify-center text-center w-full break-words">{card.title}</h4>
                            </div>
                          </Link>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

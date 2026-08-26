import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Menu, X, Home, ShoppingBag, Bell, User, Clock,
  Sun, Moon, Languages, Phone, LogOut,
  AlertTriangle, CreditCard, Shield, Landmark, Gift,
  CloudRain, Users, Book, Stethoscope, BarChart3, Droplets,
  Map as MapIcon, Mountain, BookOpen, Snowflake, Database,
  Tractor, Globe, Layers, Info, Beef, Bird, Fish, Leaf, TrendingUp, FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeLocalStorage } from '../lib/storage';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useNotifications } from './NotificationManager';
import { useWeather } from './WeatherContext';
import { useTheme } from './ThemeContext';
import VoiceAssistant from './VoiceAssistant';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, markAsRead, notifications } = useNotifications();
  const { weather, refreshWeather } = useWeather();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarHidden, setIsDesktopSidebarHidden] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 768;
  const isMenuExpanded = isDesktop ? !isDesktopSidebarHidden : isSidebarOpen;
  const [user, setUser] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showConnError, setShowConnError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Sync user state from localStorage and MongoDB
  useEffect(() => {
    const loadUser = async () => {
      const userStr = safeLocalStorage.getItem('user');
      const authToken = safeLocalStorage.getItem('authToken');

      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          setUser(parsed);
          setUserProfile(parsed);
          if (parsed.role === 'admin' || safeLocalStorage.getItem('isAdmin') === 'true') {
            setIsAdmin(true);
          }
        } catch {}
      }

      if (authToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            setUserProfile(data);
            setIsAdmin(data.role === 'admin');
            safeLocalStorage.setItem('user', JSON.stringify(data));
            if (data.role === 'admin') safeLocalStorage.setItem('isAdmin', 'true');
          }
        } catch {}
      }
    };

    loadUser();
  }, [location.pathname]);

  // MongoDB connection check via health API
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.mongodb === 'connected') {
              setDbStatus('connected');
              setShowConnError(false);
            } else {
              setDbStatus('error');
              setShowConnError(true);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setDbStatus('error');
          setShowConnError(true);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    refreshWeather(userProfile?.address || 'Dhaka');
  }, [userProfile?.address]);

  const handleLogout = () => {
    safeLocalStorage.removeItem('authToken');
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('loginMethod');
    safeLocalStorage.removeItem('isAdmin');
    safeLocalStorage.removeItem('isUser');
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    navigate('/login');
  };

  const navItems = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('marketplace'), path: '/farmer-market', icon: ShoppingBag },
    { name: t('livestock'), path: '/livestock', icon: Beef },
    { name: t('poultry'), path: '/poultry', icon: Bird },
    { name: t('fisheries'), path: '/fisheries', icon: Fish },
    { name: t('vegetables'), path: '/vegetables', icon: Leaf },
    { name: t('market_price'), path: '/market-price', icon: TrendingUp },
    { name: t('suraksha'), path: '/suraksha', icon: Shield },
    { name: t('bondhu_rin'), path: '/bondhu-rin', icon: Landmark },
    { name: t('govt_schemes'), path: '/govt-schemes', icon: Gift },
    { name: t('weather_alerts'), path: '/weather-alerts', icon: CloudRain },
    { name: t('community_forum'), path: '/community-forum', icon: Users },
    { name: t('farm_journal'), path: '/farm-journal', icon: Book },
    { name: t('ask_gemini'), path: '/problem_solver', icon: Stethoscope },
    { name: t('farming_ledger'), path: '/ledger', icon: BarChart3 },
    { name: t('resource_map'), path: '/resource-map', icon: MapIcon },
    { name: i18n.language === 'en' ? 'Soil Health Test' : 'মাটি পরীক্ষা', path: '/soil-health', icon: FlaskConical },
    { name: t('knowledge_base'), path: '/knowledge-base', icon: BookOpen },
    { name: i18n.language === 'en' ? 'Livestock Health' : 'পশু স্বাস্থ্য', path: '/livestock-health', icon: Stethoscope },
    { name: i18n.language === 'en' ? 'Fish Water Test' : 'মাছের পানি পরীক্ষা', path: '/fish-water-test', icon: Droplets },
    { name: t('cold_storage'), path: '/cold-storage', icon: Snowflake },
    { name: t('seed_bank'), path: '/seed-bank', icon: Database },
    { name: t('rent_machine'), path: '/rent-machine', icon: Tractor },
    { name: t('agent_registration'), path: '/agent-registration', icon: Users },
    { name: t('agent_login'), path: '/agent-login', icon: User },
    { name: t('export_app'), path: '/export-application', icon: Globe },
    { name: t('global_standards'), path: '/global-standards', icon: Globe },
    { name: t('satellite_monitoring'), path: '/satellite-monitoring', icon: Layers },
    { name: t('bondhu_card'), path: '/card-application', icon: CreditCard },
    { name: t('about_us'), path: '/about', icon: Info },
  ];

  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const enDate = format(new Date(), 'EEEE, MMMM dd, yyyy');
  const bnDate = new Intl.DateTimeFormat('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className={cn(
      "min-h-screen font-sans relative bg-[#FDFCFB] dark:bg-dark-bg transition-[background-color,color] duration-500", 
      theme === 'dark' ? 'dark' : '', 
      i18n.language === 'bn' && "font-bn"
    )}>
      {!isAuthPage && (
        <>
          <VoiceAssistant />
          <nav className="fixed top-0 left-0 right-0 h-20 sm:h-24 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-organic-green/5 dark:border-white/5 z-50 px-2 sm:px-12 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-6 flex-1 min-w-0">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => isDesktop ? setIsDesktopSidebarHidden(!isDesktopSidebarHidden) : setIsSidebarOpen(!isSidebarOpen)}
                    className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all shadow-sm flex-shrink-0", isMenuExpanded ? "bg-organic-green text-white" : "bg-organic-light dark:bg-dark-surface text-organic-dark dark:text-gray-100 hover:bg-organic-green hover:text-white")}
                >
                    {isMenuExpanded ? <X size={18} className="sm:w-6 sm:h-6" /> : <Menu size={18} className="sm:w-6 sm:h-6" />}
                </motion.button>
                <Link to="/" className="flex items-center gap-2 sm:gap-4 group">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center overflow-hidden rounded-xl bg-transparent">
                        <img src="/krishi_logo.png" className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xl sm:text-3xl font-black uppercase text-organic-dark dark:text-white leading-none tracking-tighter">{t('app_name')}</span>
                        <div className="flex items-center mt-0.5">
                            <span className="text-[7px] sm:text-[9px] font-black uppercase text-organic-green tracking-[0.18em] sm:tracking-[0.38em] whitespace-nowrap">{t('tagline')}</span>
                        </div>
                    </div>
                </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
                <button onClick={toggleTheme} className="p-1.5 sm:p-3 bg-organic-light dark:bg-dark-surface rounded-xl"><Moon size={16} /></button>
                <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')} className="p-1.5 sm:p-3 bg-organic-light dark:bg-dark-surface rounded-xl"><Languages size={16} /></button>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-1.5 sm:p-3 bg-organic-light dark:bg-dark-surface rounded-xl relative">
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
            </div>
          </nav>
          
          <aside className={cn(
            "fixed inset-y-0 left-0 w-80 bg-white dark:bg-dark-bg border-r border-organic-green/5 dark:border-white/5 z-[60] lg:pt-32 transition-all duration-500 ease-in-out pb-6 shadow-2xl lg:shadow-none",
            isDesktop ? (isDesktopSidebarHidden ? "-translate-x-full" : "translate-x-0") : (isSidebarOpen ? "translate-x-0" : "-translate-x-full")
          )}>
            <div className="flex flex-col h-full px-6 overflow-y-auto no-scrollbar relative">
                {/* Sidebar Header */}
                <div className="py-6 border-b border-organic-green/5 mb-4 flex flex-col items-center text-center relative">
                    <button 
                        onClick={() => isDesktop ? setIsDesktopSidebarHidden(true) : setIsSidebarOpen(false)}
                        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-organic-green transition-all hover:scale-110"
                        title={i18n.language === 'en' ? "Hide Sidebar" : "মেনু লুকান"}
                    >
                        <X size={18} />
                    </button>
                    
                    <div className="w-20 h-20 mb-3 rounded-2xl overflow-hidden bg-transparent flex items-center justify-center">
                        <img src="/krishi_logo.png" className="w-full h-full object-contain" alt="Krishi Bondhu" referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black uppercase text-organic-dark dark:text-white tracking-tighter leading-none">{t('app_name')}</span>
                        <div className="flex items-center w-full mt-1.5 justify-center">
                            <span className="text-[10px] font-black uppercase text-organic-green tracking-[0.25em] whitespace-nowrap">{t('tagline')}</span>
                        </div>
                    </div>
                    
                    {userProfile && (
                        <div className="mt-4 w-full p-3 bg-organic-light dark:bg-dark-surface rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-organic-green flex items-center justify-center text-white text-xs font-black">
                                {userProfile?.name ? userProfile.name[0].toUpperCase() : 'F'}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-[10px] font-black uppercase text-organic-dark dark:text-white truncate w-full text-left">{userProfile?.name || t('guest_farmer')}</span>
                                <span className="text-[8px] font-black uppercase text-organic-green/70">{userProfile?.address || 'Bangladesh'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2 mt-0 font-bn">
                    {navItems.map((item) => (
                        <Link key={`sidebar-nav-${item.path}`} to={item.path} onClick={() => setIsSidebarOpen(false)} className={cn("flex items-center gap-4 px-5 py-3 rounded-2xl", location.pathname === item.path ? "bg-organic-green text-white shadow-lg" : "text-organic-dark/60")}>
                            <item.icon size={18} />
                            <span className="text-xs font-black uppercase text-left">{item.name}</span>
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link key="sidebar-nav-admin" to="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-purple-50 text-purple-600">
                            <Database size={18} />
                            <span className="text-xs font-black uppercase text-purple-600">{t('admin_panel')}</span>
                        </Link>
                    )}
                    <button key="sidebar-nav-logout" onClick={handleLogout} className="flex items-center gap-4 px-5 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut size={18} />
                        <span className="text-xs font-black uppercase">{t('logout')}</span>
                    </button>
                    
                    <a href="tel:+8801700000000" className="flex items-center gap-4 px-5 py-4 mt-4 rounded-2xl bg-organic-green text-white shadow-xl shadow-organic-green/20">
                        <Phone size={20} className="animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase opacity-80">{i18n.language === 'en' ? 'Need Help?' : 'সাহায্য প্রয়োজন?'}</span>
                            <span className="text-sm font-black uppercase">{i18n.language === 'en' ? 'CALL US NOW' : 'কল করুন'}</span>
                        </div>
                    </a>
                </div>
            </div>
          </aside>
          <AnimatePresence>
            {isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" />}
          </AnimatePresence>
        </>
      )}

      <main className={cn("transition-all duration-500 max-w-full overflow-x-hidden", !isAuthPage && cn("pt-24 sm:pt-32 px-4 sm:px-12", isMenuExpanded ? "md:ml-80" : "md:ml-0"))}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

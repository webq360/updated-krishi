import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, AlertCircle, Loader2, ArrowRight, CheckCircle2, Globe, Moon, Sun, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { safeLocalStorage } from '../lib/storage';
import { useTheme } from '../components/ThemeContext';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const isBn = i18n.language !== 'en';

  React.useEffect(() => {
    // Check if already logged in
    const authToken = safeLocalStorage.getItem('authToken');
    if (authToken) {
      navigate('/');
    }
  }, [navigate]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');
  };

  // ==================== MongoDB Login ====================
  const handleMongoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || (isBn ? 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Login failed. Please check credentials.'));
        return;
      }

      // Store token and user info
      safeLocalStorage.setItem('authToken', data.token);
      safeLocalStorage.setItem('user', JSON.stringify(data.user));
      safeLocalStorage.setItem('loginMethod', 'mongodb');
      if (data.user.role === 'admin') {
        safeLocalStorage.setItem('isAdmin', 'true');
      }

      setSuccess(isBn ? '✅ লগইন সফল হয়েছে! রিডাইরেক্ট করা হচ্ছে...' : '✅ Login successful! Redirecting...');

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 800);
    } catch (err) {
      setError(isBn ? 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' : 'Network error. Please check your connection.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FDFCFB] dark:bg-[#0E170E] text-[#1B301B] dark:text-white transition-colors duration-300 relative selection:bg-organic-green selection:text-white">
      {/* Top Floating Action Bar */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-[#1A2E1A]/80 backdrop-blur-md border border-[#E0E8E0] dark:border-white/10 rounded-full text-xs font-bold text-[#1B301B] dark:text-white hover:bg-white dark:hover:bg-[#1A2E1A] shadow-sm transition-all"
        >
          <Home size={14} className="text-[#4CAF50]" />
          <span>{isBn ? 'হোম পেজ' : 'Home'}</span>
        </Link>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-[#1A2E1A]/80 backdrop-blur-md border border-[#E0E8E0] dark:border-white/10 rounded-full text-xs font-black text-[#1B301B] dark:text-white hover:bg-white dark:hover:bg-[#1A2E1A] shadow-sm transition-all"
          title="Change Language"
        >
          <Globe size={14} className="text-[#4CAF50]" />
          <span>{i18n.language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-white/80 dark:bg-[#1A2E1A]/80 backdrop-blur-md border border-[#E0E8E0] dark:border-white/10 rounded-full text-[#1B301B] dark:text-white hover:bg-white dark:hover:bg-[#1A2E1A] shadow-sm transition-all"
          title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-[#556B55]" />}
        </button>
      </div>

      {/* Visual Panel */}
      <div className="hidden lg:flex relative bg-organic-dark overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854" 
            alt="Organic Farm" 
            className="w-full h-full object-cover opacity-15 transition-transform duration-[20s] hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-organic-dark via-organic-dark/95 to-transparent" />
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-organic-green/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-12">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 text-organic-accent text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl"
            >
              <div className="w-2.5 h-2.5 bg-organic-accent rounded-full animate-pulse shadow-[0_0_15px_#FFC107]" />
              <span>{isBn ? 'স্মার্ট কৃষি প্ল্যাটফর্ম' : 'Smart Agriculture Platform'}</span>
            </motion.div>
            
            <h1 className="text-6xl font-black leading-none tracking-tight uppercase text-white">
              {isBn ? (
                <>
                  কৃষকের সাথে <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-organic-green via-emerald-400 to-teal-300 drop-shadow-2xl">
                    সব সময়
                  </span>
                </>
              ) : (
                <>
                  GROW WITH <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-organic-green via-emerald-400 to-teal-300 drop-shadow-2xl">
                    CONFIDENCE
                  </span>
                </>
              )}
            </h1>
            
            <div className="flex flex-col gap-3 mt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-[2px] bg-gradient-to-r from-organic-green to-transparent" />
                <p className="text-lg text-white/80 font-black uppercase tracking-[0.2em]">
                  {t('tagline')}
                </p>
              </div>
              <p className="text-xs text-organic-green font-black uppercase tracking-[0.4em] ml-16 opacity-80">
                {t('app_name')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8 sm:p-16 lg:p-24 relative overflow-hidden">
        <div className="w-full max-w-md space-y-8 relative z-10 my-auto py-12">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-organic-green block">
              {t('app_name')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-organic-dark dark:text-white">
              {t('login_title')}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#556B55] dark:text-gray-400 tracking-wider">
              {t('login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleMongoLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#556B55] dark:text-gray-300 ml-2">
                  {isBn ? 'ইমেইল বা ফোন নম্বর' : 'Email or Phone Number'} *
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4CAF50] transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-14 pr-4 py-4 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-base text-[#1B301B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none transition-all shadow-sm"
                    placeholder={isBn ? 'ইমেইল বা মোবাইল নম্বর দিন' : 'Enter email or phone number'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#556B55] dark:text-gray-300 ml-2">
                  {t('password')} *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4CAF50] transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-14 pr-4 py-4 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-base text-[#1B301B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-xs font-bold"
                >
                  <CheckCircle2 size={18} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-green-900/30 transition-all uppercase tracking-wide",
                loading && "opacity-70 pointer-events-none"
              )}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              <span>{t('login_btn')}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm font-bold text-[#556B55] dark:text-gray-400">
              {t('no_account')} 
              <Link to="/register" className="text-[#4CAF50] hover:underline font-black ml-2">
                {t('register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

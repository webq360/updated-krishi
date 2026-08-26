import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck, CheckCircle2, Globe, Moon, Sun, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { safeLocalStorage } from '../lib/storage';
import { useTheme } from '../components/ThemeContext';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: BANGLADESH_DISTRICTS[0].en,
    upazila: (DISTRICT_UPAZILAS[BANGLADESH_DISTRICTS[0].en]?.[0]?.en) || '',
    phone: '',
    email: '',
    password: ''
  });

  const isBn = i18n.language !== 'en';

  React.useEffect(() => {
    const token = safeLocalStorage.getItem('authToken');
    if (token) navigate('/');
  }, [navigate]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) {
      setError(isBn ? "নাম, ফোন নম্বর এবং পাসওয়ার্ড পূরণ করুন" : "Please fill name, phone and password");
      return;
    }

    if (formData.password.length < 6) {
      setError(isBn ? "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase() || `${formData.phone.trim().replace(/\D/g, '')}@krishibondhu.local`,
          phone: formData.phone.trim(),
          password: formData.password.trim(),
          address: formData.address,
          upazila: formData.upazila,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || (isBn ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed'));
        return;
      }

      // Auto login on successful registration
      safeLocalStorage.setItem('authToken', data.token);
      safeLocalStorage.setItem('user', JSON.stringify(data.user));
      safeLocalStorage.setItem('loginMethod', 'mongodb');

      setSuccess(isBn ? '✅ রেজিস্ট্রেশন সফল হয়েছে! রিডাইরেক্ট করা হচ্ছে...' : '✅ Registration successful! Redirecting...');

      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(isBn ? 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' : 'Network error during registration. Please try again.');
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

      {/* Left Panel: Branding & Visuals */}
      <div className="hidden lg:flex relative bg-organic-dark overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef" 
            alt="Farm" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-organic-dark via-organic-dark/90 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-10">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 text-organic-accent text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl"
            >
              <ShieldCheck size={16} className="text-organic-accent" />
              <span>{isBn ? 'নিরাপদ কৃষক নিবন্ধন' : 'Verified Farmer Registration'}</span>
            </motion.div>

            <h1 className="text-6xl font-black text-white leading-tight tracking-tight uppercase">
              {isBn ? (
                <>
                  আত্মবিশ্বাসের সাথে <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-organic-green via-emerald-400 to-teal-300">
                    এগিয়ে চলুন
                  </span>
                </>
              ) : (
                <>
                  GROW WITH <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-organic-green via-emerald-400 to-teal-300">
                    CONFIDENCE
                  </span>
                </>
              )}
            </h1>
            <p className="text-base text-white/70 leading-relaxed font-medium mt-4">
              {isBn ? 'বাংলাদেশের কৃষক ভাইদের আধুনিক ডিজিটাল কৃষিসেবা দিতে আমরা অঙ্গীকারবদ্ধ।' : 'Empowering Bangladeshi farmers with modern technology, financial support, and real-time guidance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto py-12">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-organic-green mb-2 block">
              {t('app_name')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-organic-dark dark:text-white tracking-tight uppercase">
              {t('register_title')}
            </h2>
            <p className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest mt-1">
              {t('register_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#556B55] dark:text-gray-300 ml-2">
                  {t('full_name')} *
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4CAF50] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-sm font-semibold text-[#1B301B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all shadow-sm"
                    placeholder={isBn ? 'উদা: মোঃ আব্দুল করিম' : 'e.g. Md. Abdul Karim'}
                  />
                </div>
              </div>

              {/* District & Upazila */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#556B55] dark:text-gray-300 ml-2">
                    {t('district')} *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    <select
                      value={formData.address}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        const upazilas = DISTRICT_UPAZILAS[newDist] || [];
                        setFormData({
                          ...formData,
                          address: newDist,
                          upazila: upazilas[0]?.en || ''
                        });
                      }}
                      className="w-full pl-10 pr-3 py-3 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-xs font-bold text-[#1B301B] dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-[#4CAF50] outline-none shadow-sm"
                    >
                      {BANGLADESH_DISTRICTS.map(d => (
                        <option key={d.en} value={d.en} className="dark:bg-[#152415]">
                          {isBn ? d.bn : d.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#556B55] dark:text-gray-300 ml-2">
                    {t('upazila')}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.upazila}
                      onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-xs font-bold text-[#1B301B] dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-[#4CAF50] outline-none shadow-sm"
                    >
                      {(DISTRICT_UPAZILAS[formData.address] || []).map((u: any) => (
                        <option key={u.en} value={u.en} className="dark:bg-[#152415]">
                          {isBn ? u.bn : u.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#556B55] dark:text-gray-300 ml-2">
                  {t('phone_number')} *
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4CAF50] transition-colors" size={18} />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-sm font-semibold text-[#1B301B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all shadow-sm"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#556B55] dark:text-gray-300 ml-2">
                  {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4CAF50] transition-colors" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-sm font-semibold text-[#1B301B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all shadow-sm"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#556B55] dark:text-gray-300 ml-2">
                  {t('password')} *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4CAF50] transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#152415] border border-[#E0E8E0] dark:border-white/10 rounded-2xl text-sm font-semibold text-[#1B301B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all shadow-sm"
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
                  className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-xs font-bold"
                >
                  <CheckCircle2 size={16} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl hover:shadow-green-900/30 transition-all uppercase tracking-wide",
                loading && "opacity-70 pointer-events-none"
              )}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              <span>{t('register_btn')}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm font-bold text-[#556B55] dark:text-gray-400">
              {t('have_account')}{' '}
              <Link to="/login" className="text-[#4CAF50] hover:underline font-black ml-1">
                {t('login_btn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

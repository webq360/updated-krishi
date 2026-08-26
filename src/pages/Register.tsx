import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { safeLocalStorage } from '../lib/storage';

export default function Register() {
  const { t, i18n } = useTranslation();
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

  React.useEffect(() => {
    const token = safeLocalStorage.getItem('authToken');
    if (token) navigate('/');
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) {
      setError(i18n.language === 'en' ? "Please fill name, phone and password" : "নাম, ফোন নম্বর এবং পাসওয়ার্ড দিন");
      return;
    }

    if (formData.password.length < 6) {
      setError(i18n.language === 'en' ? "Password must be at least 6 characters" : "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে");
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
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto login on successful registration
      safeLocalStorage.setItem('authToken', data.token);
      safeLocalStorage.setItem('user', JSON.stringify(data.user));
      safeLocalStorage.setItem('loginMethod', 'mongodb');

      setSuccess('✅ Registration successful! Redirecting...');

      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError('Network error during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FDFCFB] selection:bg-organic-green selection:text-white">
      {/* Left Panel: Branding & Visuals */}
      <div className="hidden lg:flex relative bg-organic-dark overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef" 
            alt="Farm" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-organic-dark via-organic-dark/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-10">
          <div className="space-y-4">
            <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase">
              {i18n.language === 'en' ? (
                <>GROW WITH <br /><span className="text-organic-green">CONFIDENCE</span></>
              ) : (
                <>আত্মবিশ্বাসের সাথে <br /><span className="text-organic-green">এগিয়ে চলুন</span></>
              )}
            </h1>
            <p className="text-xl text-green-50/60 leading-relaxed font-medium mt-6">
              {t('footer_mission')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto py-8">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-organic-green mb-2 block">
              {t('app_name')}
            </span>
            <h2 className="text-4xl font-black text-organic-dark tracking-tight uppercase">
              {t('register_title')}
            </h2>
            <p className="text-xs font-bold text-organic-dark/40 uppercase tracking-widest mt-1">
              {t('register_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {t('full_name')} *
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-organic-dark/30 group-focus-within:text-organic-green transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="organic-input pl-14 text-sm font-semibold"
                    placeholder={i18n.language === 'en' ? 'e.g. Md. Abdul Karim' : 'উদা: মোঃ আব্দুল করিম'}
                  />
                </div>
              </div>

              {/* District & Upazila */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                    {t('district')} *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-organic-dark/30 pointer-events-none" size={16} />
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
                      className="organic-input pl-11 text-xs font-bold appearance-none bg-white cursor-pointer"
                    >
                      {BANGLADESH_DISTRICTS.map(d => (
                        <option key={d.en} value={d.en}>
                          {i18n.language === 'en' ? d.en : d.bn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                    {t('upazila')}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.upazila}
                      onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                      className="organic-input px-4 text-xs font-bold appearance-none bg-white cursor-pointer"
                    >
                      {(DISTRICT_UPAZILAS[formData.address] || []).map((u: any) => (
                        <option key={u.en} value={u.en}>
                          {i18n.language === 'en' ? u.en : u.bn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {t('phone_number')} / ID *
                </label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-organic-dark/30 group-focus-within:text-organic-green transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="organic-input pl-14 text-sm font-semibold"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {t('email_placeholder')} ({i18n.language === 'en' ? 'Optional' : 'ঐচ্ছিক'})
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-organic-dark/30 group-focus-within:text-organic-green transition-colors" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="organic-input pl-14 text-sm font-semibold"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {t('password_placeholder')} *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-organic-dark/30 group-focus-within:text-organic-green transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="organic-input pl-14 text-sm font-semibold"
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
                  className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
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
                  className="p-3.5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-xs font-bold"
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
                "organic-btn w-full bg-organic-dark text-white flex items-center justify-center gap-3 shadow-xl hover:bg-black py-4",
                loading && "opacity-70 pointer-events-none"
              )}
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={18} />}
              <span className="text-sm font-black uppercase tracking-wider">{t('register_btn')}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-organic-dark/40 uppercase tracking-widest">
              {t('have_account')}{' '}
              <Link to="/login" className="text-organic-green hover:underline font-black ml-1">
                {t('login_btn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

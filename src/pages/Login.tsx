import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { safeLocalStorage } from '../lib/storage';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  React.useEffect(() => {
    // Check if already logged in
    const authToken = safeLocalStorage.getItem('authToken');
    if (authToken) {
      navigate('/');
    }
  }, [navigate]);

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
        setError(data.error || 'Login failed');
        return;
      }

      // Store token and user info
      safeLocalStorage.setItem('authToken', data.token);
      safeLocalStorage.setItem('user', JSON.stringify(data.user));
      safeLocalStorage.setItem('loginMethod', 'mongodb');
      if (data.user.role === 'admin') {
        safeLocalStorage.setItem('isAdmin', 'true');
      }

      setSuccess('✅ Login successful! Redirecting...');

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FDFCFB] selection:bg-organic-green selection:text-white">
      {/* Visual Panel */}
      <div className="hidden lg:flex relative bg-organic-dark overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854" 
            alt="Organic Farm" 
            className="w-full h-full object-cover opacity-10 transition-transform duration-[20s] hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-organic-dark via-organic-dark/95 to-transparent" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-organic-green/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-16">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 text-organic-accent text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl"
            >
              <div className="w-2.5 h-2.5 bg-organic-accent rounded-full animate-pulse shadow-[0_0_15px_#FFC107]" />
              <span className="opacity-80">Smart Agriculture Platform</span>
            </motion.div>
            
            <h1 className="text-7xl sm:text-[100px] font-black leading-[0.85] tracking-tighter uppercase">
              <div className="text-white">
                GROW WITH <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-organic-green via-emerald-400 to-teal-300 drop-shadow-2xl">
                  CONFIDENCE
                </span>
              </div>
            </h1>
            
            <div className="flex flex-col gap-4 mt-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-[2px] bg-gradient-to-r from-organic-green to-transparent" />
                <p className="text-xl text-white/40 leading-relaxed font-black uppercase tracking-[0.3em]">
                  কৃষকের প্রকৃত বন্ধু
                </p>
              </div>
              <p className="text-[10px] text-organic-green font-black uppercase tracking-[0.5em] ml-24 opacity-60">
                KRISHI BONDHU
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8 sm:p-16 lg:p-24 relative overflow-hidden">
        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-organic-dark">
              {t('login_title')}
            </h2>
            <p className="text-sm font-bold text-organic-dark/40 uppercase tracking-widest">
              {t('login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleMongoLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {t('email_placeholder')}
                </label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="organic-input pl-16 text-lg"
                    placeholder={t('email_placeholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {t('password_placeholder')}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="organic-input pl-16 text-lg"
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
                  className="p-4 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-3 text-red-600 text-xs font-bold"
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
                  className="p-4 bg-green-50 border border-green-100 rounded-3xl flex items-center gap-3 text-green-600 text-xs font-bold"
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
                "organic-btn w-full bg-organic-dark text-white flex items-center justify-center gap-3 shadow-2xl hover:bg-black",
                loading && "opacity-70 pointer-events-none"
              )}
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              <span className="text-xl uppercase tracking-tighter">{t('login_btn')}</span>
            </button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm font-bold text-organic-dark/40 uppercase tracking-widest">
              {t('no_account')} 
              <Link to="/register" className="text-organic-green hover:underline ml-2">{t('register')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

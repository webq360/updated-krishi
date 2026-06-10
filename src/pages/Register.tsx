import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Lock, AlertCircle, Loader2, Wheat, Chrome, Globe, Sprout, Building, ChevronRight, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: BANGLADESH_DISTRICTS[0].en,
    upazila: (DISTRICT_UPAZILAS[BANGLADESH_DISTRICTS[0].en]?.[0]?.en) || '',
    phone: '',
    email: '',
    password: ''
  });

  const validateIdentifier = (id: string) => {
    const cleanId = id.trim().replace(/\D/g, '');
    return cleanId.length >= 6;
  };

  React.useEffect(() => {
    if (auth.currentUser) navigate('/');
  }, [navigate]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'btn-send-otp', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log("Recaptcha resolved");
        }
      });
    }
  };

  const handleSendOTP = async () => {
    if (!formData.name || !formData.phone || !formData.password) {
      setError(i18n.language === 'en' ? "Please fill name, phone and password" : "নাম, ফোন এবং পাসওয়ার্ড দিন");
      return;
    }

    if (formData.password.length < 6) {
      setError(i18n.language === 'en' ? "Password must be at least 6 digits/characters" : "পাসওয়ার্ড ন্যূনতম ৬ ডিজিট বা অক্ষরের হতে হবে");
      return;
    }

    if (!validateIdentifier(formData.phone)) {
      setError(i18n.language === 'en' ? "Identifier must be at least 6 digits" : "আইডি বা ফোন নম্বর ন্যূনতম ৬ ডিজিটের হতে হবে");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const phoneClean = formData.phone.trim().replace(/\s/g, '');
      const isRealPhone = phoneClean.length >= 11 && (phoneClean.startsWith('01') || phoneClean.startsWith('+8801'));

      // 1. Check if user already exists
      const userQuery = query(collection(db, 'users'), where('phone', '==', phoneClean));
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        throw new Error(i18n.language === 'en' ? "User already registered with this ID/Phone" : "এই আইডি বা ফোন নম্বর দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে");
      }

      if (isRealPhone) {
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const formattedPhone = phoneClean.startsWith('+88') ? phoneClean : `+88${phoneClean}`;
        
        const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(result);
        setStep('otp');
      } else {
        // ID Based Flow - Transition to OTP step but use fixed OTP for simulation or direct creation
        setStep('otp');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
         setError(i18n.language === 'en' 
           ? "Phone OTP is not enabled for this project. Please contact support or use password registration." 
           : "এই প্রকল্পের জন্য ফোন ওটিপি সক্রিয় করা হয়নি। অনুগ্রহ করে পাসওয়ার্ড রেজিস্ট্রেশন ব্যবহার করুন।");
      } else {
         setError(err.message || "Failed to send OTP. Please try again.");
      }
      
      // Fallback for simulation in restricted environments
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/network-request-failed') {
        setError("Firebase Phone Auth not enabled in console. Simulating OTP (123456)...");
        setStep('otp');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setLoading(true);
    setError('');
    try {
      let finalUser: any = null;
      
      // 1. Verify OTP
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        finalUser = result.user;
      } else if (otp === '123456' || formData.phone.length >= 6) { // Simulation or ID flow fallback
        const phoneClean = formData.phone.trim().replace(/\s/g, '');
        const emailToUse = formData.email.trim() || `${phoneClean}@absfeed.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, formData.password);
        finalUser = userCredential.user;
      } else {
        throw new Error(t('invalid_otp'));
      }

      // 2. Create profile in Firestore
      const isAdminEmail = ['admin@farmexagro.com', 'absfeed.info@gmail.com', 'admin@absfeed.com'].includes(formData.email.trim().toLowerCase());
      
      await setDoc(doc(db, 'users', finalUser.uid), {
        name: formData.name,
        address: formData.address,
        upazila: formData.upazila,
        phone: formData.phone,
        email: formData.email,
        password: formData.password, // Stored for admin seed as requested
        provider: confirmationResult ? 'phone' : 'password',
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const emailToUse = userCredential.user.email || '';
      const isAdminEmail = ['admin@farmexagro.com', 'absfeed.info@gmail.com', 'admin@absfeed.com'].includes(emailToUse.toLowerCase());
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userCredential.user.displayName || 'Google User',
        address: '',
        upazila: '',
        phone: '',
        email: emailToUse,
        provider: 'google',
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp()
      }, { merge: true });
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError(i18n.language === 'en' 
          ? "Google Login is not enabled for this project. Please contact support or use another method."
          : "এই প্রকল্পের জন্য গুগল লগইন সক্রিয় করা হয়নি। অনুগ্রহ করে অন্য পদ্ধতি ব্যবহার করুন।");
      } else {
        setError("Google Login failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const phoneClean = formData.phone.trim().replace(/\s/g, '');
      const emailToUse = formData.email.trim() || `${phoneClean}@farmexagro.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, formData.password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        address: formData.address,
        upazila: formData.upazila,
        phone: formData.phone,
        email: formData.email,
        provider: 'password',
        role: 'user',
        createdAt: serverTimestamp()
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Registration failed.");
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 flex items-center justify-center shadow-2xl"
          >
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </motion.div>
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
          <div className="flex gap-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-organic-dark bg-gray-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="" />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-white font-black text-lg leading-none">100K+</span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Farmers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 md:p-20 overflow-y-auto no-scrollbar">
        <div className="w-full max-w-[550px] space-y-12">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg">
                <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <span className="text-2xl font-black text-organic-dark tracking-tighter font-display">{t('app_name')}</span>
            </Link>
            <button 
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 px-4 py-2 bg-organic-light rounded-full text-[10px] font-black uppercase tracking-widest text-organic-dark hover:bg-organic-green hover:text-white transition-all shadow-sm"
            >
              <Globe size={14} />
              <span>{i18n.language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-organic-dark tracking-tighter uppercase">
              {step === 'details' ? t('registration') : t('enter_otp')}
            </h2>
            {step === 'otp' && (
              <p className="text-xs font-bold text-organic-green uppercase tracking-widest">{t('otp_sent')}</p>
            )}
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 'details' ? (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('full_name')}</label>
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                        <input
                          type="text" required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="organic-input pl-16"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                        {i18n.language === 'en' ? 'Phone or ID' : 'ফোন বা আইডি'}
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                        <input
                          type="text" required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="organic-input pl-16"
                          placeholder={i18n.language === 'en' ? "e.g. 123456" : "যেমন: ১২৩৪৫৬"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('address_placeholder')}</label>
                      <div className="relative group">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                        <select
                          required
                          value={formData.address}
                          onChange={(e) => {
                            const newDistrict = e.target.value;
                            const firstUpazila = DISTRICT_UPAZILAS[newDistrict]?.[0]?.en || '';
                            setFormData({...formData, address: newDistrict, upazila: firstUpazila});
                          }}
                          className="organic-input pl-16 appearance-none cursor-pointer"
                        >
                          {BANGLADESH_DISTRICTS.map(district => (
                            <option key={district.en} value={district.en}>
                              {i18n.language === 'en' ? district.en : district.bn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">Upazila</label>
                      <div className="relative group">
                        <Building className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                        <select
                          required
                          value={formData.upazila}
                          onChange={(e) => setFormData({...formData, upazila: e.target.value})}
                          className="organic-input pl-16 appearance-none cursor-pointer"
                        >
                          {(DISTRICT_UPAZILAS[formData.address] || []).map(u => (
                            <option key={u.en} value={u.en}>{i18n.language === 'en' ? u.en : u.bn}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('email_optional')}</label>
                      <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="organic-input pl-16"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('password_placeholder')}</label>
                      <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                        <input
                          type="password" required
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="organic-input pl-16"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-send-otp"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full py-6 bg-organic-dark text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 uppercase tracking-widest group"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}
                    <span>{t('send_otp')}</span>
                    <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-organic-light" /></div>
                    <div className="relative flex justify-center"><span className="bg-[#FDFCFB] px-4 text-[10px] font-black text-organic-dark/20 tracking-[0.3em] uppercase">{t('or')}</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading || googleLoading}
                    className="organic-btn w-full bg-white border border-organic-light text-organic-dark shadow-sm hover:bg-organic-light flex items-center justify-center gap-4 transition-all"
                  >
                    {googleLoading ? <Loader2 className="animate-spin text-organic-green" /> : <Chrome className="text-organic-green" size={24} />}
                    <span className="text-lg uppercase tracking-widest">{t('login_google')}</span>
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-sm font-bold text-organic-dark/40 uppercase tracking-widest">
                      {t('already_account')}{' '}
                      <Link to="/login" className="text-organic-green hover:underline ml-2">{t('login_btn')}</Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 bg-organic-light rounded-full flex items-center justify-center text-organic-green border-4 border-white shadow-inner">
                      <Key size={32} />
                    </div>
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40">{t('enter_otp')}</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        autoFocus
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-5xl font-black text-center tracking-[0.5em] bg-transparent border-b-4 border-organic-green/20 focus:border-organic-green outline-none py-4 transition-colors"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleVerifyAndRegister}
                      disabled={loading || otp.length < 6}
                      className="w-full py-6 bg-organic-dark text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest group disabled:opacity-50 disabled:grayscale"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}
                      <span>{t('verify_otp')}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="w-full py-4 text-organic-dark/40 font-black text-xs uppercase tracking-widest hover:text-organic-dark transition-colors"
                    >
                      {i18n.language === 'en' ? 'Edit Details' : 'তথ্য পরিবর্তন করুন'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MapPin, Phone, User, Building, 
  ArrowRight, CheckCircle2, AlertCircle, Loader2,
  Store, Briefcase, Info, BadgePercent, Zap, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/db';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { cn } from '../lib/utils';

export default function AgentRegistration() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState({ nidFront: false, nidBack: false });

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: BANGLADESH_DISTRICTS[0].en,
    upazila: DISTRICT_UPAZILAS[BANGLADESH_DISTRICTS[0].en]?.[0]?.en || '',
    shopName: '',
    shopAddress: '',
    experience: '',
    agentType: 'Individual',
    notes: '',
    nidFront: null as string | null,
    nidBack: null as string | null
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'nidFront' | 'nidBack') => {
    const file = e.target.files?.[0];
    if (file) {
      setVerifying(prev => ({ ...prev, [field]: true }));
      try {
        const { uploadToCloudinary } = await import('../lib/imageUtils');
        const uploadedUrl = await uploadToCloudinary(file, 'krishi-agents');
        setFormData(prev => ({ ...prev, [field]: uploadedUrl }));
      } catch (err) {
        console.error("Agent upload error", err);
      } finally {
        setVerifying(prev => ({ ...prev, [field]: false }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const user = auth.currentUser;
    const uid = user?.id || user?.uid || user?._id || 'anonymous';
    const email = user?.email || 'anonymous';

    try {
      await addDoc(collection(db, 'agentApplications'), {
        ...formData,
        userId: uid,
        userEmail: email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'agentApplications');
      setError(i18n.language === 'en' ? 'Failed to submit application. Please try again.' : 'আবেদন জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[4rem] shadow-2xl border border-organic-green/10 text-center max-w-lg space-y-8"
        >
          <div className="w-24 h-24 bg-organic-green/10 rounded-[2.5rem] flex items-center justify-center text-organic-green mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-organic-dark tracking-tighter uppercase">
              {i18n.language === 'en' ? 'Application Received!' : 'আবেদন গ্রহণ করা হয়েছে!'}
            </h2>
            <p className="text-organic-dark/60 font-medium leading-relaxed">
              {i18n.language === 'en' 
                ? 'Thank you for applying to be a Krishi Bondhu Agent. Our team will review your application and contact you soon.' 
                : 'কৃষিবন্ধু এজেন্ট হওয়ার জন্য আবেদন করার ধন্যবাদ। আমাদের টিম আপনার আবেদন পর্যালোচনা করবে এবং শীঘ্রই আপনার সাথে যোগাযোগ করবে।'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="organic-btn bg-organic-dark text-white w-full py-5 rounded-[2rem] text-xl uppercase tracking-tighter"
          >
            {t('home')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <header className="relative overflow-hidden bg-organic-dark rounded-[4rem] p-12 sm:p-20 text-white shadow-2xl flex flex-col items-center text-center">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1556155092-490a1ba16284" 
            alt="Agent" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 space-y-8 flex flex-col items-center max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-organic-green/20 backdrop-blur-md rounded-full border border-organic-green/30 text-organic-green text-[10px] font-black uppercase tracking-[0.2em]">
              <BadgePercent size={16} />
              {t('agent_registration')}
            </div>
            <Link to="/agent-login" className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-all">
              <ArrowRight size={16} />
              {t('agent_login')}
            </Link>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
            {i18n.language === 'en' ? (<>BECOME A <span className="text-organic-green">BONDHU AGENT</span></>) : (<>কৃষিবন্ধু <span className="text-organic-green">এজেন্ট হোন</span></>)}
          </h1>
          <p className="text-xl text-green-50/60 leading-relaxed font-medium">
            {t('agent_registration_desc')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-organic-green/5 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('full_name')}</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="organic-input pl-16"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('phone_number')}</label>
                <div className="relative group">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="tel" required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="organic-input pl-16"
                    placeholder="01711000000"
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
                      const dist = e.target.value;
                      setFormData({...formData, address: dist, upazila: DISTRICT_UPAZILAS[dist]?.[0]?.en || ''});
                    }}
                    className="organic-input pl-16 appearance-none"
                  >
                    {BANGLADESH_DISTRICTS.map(d => (
                      <option key={d.en} value={d.en}>{i18n.language === 'en' ? d.en : d.bn}</option>
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
                    className="organic-input pl-16 appearance-none"
                  >
                    {(DISTRICT_UPAZILAS[formData.address] || []).map(u => (
                      <option key={u.en} value={u.en}>{i18n.language === 'en' ? u.en : u.bn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">
                  {i18n.language === 'en' ? 'NID Card Identification' : 'জাতীয় পরিচয়পত্র'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-organic-dark/60 uppercase ml-4">{i18n.language === 'en' ? 'NID Front (সামনের অংশ)' : 'এনআইডি সামনের অংশ'}</p>
                    <label className="relative flex flex-col items-center justify-center h-48 bg-organic-light/50 border-2 border-dashed border-organic-green/20 rounded-[2rem] hover:bg-white hover:border-organic-green transition-all cursor-pointer overflow-hidden group">
                      {verifying.nidFront ? (
                        <div className="flex flex-col items-center gap-3 text-organic-green animate-pulse">
                          <Loader2 className="animate-spin" size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                        </div>
                      ) : formData.nidFront ? (
                        <>
                          <img src={formData.nidFront} alt="NID Front" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          <div className="relative z-10 flex flex-col items-center gap-2 text-organic-green">
                             <CheckCircle2 size={32} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'আপলোড হয়েছে'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-organic-dark/40 group-hover:text-organic-green">
                          <Zap size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Upload Front' : 'সামনের ছবি'}</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'nidFront')} disabled={verifying.nidFront} />
                    </label>
                  </div>
 
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-organic-dark/60 uppercase ml-4">{i18n.language === 'en' ? 'NID Back (পিছনের অংশ)' : 'এনআইডি পিছনের অংশ'}</p>
                    <label className="relative flex flex-col items-center justify-center h-48 bg-organic-light/50 border-2 border-dashed border-organic-green/20 rounded-[2rem] hover:bg-white hover:border-organic-green transition-all cursor-pointer overflow-hidden group">
                      {verifying.nidBack ? (
                        <div className="flex flex-col items-center gap-3 text-organic-green animate-pulse">
                          <Loader2 className="animate-spin" size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                        </div>
                      ) : formData.nidBack ? (
                        <>
                          <img src={formData.nidBack} alt="NID Back" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          <div className="relative z-10 flex flex-col items-center gap-2 text-organic-green">
                             <CheckCircle2 size={32} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'আপলোড হয়েছে'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-organic-dark/40 group-hover:text-organic-green">
                          <Zap size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Upload Back' : 'পিছনের ছবি'}</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'nidBack')} disabled={verifying.nidBack} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('shop_name')}</label>
                <div className="relative group">
                  <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="text" required
                    value={formData.shopName}
                    onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                    className="organic-input pl-16"
                    placeholder="M/S Business Name"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('shop_address')}</label>
                <div className="relative group">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="text" required
                    value={formData.shopAddress}
                    onChange={(e) => setFormData({...formData, shopAddress: e.target.value})}
                    className="organic-input pl-16"
                    placeholder="Market Name, Road No..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('agent_type')}</label>
                <div className="relative group">
                  <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <select
                    required
                    value={formData.agentType}
                    onChange={(e) => setFormData({...formData, agentType: e.target.value})}
                    className="organic-input pl-16 appearance-none"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Business/Firm">Business/Firm</option>
                    <option value="NGO">NGO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{i18n.language === 'en' ? 'Farming Experience' : 'কৃষি কাজের অভিজ্ঞতা'}</label>
                <div className="relative group">
                  <Info className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="organic-input pl-16"
                    placeholder="e.g. 5 Years"
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
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "organic-btn w-full bg-organic-dark text-white shadow-2xl flex items-center justify-center gap-3",
                loading && "opacity-70 pointer-events-none"
              )}
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              <span className="text-xl uppercase tracking-tighter">{t('apply_now')}</span>
            </button>
          </form>
        </div>

        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-organic-green/10 shadow-xl space-y-6">
            <h3 className="text-2xl font-black text-organic-dark tracking-tighter uppercase">{i18n.language === 'en' ? 'Benefits' : 'সুবিধাসমূহ'}</h3>
            <ul className="space-y-4">
              {[
                { en: 'Attractive Commission', bn: 'আকর্ষণীয় কমিশন' },
                { en: 'Professional Training', bn: 'পেশাদার প্রশিক্ষণ' },
                { en: 'Digital Dashboard', bn: 'ডিজিটাল ড্যাশবোর্ড' },
                { en: 'Marketing Support', bn: 'মার্কেটিং সহায়তা' },
                { en: 'Organic Export Training', bn: 'অর্গানিক রপ্তানি প্রশিক্ষণ' },
                { en: 'GlobalGAP Certification', bn: 'GlobalGAP সার্টিফিকেট' }
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold text-organic-dark/60 uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-xl bg-organic-green/10 flex items-center justify-center text-organic-green">
                    <CheckCircle2 size={16} />
                  </div>
                  {i18n.language === 'en' ? benefit.en : benefit.bn}
                </li>
              ))}
            </ul>
          </div>

          <a 
            href="tel:09638201586"
            className="block h-full transition-all active:scale-95 group"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-organic-dark to-green-950 p-10 rounded-[4rem] text-white shadow-2xl shadow-organic-green/20 space-y-6 h-full group hover:shadow-organic-green/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-organic-green/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 group-hover:bg-organic-green transition-colors">
                  <Phone size={32} className="group-hover:rotate-12 transition-transform" />
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-organic-green rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{i18n.language === 'en' ? 'Live Now' : 'লাইভ সাপোর্ট'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] opacity-40">{t('hotline')}</h4>
                <p className="text-4xl font-black tracking-tighter hover:text-organic-green transition-colors">09638-201586</p>
                <div className="h-px bg-white/10 w-full" />
              </div>
            </div>
          </a>
        </div>
      </div>

      <footer className="mt-20 border-t border-organic-green/10 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-organic-dark to-green-950 rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl flex flex-col sm:flex-row items-center gap-8 group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-organic-green/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
              <div className="absolute inset-0 bg-organic-green rounded-full opacity-20 animate-ping" />
              <Users size={48} className="text-organic-green sm:size-64" />
            </div>
            <div className="flex-grow space-y-4 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-[10px] font-black uppercase tracking-widest">
                <Zap size={14} className="animate-pulse" />
                Premium Support
              </div>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                {i18n.language === 'en' ? 'AGENT HOTLINE' : 'এজেন্ট হটলাইন'}
              </h3>
              <p className="text-xs sm:text-sm text-green-50/70 font-medium max-w-sm">
                {i18n.language === 'en' 
                  ? 'Exclusive support channel for Krishi Bondhu agents. Get instant help with applications.' 
                  : 'কৃষিবন্ধু এজেন্টদের জন্য বিশেষ সহায়তা চ্যানেল। আবেদনের ব্যাপারে তাৎক্ষণিক সহায়তা পান।'}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <a 
                  href="tel:09638201586"
                  className="group/btn relative px-8 py-4 bg-white text-organic-dark rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-organic-green hover:text-white transition-all shadow-xl active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-organic-green translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <Phone size={18} className="relative z-10 animate-shake" />
                  <span className="relative z-10">09638-201586</span>
                </a>
              </div>
            </div>
          </motion.div>

          <div className="p-10 bg-white rounded-[3rem] border border-organic-green/10 shadow-xl space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-organic-green">
                <Mail size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Email Support</span>
              </div>
              <a href="mailto:absfeed.info@gmail.com" className="block text-sm font-bold text-organic-dark hover:text-organic-green transition-colors">
                absfeed.info@gmail.com
              </a>
            </div>
            <div className="pt-6 border-t border-gray-100">
              <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-organic-dark/40 hover:text-organic-green transition-colors">
                About Krishi Bondhu
              </Link>
            </div>
          </div>
        </div>

        <p className="text-[8px] font-bold text-organic-dark/20 uppercase tracking-widest text-center mt-12 mb-8">
          © {new Date().getFullYear()} KRISHI BONDHU AGENT NETWORK
        </p>
      </footer>
    </div>
  );
}

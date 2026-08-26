import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Plus, Search, Snowflake, Database, Info, CheckCircle2, FileImage, Image as ImageIcon, CreditCard, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { db, auth, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from '../lib/db';
import { cn } from '../lib/utils';

import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';

export default function ColdStorage() {
  const { i18n } = useTranslation();
  const [adType, setAdType] = useState<'free' | 'paid'>('free');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [storageImage, setStorageImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState({ front: false, back: false, storage: false });
  const [isPosting, setIsPosting] = useState(false);
  const [storages, setStorages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [form, setForm] = useState({
    name: '',
    location: '',
    phone: '',
    capacity: '',
    availableSpace: '',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: '',
    agentId: ''
  });

  const AD_CHARGE = 50;
  const PAYMENT_NUMBER = '+8801634-651943';

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back' | 'storage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCompressing(prev => ({ ...prev, [side]: true }));
    try {
      const url = await uploadToCloudinary(file, side === 'storage' ? 'krishi-storage' : 'krishi-nid');
      if (side === 'front') setNidFront(url);
      else if (side === 'back') setNidBack(url);
      else setStorageImage(url);
    } catch (err) {
      console.error("ColdStorage upload error:", err);
    } finally {
      setIsCompressing(prev => ({ ...prev, [side]: false }));
    }
  };

  const currentUpazilas = DISTRICT_UPAZILAS[form.district] || [];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, district: e.target.value, upazila: '' });
  };

  useEffect(() => {
    const q = query(collection(db, 'coldStorage'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStorages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert(i18n.language === 'en' ? 'Please login to post' : 'পোস্ট করতে লগইন করুন');
      return;
    }

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of NID' : 'অনুগ্রহ করে এনআইডির সামনের ও পিছনের ছবি আপলোড করুন');
      return;
    }

    if (adType === 'paid') {
      setShowPaymentModal(true);
    } else {
      await processSubmission(false);
    }
  };

  const processSubmission = async (isPaid: boolean) => {
    try {
      await addDoc(collection(db, 'coldStorage'), {
        ...form,
        nidFront,
        nidBack,
        storageImage,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        isPaid,
        adType
      });
      setIsPosting(false);
      setShowPaymentModal(false);
      setNidFront(null);
      setNidBack(null);
      setStorageImage(null);
      setForm({
        name: '',
        location: '',
        phone: '',
        capacity: '',
        availableSpace: '',
        district: BANGLADESH_DISTRICTS[0].en,
        upazila: '',
        agentId: ''
      });
      alert(i18n.language === 'en' ? 'Storage listed successfully!' : 'হিমাগার সফলভাবে যুক্ত হয়েছে!');
    } catch (err) {
      console.error("Post error", err);
    }
  };

  const filteredStorages = storages
    .sort((a, b) => {
      if (a.isPaid && !b.isPaid) return -1;
      if (!a.isPaid && b.isPaid) return 1;
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    })
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistrict = selectedDistrict === 'All' || s.district === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="bg-[#1B301B] rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden flex flex-col items-center text-center mx-auto shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/10">
            <Snowflake size={18} className="text-[#4CAF50]" />
            {i18n.language === 'en' ? 'Storage Locator' : 'হিমাগার লোকেটর'}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Cold Storage' : 'শীতলীকরণ কেন্দ্র'}
          </h1>
          <p className="text-gray-300 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Find or list cold storage facilities to preserve your crops and reduce wastage.' 
              : 'ফসল সংরক্ষণ এবং অপচয় রোধে আপনার নিকটস্থ হিমাগার খুঁজুন অথবা আপনার হিমাগার তালিকাভুক্ত করুন।'}
          </p>
        </div>
        <Database className="absolute -bottom-16 -right-16 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-[#E0E8E0] shadow-xl">
        <div className="flex flex-wrap gap-4 w-full md:w-auto flex-1">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
            <input 
              type="text"
              placeholder={i18n.language === 'en' ? "Search city or storage name..." : "শহর বা হিমাগারের নাম খুঁজুন..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-4 rounded-2xl border-2 border-[#F0F5F0] focus:border-[#4CAF50] outline-none transition-all font-medium"
            />
          </div>
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-8 py-4 rounded-2xl border-2 border-[#F0F5F0] focus:border-[#4CAF50] outline-none font-black text-xs uppercase tracking-widest bg-white"
          >
            <option value="All">{i18n.language === 'en' ? 'All Districts' : 'সকল জেলা'}</option>
            {BANGLADESH_DISTRICTS.map(district => (
              <option key={district.en} value={district.en}>
                {i18n.language === 'en' ? district.en : district.bn}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="w-full md:w-auto px-10 py-4 bg-[#4CAF50] text-white rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-[#2E7D32] hover:-translate-y-1 transition-all shadow-xl shadow-green-900/10"
        >
          <Plus size={20} />
          {i18n.language === 'en' ? 'List Your Storage' : 'হিমাগার যুক্ত করুন'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStorages.map((s) => (
          <motion.div 
            key={s.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white overflow-hidden rounded-[3rem] border border-[#E0E8E0] shadow-sm hover:shadow-2xl transition-all flex flex-col group"
          >
            {s.storageImage ? (
              <div className="w-full h-48 relative overflow-hidden">
                <img src={s.storageImage} alt={s.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                   {s.isPaid && (
                    <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-500">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-10 pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F0F5F0] rounded-[1.5rem] flex items-center justify-center text-[#4CAF50] group-hover:scale-110 transition-transform">
                      <Snowflake size={32} />
                    </div>
                    {s.isPaid && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-200">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="px-5 py-1.5 bg-organic-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    {s.district}
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-10 flex-1 flex flex-col pt-6">
              {!s.storageImage && <div className="hidden" />}
              <div className="text-center sm:text-left mb-6">
                <h3 className="text-2xl font-black text-[#1B301B] uppercase tracking-tight leading-none mb-3">{s.name}</h3>
                {s.storageImage && (
                   <span className="inline-block px-3 py-1 bg-organic-dark/5 text-organic-dark rounded-full text-[8px] font-black uppercase tracking-widest mb-2">
                    {s.district}
                  </span>
                )}
                <p className="text-[#556B55] flex items-center justify-center sm:justify-start gap-2 text-sm font-medium">
                  <MapPin size={16} className="text-[#4CAF50]" /> {s.location}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 py-8 border-y border-[#F0F5F0] text-center mt-auto">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#8BA88B]">Total Capacity</p>
                <p className="font-black text-xl text-[#1B301B]">{s.capacity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#8BA88B]">Available Space</p>
                <p className="font-black text-xl text-[#4CAF50]">{s.availableSpace}</p>
              </div>
            </div>
            <a 
              href={`tel:${s.phone}`}
              className="w-full py-5 bg-organic-dark text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#4CAF50] transition-colors shadow-lg"
            >
              <Phone size={18} />
              {s.phone}
            </a>
          </div>
        </motion.div>
        ))}
      </div>

      {isPosting && (
        <div className="fixed inset-0 bg-[#0B1E0B]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 pb-0 flex items-center justify-between">
              <h2 className="text-3xl font-black text-[#1B301B] uppercase tracking-tight">
                {i18n.language === 'en' ? 'Add Storage Info' : 'হিমাগার তথ্য যোগ করুন'}
              </h2>
              <button 
                onClick={() => setIsPosting(false)}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6">
                <div className="sm:col-span-2 space-y-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-organic-dark uppercase tracking-[0.2em] ml-2">Ad Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAdType('free')}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                          adType === 'free' 
                            ? "bg-white border-organic-green text-organic-green shadow-xl shadow-organic-green/10" 
                            : "bg-gray-50 border-transparent text-[#8BA88B] opacity-60"
                        )}
                      >
                        Free Listing
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdType('paid')}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                          adType === 'paid' 
                            ? "bg-white border-organic-dark text-organic-dark shadow-xl shadow-black/10" 
                            : "bg-gray-50 border-transparent text-[#8BA88B] opacity-60"
                        )}
                      >
                        Featured Ad (৳50)
                      </button>
                    </div>
                    <div className="p-4 bg-organic-light/50 rounded-2xl border border-organic-green/10">
                      <p className="text-[10px] font-bold text-organic-dark/60 leading-relaxed uppercase tracking-tight">
                        <Info size={12} className="inline mr-2 text-organic-green" />
                        {adType === 'paid' 
                          ? (i18n.language === 'en' ? 'Paid ads appear at the top and send notifications to all users for maximum reach.' : 'পেইড বিজ্ঞাপনে আপনার হিমাগার সবার উপরে থাকবে এবং সব ইউজার নোটিফিকেশন পাবে।')
                          : (i18n.language === 'en' ? 'Free ads appear below paid ones. Notifications are not available for free ads.' : 'ফ্রি বিজ্ঞাপন তালিকার নিচে থাকবে। নোটিফিকেশন সুবিধা ফ্রি বিজ্ঞাপনে নেই।')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Storage Name</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="organic-input py-4 text-base" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">District</label>
                  <select value={form.district} onChange={handleDistrictChange} className="organic-input py-4 text-base appearance-none">
                    {BANGLADESH_DISTRICTS.map(district => (
                      <option key={district.en} value={district.en}>
                        {i18n.language === 'en' ? district.en : district.bn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Upazila</label>
                  <select 
                    required
                    value={form.upazila} 
                    onChange={e => setForm({...form, upazila: e.target.value})} 
                    className="organic-input py-4 text-base appearance-none"
                  >
                    <option value="">{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা'}</option>
                    {currentUpazilas.map(u => (
                      <option key={u.en} value={u.en}>
                        {i18n.language === 'en' ? u.en : u.bn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Agent ID (Optional)</label>
                  <input 
                    value={form.agentId} 
                    onChange={e => setForm({...form, agentId: e.target.value})} 
                    className="organic-input py-4 text-base" 
                    placeholder="e.g. 1001"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">NID Card Verification</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleNidUpload(e, 'front')}
                        className="hidden" 
                        id="cold-nid-front-upload"
                      />
                      <label 
                        htmlFor="cold-nid-front-upload"
                        className={cn(
                          "w-full px-6 py-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden",
                          isCompressing.front ? "border-organic-green animate-pulse" : nidFront ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green"
                        )}
                      >
                        {isCompressing.front ? (
                          <div className="w-8 h-8 border-4 border-t-transparent border-organic-green rounded-full animate-spin" />
                        ) : nidFront ? (
                          <img src={nidFront} alt="Front" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="text-[#8BA88B]" size={24} />
                            <span className="text-[10px] font-bold uppercase">{i18n.language === 'en' ? 'Front Side' : 'সামনের ছবি'}</span>
                          </>
                        )}
                      </label>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleNidUpload(e, 'back')}
                        className="hidden" 
                        id="cold-nid-back-upload"
                      />
                      <label 
                        htmlFor="cold-nid-back-upload"
                        className={cn(
                          "w-full px-6 py-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden",
                          isCompressing.back ? "border-organic-green animate-pulse" : nidBack ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green"
                        )}
                      >
                        {isCompressing.back ? (
                          <div className="w-8 h-8 border-4 border-t-transparent border-organic-green rounded-full animate-spin" />
                        ) : nidBack ? (
                          <img src={nidBack} alt="Back" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="text-[#8BA88B]" size={24} />
                            <span className="text-[10px] font-bold uppercase">{i18n.language === 'en' ? 'Back Side' : 'পিছনের ছবি'}</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Precise Location Info</label>
                  <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="organic-input py-4 text-base" placeholder="Near Rail Station, Bazar Road..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Active Contact</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="organic-input py-4 text-base" placeholder="017xxxxxxxx" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Total Storage Capacity</label>
                  <input required value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="organic-input py-4 text-base" placeholder="5000 MT" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#556B55] uppercase tracking-widest ml-4">Current Available Space</label>
                  <input required value={form.availableSpace} onChange={e => setForm({...form, availableSpace: e.target.value})} className="organic-input py-4 text-base" placeholder="200 MT" />
                </div>

                {adType === 'paid' && (
                   <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-4 font-black">Storage Photos (Paid Only)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleNidUpload(e, 'storage')}
                        className="hidden" 
                        id="cold-storage-photo-upload"
                      />
                      <label 
                        htmlFor="cold-storage-photo-upload"
                        className={cn(
                          "w-full px-6 py-12 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden",
                          isCompressing.storage ? "border-amber-400 animate-pulse" : storageImage ? "border-amber-400 bg-amber-50" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-amber-400"
                        )}
                      >
                        {isCompressing.storage ? (
                          <div className="w-8 h-8 border-4 border-t-transparent border-amber-500 rounded-full animate-spin" />
                        ) : storageImage ? (
                          <img src={storageImage} alt="Storage" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <>
                            <ImageIcon className="text-amber-500" size={32} />
                            <span className="text-[10px] font-bold uppercase text-amber-700">{i18n.language === 'en' ? 'Upload Facility Photo' : 'হিমাগারের ছবি আপলোড করুন'}</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <button type="submit" className="sm:col-span-2 mt-8 py-5 bg-organic-dark text-white rounded-[2rem] font-black text-lg uppercase tracking-tight hover:bg-black transition-all shadow-2xl active:scale-95">
                  {adType === 'paid' ? 'Continue to Payment' : 'Confirm Listing'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-[#0B1E0B]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl overflow-hidden text-center"
            >
              <div className="w-20 h-20 bg-organic-green/10 text-organic-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <CreditCard size={40} />
              </div>
              <h2 className="text-3xl font-black text-[#1B301B] uppercase tracking-tight mb-4">Ad Payment</h2>
              <p className="text-[#556B55] font-bold mb-8 leading-relaxed">
                Send <b>৳{AD_CHARGE}</b> to our bKash/Nagad Personal number: <br/>
                <span className="text-xl font-black text-organic-green">{PAYMENT_NUMBER}</span>
              </p>
              
              <div className="space-y-4 mb-8">
                <input 
                  type="text" 
                  placeholder="Transaction ID (TrxID)"
                  className="w-full px-6 py-4 bg-[#F9FBF9] border-2 border-[#F0F5F0] rounded-2xl outline-none focus:border-organic-green font-mono"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-organic-dark rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => processSubmission(true)}
                  className="flex-[2] py-4 bg-organic-green text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-900/20"
                >
                  Verify & Post
                </button>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-black text-[#8BA88B] uppercase tracking-widest">
                <ShieldCheck size={12} className="text-organic-green" />
                Trusted Verification Service
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Plus, Search, Tractor, Hammer, Info, CheckCircle2, User, FileImage, Image as ImageIcon, CreditCard, ShieldCheck, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { db, auth, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from '../lib/db';
import { cn } from '../lib/utils';

export default function RentMachine() {
  const { i18n } = useTranslation();
  const [isPosting, setIsPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifying, setVerifying] = useState({ front: false, back: false });
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [machines, setMachines] = useState<any[]>([]);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [machinePic, setMachinePic] = useState<string | null>(null);
  const [form, setForm] = useState({
    machineName: '',
    ownerName: '',
    phone: '',
    rate: '',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: '',
    description: '',
    agentId: ''
  });

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setVerifying(prev => ({ ...prev, [side]: true }));
    try {
      const { uploadToCloudinary } = await import('../lib/imageUtils');
      const url = await uploadToCloudinary(file, 'krishi-machinery');
      if (side === 'front') setNidFront(url);
      else setNidBack(url);
    } catch (err) {
      console.error("Machine NID upload error:", err);
    } finally {
      setVerifying(prev => ({ ...prev, [side]: false }));
    }
  };

  const handleMachinePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { uploadToCloudinary } = await import('../lib/imageUtils');
      const url = await uploadToCloudinary(file, 'krishi-machinery');
      setMachinePic(url);
    } catch (err) {
      console.error("Machine photo upload error:", err);
    }
  };

  const currentUpazilas = DISTRICT_UPAZILAS[form.district] || [];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, district: e.target.value, upazila: '' });
  };

  useEffect(() => {
    const q = query(collection(db, 'rentMachines'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const [paymentStep, setPaymentStep] = useState(false);
  const [adType, setAdType] = useState<'free' | 'paid'>('free');

  const createMachineNotification = async (machine: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title: i18n.language === 'en' ? 'New Machine for Rent!' : 'ভাড়ার জন্য নতুন যন্ত্রপাতি!',
        body: i18n.language === 'en' 
          ? `${machine.machineName} is now available for rent in ${machine.district}. Rate: ${machine.rate}` 
          : `${machine.machineName} এখন ${machine.district}-এ ভাড়ার জন্য পাওয়া যাচ্ছে। রেট: ${machine.rate}`,
        type: 'info',
        userId: 'all',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Machine notification error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert(i18n.language === 'en' ? 'Please login to post' : 'পোস্ট করতে লগইন করুন');
      return;
    }

    if (adType === 'paid') {
      setPaymentStep(true);
    } else {
      // Free listing directly
      try {
        if (!nidFront || !nidBack) {
          alert(i18n.language === 'en' ? 'Please upload both Front and Back of NID' : 'অনুগ্রহ করে এনআইডির সামনের এবং পিছনের উভয় ছবি আপলোড করুন');
          return;
        }
        await addDoc(collection(db, 'rentMachines'), {
          ...form,
          nidFront,
          nidBack,
          machinePic,
          userId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          paymentStatus: 'free',
          paymentAmount: 0,
          isPaid: false
        });
        setIsPosting(false);
        setNidFront(null);
        setNidBack(null);
        setMachinePic(null);
        setForm({
          machineName: '',
          ownerName: '',
          phone: '',
          rate: '',
          district: BANGLADESH_DISTRICTS[0].en,
          upazila: '',
          description: '',
          agentId: ''
        });
        alert(i18n.language === 'en' ? 'Listing posted successfully (Free)!' : 'পোস্টটি সফলভাবে যুক্ত হয়েছে (ফ্রি)!');
      } catch (err) {
        console.error("Post error", err);
      }
    }
  };

  const handleConfirmPayment = async () => {
    try {
      if (!nidFront || !nidBack) {
        alert(i18n.language === 'en' ? 'Please upload both Front and Back of NID' : 'অনুগ্রহ করে এনআইডির সামনের এবং পিছনের উভয় ছবি আপলোড করুন');
        return;
      }
      await addDoc(collection(db, 'rentMachines'), {
        ...form,
        nidFront,
        nidBack,
        machinePic,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        paymentStatus: 'paid',
        paymentAmount: 50,
        isPaid: true
      });

      await createMachineNotification(form);

      setIsPosting(false);
      setPaymentStep(false);
      setNidFront(null);
      setNidBack(null);
      setMachinePic(null);
      setForm({
        machineName: '',
        ownerName: '',
        phone: '',
        rate: '',
        district: BANGLADESH_DISTRICTS[0].en,
        upazila: '',
        description: '',
        agentId: ''
      });
      alert(i18n.language === 'en' ? 'Featured listing posted successfully!' : 'ফিচারড পোস্টটি সফলভাবে যুক্ত হয়েছে!');
    } catch (err) {
      console.error("Post error", err);
    }
  };

  const filteredMachines = machines.filter(m => {
    const matchesSearch = m.machineName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || m.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="bg-[#1B301B] rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/20">
            <Tractor size={18} className="text-[#4CAF50]" />
            {i18n.language === 'en' ? 'Machinery Rental' : 'যন্ত্রপাতি ভাড়া'}
          </div>
          <h1 className="text-[10vw] sm:text-8xl font-black tracking-tight uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Rent-a-Machine' : 'কৃষি যন্ত্রপাতি ভাড়া'}
          </h1>
          <p className="text-gray-300 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Connect with local machine owners to rent tractors, harvesters, and more.' 
              : 'ট্রাক্টর, হারভেস্টার এবং অন্যান্য কৃষি যন্ত্রপাতি ভাড়ার জন্য স্থানীয় মালিকদের সাথে যোগাযোগ করুন।'}
          </p>
        </div>
        <Tractor className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-[#E0E8E0] shadow-sm">
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={18} />
            <input 
              type="text"
              placeholder={i18n.language === 'en' ? "Search machines..." : "যন্ত্রপাতি খুঁজুন..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none"
            />
          </div>
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none font-bold"
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
          className="w-full md:w-auto px-8 py-3 bg-[#4CAF50] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2E7D32] transition-all"
        >
          <Plus size={20} />
          {i18n.language === 'en' ? 'List Your Machine' : 'যন্ত্রপাতি যুক্ত করুন'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map((m) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[2rem] border border-[#E0E8E0] shadow-sm hover:shadow-md transition-all space-y-4"
          >
            {m.machinePic ? (
              <div className="w-full h-40 rounded-2xl overflow-hidden mb-4">
                <img src={m.machinePic} alt={m.machineName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[#F0F5F0] rounded-2xl flex items-center justify-center text-[#4CAF50]">
                  <Tractor size={24} />
                </div>
                <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-xs font-bold">
                  {m.district}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-[#1B301B]">{m.machineName}</h3>
                {m.machinePic && (
                  <span className="px-2 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-lg text-[10px] font-bold">
                    {m.district}
                  </span>
                )}
              </div>
              <p className="text-[#556B55] flex items-center gap-2 text-sm mt-1">
                <User size={14} /> {m.ownerName}
              </p>
            </div>
            <div className="py-4 border-y border-[#F0F5F0]">
              <p className="text-sm text-[#556B55] line-clamp-2">{m.description}</p>
              <p className="mt-2 font-black text-[#2E7D32] text-lg">{m.rate}</p>
            </div>
            <a 
              href={`tel:${m.phone}`}
              className="w-full py-3 bg-[#F0F5F0] text-[#1B301B] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E0E8E0] transition-all"
            >
              <Phone size={18} />
              {m.phone}
            </a>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              {!paymentStep ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-[#1B301B] leading-none mb-1 uppercase tracking-tight">
                        {i18n.language === 'en' ? 'List Machinery' : 'যন্ত্রপাতি লিস্টিং'}
                      </h2>
                      <p className="text-[10px] font-black text-organic-green uppercase tracking-[0.3em]">Fill in the machine details</p>
                    </div>
                    <button 
                      onClick={() => setIsPosting(false)}
                      className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-organic-dark uppercase tracking-[0.2em] ml-1">Ad Type</label>
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
                          Free Ad
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
                            ? (i18n.language === 'en' ? 'Paid ads appear at the top and send notifications to all users for maximum reach.' : 'পেইড বিজ্ঞাপনে আপনার পণ্য সবার উপরে থাকবে এবং সব ইউজার নোটিফিকেশন পাবে।')
                            : (i18n.language === 'en' ? 'Free ads appear below paid ones. Photos and notifications are not available for free ads.' : 'ফ্রি বিজ্ঞাপন তালিকার নিচে থাকবে। ছবি এবং নোটিফিকেশন সুবিধা ফ্রি বিজ্ঞাপনে নেই।')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Machine Name</label>
                      <input required value={form.machineName} onChange={e => setForm({...form, machineName: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green focus:ring-4 focus:ring-organic-green/5 transition-all" placeholder="e.g. Combine Harvester" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">District</label>
                      <select value={form.district} onChange={handleDistrictChange} className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green transition-all font-bold">
                        {BANGLADESH_DISTRICTS.map(district => (
                          <option key={district.en} value={district.en}>
                            {i18n.language === 'en' ? district.en : district.bn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Upazila</label>
                      <select 
                        required
                        value={form.upazila} 
                        onChange={e => setForm({...form, upazila: e.target.value})} 
                        className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green transition-all font-bold"
                      >
                        <option value="">{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন করুন'}</option>
                        {currentUpazilas.map(u => (
                          <option key={u.en} value={u.en}>
                            {i18n.language === 'en' ? u.en : u.bn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Machine Photo */}
                        {adType === 'paid' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Machine Photo</label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleMachinePicUpload}
                                className="hidden" 
                                id="machine-photo-upload"
                              />
                              <label 
                                htmlFor="machine-photo-upload"
                                className={cn(
                                  "w-full aspect-video rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden",
                                  machinePic ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green"
                                )}
                              >
                                {machinePic ? (
                                  <img src={machinePic} alt="Machine preview" className="w-full h-full object-cover" />
                                ) : (
                                  <>
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#8BA88B] shadow-sm">
                                      <ImageIcon size={20} />
                                    </div>
                                    <span className="text-[#556B55] font-black text-[9px] uppercase tracking-widest text-center">
                                      Upload Machine Image
                                    </span>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>
                        )}

                        <div className={cn("space-y-2", adType === 'free' && "sm:col-span-2")}>
                          <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Owner NID Verification</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleNidUpload(e, 'front')}
                                className="hidden" 
                                id="machine-nid-front-upload"
                                disabled={verifying.front}
                              />
                              <label 
                                htmlFor="machine-nid-front-upload"
                                className={cn(
                                  "w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden",
                                  verifying.front ? "border-organic-green animate-pulse" : nidFront ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                                )}
                              >
                                {verifying.front ? (
                                  <div className="flex flex-col items-center gap-1 text-organic-green">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-[7px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই...'}</span>
                                  </div>
                                ) : nidFront ? (
                                  <div className="flex flex-col items-center gap-1 text-organic-green relative z-10">
                                    <CheckCircle2 size={16} />
                                    <span className="font-black text-[7px] uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'সফল'}</span>
                                    <img src={nidFront} alt="Front" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                                  </div>
                                ) : (
                                  <>
                                    <ImageIcon size={16} className="text-[#8BA88B]" />
                                    <span className="text-[8px] font-black uppercase text-[#556B55]">{i18n.language === 'en' ? 'Front' : 'সামনে'}</span>
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
                                id="machine-nid-back-upload"
                                disabled={verifying.back}
                              />
                              <label 
                                htmlFor="machine-nid-back-upload"
                                className={cn(
                                  "w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden",
                                  verifying.back ? "border-organic-green animate-pulse" : nidBack ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                                )}
                              >
                                {verifying.back ? (
                                  <div className="flex flex-col items-center gap-1 text-organic-green">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-[7px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই...'}</span>
                                  </div>
                                ) : nidBack ? (
                                  <div className="flex flex-col items-center gap-1 text-organic-green relative z-10">
                                    <CheckCircle2 size={16} />
                                    <span className="font-black text-[7px] uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'সফল'}</span>
                                    <img src={nidBack} alt="Back" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                                  </div>
                                ) : (
                                  <>
                                    <ImageIcon size={16} className="text-[#8BA88B]" />
                                    <span className="text-[8px] font-black uppercase text-[#556B55]">{i18n.language === 'en' ? 'Back' : 'পেছনে'}</span>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Owner Name</label>
                      <input required value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Phone Number</label>
                      <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green transition-all font-mono" placeholder="01XXX-XXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Rental Rate</label>
                      <input required value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green transition-all font-bold" placeholder="e.g. ৳500 / Hour" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-organic-green uppercase tracking-widest ml-1">Agent ID (Optional)</label>
                      <input 
                        value={form.agentId} 
                        onChange={e => setForm({...form, agentId: e.target.value})} 
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-organic-green/30 outline-none focus:border-organic-green lg:min-h-[60px] transition-all" 
                        placeholder="e.g. 1002"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest ml-1">Short Description</label>
                      <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-[#F9FBF9] border border-[#E0E8E0] outline-none focus:border-organic-green lg:min-h-[120px] transition-all resize-none" placeholder="Experience, machine condition, availability..." />
                    </div>
                    <button type="submit" className="sm:col-span-2 mt-4 py-5 bg-organic-dark text-white rounded-[1.5rem] font-black text-base uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-black/20">
                      {adType === 'paid' 
                        ? (i18n.language === 'en' ? 'Continue to Payment' : 'পেমেন্টে এগিয়ে যান') 
                        : (i18n.language === 'en' ? 'Post Now' : 'এখনই পোস্ট করুন')}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-10 py-10">
                  <div className="relative">
                    <div className="w-24 h-24 bg-organic-green/10 text-organic-green rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-organic-green/5">
                      <CreditCard size={40} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#1B301B] uppercase tracking-tight">Confirm Secure Posting</h2>
                    <p className="text-[#556B55] font-medium max-w-sm mx-auto">This one-time verification fee helps us maintain a clean marketplace for farmers.</p>
                  </div>
                  <div className="bg-[#F9FBF9] p-8 rounded-[2rem] border border-[#E0E8E0] shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <span className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest block mb-1">Fee Type</span>
                        <span className="font-bold text-[#1B301B]">Professional Listing</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest block mb-1">Amount</span>
                        <span className="text-2xl font-black text-organic-green">৳50</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setPaymentStep(false)}
                      className="flex-1 py-5 bg-gray-50 text-[#1B301B] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      Go Back
                    </button>
                    <button 
                      onClick={handleConfirmPayment}
                      className="flex-[2] py-5 bg-organic-green text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-organic-dark transition-all shadow-2xl shadow-organic-green/30"
                    >
                      Verify & Post
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[#8BA88B] uppercase tracking-[0.2em]">
                    <ShieldCheck size={14} className="text-organic-green" />
                    Encrypted Verification Gate
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

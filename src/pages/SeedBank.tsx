import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, Search, Plus, MapPin, Phone, Info, X, CheckCircle2, RefreshCw, Tag, FileImage, Image as ImageIcon } from 'lucide-react';
import { db, auth, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, getDocs } from '../lib/db';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';

interface SeedListing {
  id: string;
  seedName: string;
  variety: string;
  district: string;
  upazila: string;
  phone: string;
  description: string;
  seedImage?: string;
  type: 'offer' | 'request' | 'exchange';
  userId: string;
  userName: string;
  createdAt: any;
  nidFront?: string;
  nidBack?: string;
  agentId?: string;
  agentName?: string;
}

export default function SeedBank() {
  const { t, i18n } = useTranslation();
  const [isPosting, setIsPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [listings, setListings] = useState<SeedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [seedImage, setSeedImage] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('');
  const [agentData, setAgentData] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);
  const [isCompressing, setIsCompressing] = useState({ nid: false, seed: false });
  const [form, setForm] = useState({
    seedName: '',
    variety: '',
    phone: '',
    description: '',
    type: 'offer' as 'offer' | 'request' | 'exchange',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: ''
  });

  const lookupAgent = async (id: string) => {
    if (!id.trim()) {
      setAgentData(null);
      return;
    }
    setIsSearchingAgent(true);
    try {
      const q = query(collection(db, 'agents'), where('agentId', '==', id.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAgentData(snap.docs[0].data());
      } else {
        setAgentData(null);
      }
    } catch (err) {
      console.error("Agent lookup error", err);
    } finally {
      setIsSearchingAgent(false);
    }
  };

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back' | 'seed') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(prev => ({ ...prev, [side === 'seed' ? 'seed' : 'nid']: true }));
    try {
      const url = await uploadToCloudinary(file, side === 'seed' ? 'krishi-seeds' : 'krishi-nid');
      if (side === 'front') setNidFront(url);
      else if (side === 'back') setNidBack(url);
      else setSeedImage(url);
    } catch (err) {
      console.error("SeedBank image upload error:", err);
    } finally {
      setIsCompressing(prev => ({ ...prev, [side === 'seed' ? 'seed' : 'nid']: false }));
    }
  };

  const currentUpazilas = DISTRICT_UPAZILAS[form.district] || [];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, district: e.target.value, upazila: '' });
  };

  useEffect(() => {
    const q = query(collection(db, 'seedBank'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SeedListing[]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert(i18n.language === 'en' ? 'Please login to post' : 'পোস্ট করতে লগইন করুন');
      return;
    }

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of your NID card' : 'অনুগ্রহ করে এনআইডির সামনের ও পিছনের উভয় ছবি আপলোড করুন');
      return;
    }

    const uid = (user as any).id || user.uid || (user as any)._id;

    try {
      await addDoc(collection(db, 'seedBank'), {
        ...form,
        nidFront,
        nidBack,
        seedImage,
        agentId: agentId || null,
        agentName: agentData?.name || null,
        userId: uid,
        userName: (user as any).name || user.displayName || 'Farmer',
        createdAt: serverTimestamp()
      });
      setIsPosting(false);
      setSeedImage(null);
      setNidFront(null);
      setNidBack(null);
      setForm({
        seedName: '',
        variety: '',
        phone: '',
        description: '',
        type: 'offer',
        district: BANGLADESH_DISTRICTS[0].en,
        upazila: ''
      });
    } catch (err) {
      console.error("Post error", err);
    }
  };

  const filteredListings = listings.filter((l: any) => {
    const isBn = i18n.language === 'bn';
    const seedName = isBn ? (l.seedName_bn || l.seedName) : (l.seedName_en || l.seedName);
    const variety = isBn ? (l.variety_bn || l.variety) : (l.variety_en || l.variety);
    const district = isBn ? (l.district_bn || l.district) : (l.district_en || l.district);

    const matchesSearch = (seedName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (variety || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || l.district === selectedDistrict;
    const matchesType = selectedType === 'All' || l.type === selectedType;
    return matchesSearch && matchesDistrict && matchesType;
  });

  const isBn = i18n.language === 'bn';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="bg-gradient-to-br from-[#2E7D32] to-[#1B301B] rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/20">
            <Sprout size={18} className="text-green-300" />
            {isBn ? 'বীজ বিনিময়' : 'Seed Exchange'}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1]">
            {isBn ? 'বীজ ব্যাংক' : 'Seed Bank'}
          </h1>
          <p className="text-green-50/60 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {isBn 
              ? 'ঐতিহ্যবাহী জাত সংরক্ষণ করুন এবং অন্যান্য কৃষকদের সাথে বিরল বীজ বিনিময় করুন।'
              : 'Preserve traditional varieties and exchange rare seeds with fellow farmers.'}
          </p>
        </div>
        <Sprout className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-surface p-6 rounded-3xl border border-[#E0E8E0] dark:border-dark-border shadow-sm">
        <div className="flex flex-wrap gap-4 w-full lg:w-auto flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={18} />
            <input 
              type="text"
              placeholder={isBn ? "বীজ খুঁজুন..." : "Search seeds..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E0E8E0] dark:border-dark-border bg-white dark:bg-dark-bg focus:border-[#4CAF50] outline-none"
            />
          </div>
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-4 py-3 rounded-xl border border-[#E0E8E0] dark:border-dark-border bg-white dark:bg-dark-bg focus:border-[#4CAF50] outline-none font-bold text-organic-dark dark:text-white"
          >
            <option value="All">{isBn ? 'সকল জেলা' : 'All Districts'}</option>
            {BANGLADESH_DISTRICTS.map(district => (
              <option key={district.en} value={district.en}>
                {isBn ? district.bn : district.en}
              </option>
            ))}
          </select>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-[#E0E8E0] dark:border-dark-border bg-white dark:bg-dark-bg focus:border-[#4CAF50] outline-none font-bold text-organic-dark dark:text-white"
          >
            <option value="All">{isBn ? 'সকল ধরণ' : 'All Types'}</option>
            <option value="offer">{isBn ? 'উপলব্ধ' : 'Available'}</option>
            <option value="request">{isBn ? 'প্রয়োজন' : 'Wanted'}</option>
            <option value="exchange">{isBn ? 'বিনিময়' : 'Exchange'}</option>
          </select>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="w-full lg:w-auto px-8 py-3 bg-[#4CAF50] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2E7D32] transition-all shadow-lg shadow-green-900/20"
        >
          <Plus size={20} />
          {isBn ? 'বীজ পোস্ট করুন' : 'Post Seed'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((l: any) => (
          <motion.div 
            key={l.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-surface rounded-[2rem] border border-[#E0E8E0] dark:border-dark-border shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col"
          >
            {l.seedImage && (
              <div className="w-full h-40 relative">
                <img src={l.seedImage} alt={l.seedName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4">
                   <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    l.type === 'offer' ? "bg-green-500 text-white" : 
                    l.type === 'request' ? "bg-blue-500 text-white" : "bg-orange-500 text-white"
                  )}>
                    {isBn ? (l.type === 'offer' ? 'উপলব্ধ' : l.type === 'request' ? 'প্রয়োজন' : 'বিনিময়') : l.type}
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  l.type === 'offer' ? "bg-green-50 dark:bg-green-500/10 text-green-600" : 
                  l.type === 'request' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-orange-50 dark:bg-orange-500/10 text-orange-600"
                )}>
                  {l.type === 'exchange' ? <RefreshCw size={24} /> : <Sprout size={24} />}
                </div>
                {!l.seedImage && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    l.type === 'offer' ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" : 
                    l.type === 'request' ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" : "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400"
                  )}>
                    {isBn ? (l.type === 'offer' ? 'উপলব্ধ' : l.type === 'request' ? 'প্রয়োজন' : 'বিনিময়') : l.type}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-black text-[#1B301B] dark:text-gray-100 group-hover:text-[#4CAF50] transition-colors">
                  {isBn ? (l.seedName_bn || l.seedName) : (l.seedName_en || l.seedName)}
                </h3>
                <p className="text-[#8BA88B] text-sm font-bold">
                  {isBn ? (l.variety_bn || l.variety) : (l.variety_en || l.variety)}
                </p>
              </div>
  
              <div className="p-4 bg-[#F9FBF9] dark:bg-dark-bg/30 rounded-2xl border border-[#E0E8E0] dark:border-dark-border space-y-2 flex-1">
                <p className="text-sm text-[#556B55] dark:text-gray-400 line-clamp-2 italic">
                  "{isBn ? (l.description_bn || l.description) : (l.description_en || l.description)}"
                </p>
                <div className="flex items-center gap-2 text-xs text-[#8BA88B] font-bold">
                  <MapPin size={14} className="text-[#4CAF50]" />
                  {isBn ? (l.district_bn || l.district) : (l.district_en || l.district)}
                </div>
              </div>
  
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#E0E8E0] rounded-full flex items-center justify-center text-[10px] font-bold text-[#1B301B]">
                    {l.userName[0]}
                  </div>
                  <p className="text-xs font-bold text-[#1B301B]">{l.userName}</p>
                </div>
                <a 
                  href={`tel:${l.phone}`}
                  className="p-3 bg-[#4CAF50] text-white rounded-xl hover:bg-[#2E7D32] transition-all shadow-lg shadow-green-900/20"
                >
                  <Phone size={18} />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredListings.length === 0 && !loading && (
        <div className="text-center py-20 bg-[#F9FBF9] rounded-[2.5rem] border-2 border-dashed border-[#E0E8E0]">
          <Info size={48} className="mx-auto text-[#8BA88B] mb-4" />
          <h3 className="text-xl font-bold text-[#1B301B]">No seeds found</h3>
          <p className="text-[#8BA88B]">Try adjusting your filters or search query.</p>
        </div>
      )}

      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsPosting(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black text-[#1B301B] mb-6">
                {i18n.language === 'en' ? 'Post Seed Listing' : 'বীজ তালিকাভুক্ত করুন'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Seed Name</label>
                  <input required value={form.seedName} onChange={e => setForm({...form, seedName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]" placeholder="e.g. Black Rice, Local Tomato" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Variety/Type</label>
                  <input required value={form.variety} onChange={e => setForm({...form, variety: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]" placeholder="e.g. Traditional, Hybrid" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] uppercase">District</label>
                  <select value={form.district} onChange={handleDistrictChange} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]">
                    {BANGLADESH_DISTRICTS.map(district => (
                      <option key={district.en} value={district.en}>
                        {i18n.language === 'en' ? district.en : district.bn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Upazila</label>
                  <select 
                    required
                    value={form.upazila} 
                    onChange={e => setForm({...form, upazila: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]"
                  >
                    <option value="">{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন করুন'}</option>
                    {currentUpazilas.map(u => (
                      <option key={u.en} value={u.en}>
                        {i18n.language === 'en' ? u.en : u.bn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#556B55] uppercase">NID Card Photos</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E0E8E0] rounded-xl hover:border-[#4CAF50] cursor-pointer transition-all bg-[#F9FBF9]">
                      <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'front')} className="hidden" />
                      {nidFront ? (
                        <div className="flex items-center gap-2 text-[#4CAF50] font-bold">
                          <CheckCircle2 size={16} />
                          <span className="text-xs uppercase tracking-widest">{i18n.language === 'en' ? 'Front' : 'সামনে'}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon size={20} className="text-[#8BA88B]" />
                          <span className="text-[8px] font-bold text-[#8BA88B] uppercase">{i18n.language === 'en' ? 'Upload Front' : 'সামনে'}</span>
                        </div>
                      )}
                    </label>
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E0E8E0] rounded-xl hover:border-[#4CAF50] cursor-pointer transition-all bg-[#F9FBF9]">
                      <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'back')} className="hidden" />
                      {nidBack ? (
                        <div className="flex items-center gap-2 text-[#4CAF50] font-bold">
                          <CheckCircle2 size={16} />
                          <span className="text-xs uppercase tracking-widest">{i18n.language === 'en' ? 'Back' : 'পেছনে'}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon size={20} className="text-[#8BA88B]" />
                          <span className="text-[8px] font-bold text-[#8BA88B] uppercase">{i18n.language === 'en' ? 'Upload Back' : 'পেছনে'}</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Agent ID (Optional)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={agentId} 
                      onChange={e => {
                        setAgentId(e.target.value);
                        if (e.target.value.length >= 4) lookupAgent(e.target.value);
                        else setAgentData(null);
                      }} 
                      className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50] pr-10" 
                      placeholder={i18n.language === 'en' ? "Agent ID / Reference" : "এজেন্ট আইডি / রেফারেন্স"}
                    />
                    {isSearchingAgent && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <RefreshCw size={16} className="animate-spin text-[#4CAF50]" />
                      </div>
                    )}
                  </div>
                  {agentData && (
                    <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="p-2 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-[10px] font-bold text-green-700">Verified Agent: {agentData.name}</span>
                    </motion.div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Listing Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]">
                    <option value="offer">Available (বিক্রি/দান)</option>
                    <option value="request">Wanted (প্রয়োজন)</option>
                    <option value="exchange">Exchange (বিনিময়)</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-organic-green uppercase">Seed Image (ছবি)</label>
                  <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E0E8E0] rounded-2xl hover:border-[#4CAF50] cursor-pointer transition-all bg-[#F9FBF9]">
                    <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'seed')} className="hidden" />
                    {isCompressing.seed ? (
                      <div className="w-8 h-8 border-4 border-t-transparent border-[#4CAF50] rounded-full animate-spin" />
                    ) : seedImage ? (
                      <img src={seedImage} alt="Seed" className="w-full h-40 object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={32} className="text-[#4CAF50]" />
                        <span className="text-xs font-bold text-[#4CAF50] uppercase">{isBn ? 'বীজের ছবি আপলোড করুন' : 'Upload Seed Photo'}</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Phone Number</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#556B55] uppercase">Description</label>
                  <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50] h-24 resize-none" placeholder="Describe the seed quality, quantity, or exchange terms..." />
                </div>
                <button type="submit" className="sm:col-span-2 mt-4 py-4 bg-[#4CAF50] text-white rounded-xl font-black text-lg hover:bg-[#2E7D32] transition-all shadow-xl shadow-green-900/20">
                  Post Listing
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, Camera, Send, RefreshCw, CheckCircle2, ChevronLeft, MapPin, Phone, Info, GraduationCap as Health } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { compressBase64 } from '../lib/imageUtils';

export default function LivestockHealth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState({ front: false, back: false });
  const [agentId, setAgentId] = useState('');
  const [agentData, setAgentData] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);

  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    animalType: 'Cattle',
    symptoms: '',
    district: '',
    upazila: '',
    address: ''
  });

  const lookupAgent = async (id: string) => {
    if (id.length < 4) return;
    setIsSearchingAgent(true);
    try {
      const q = query(collection(db, 'agents'), where('agentId', '==', id.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) setAgentData(snap.docs[0].data());
      else setAgentData(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingAgent(false);
    }
  };

  const handleNidUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(prev => ({ ...prev, [side]: true }));
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await compressBase64(base64, 400, 400, 0.3);
      if (side === 'front') setNidFront(compressed);
      else setNidBack(compressed);
      setIsCompressing(prev => ({ ...prev, [side]: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'NID photos are required' : 'এনআইডি ছবি বাধ্যতামূলক');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'livestockHealthRequests'), {
        ...form,
        nidFront,
        nidBack,
        agentId: agentId || null,
        agentName: agentData?.name || null,
        userId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(i18n.language === 'en' ? 'Request submitted successfully!' : 'আবেদন সফলভাবে জমা দেওয়া হয়েছে!');
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] pb-20">
      <div className="bg-red-500 pt-16 pb-40 px-6 rounded-b-[4rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <button onClick={() => navigate(-1)} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white mb-6">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
          {i18n.language === 'en' ? 'Livestock Health' : 'পশু সম্পদ চিকিৎসা'}
        </h1>
        <p className="text-red-100 font-bold opacity-80 uppercase tracking-widest text-xs">Professional veterinary services</p>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-2xl p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Owner Name</label>
                <input required value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} className="organic-input py-4 pr-6 pl-10" placeholder="Full Name" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="organic-input py-4 pr-6 pl-10" placeholder="017XXXXXXXX" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Animal Type</label>
                <select value={form.animalType} onChange={e => setForm({...form, animalType: e.target.value})} className="organic-input py-4 px-6">
                  <option value="Cattle">Cattle (গরু)</option>
                  <option value="Goat">Goat (ছাগল)</option>
                  <option value="Poultry">Poultry (মুরগি)</option>
                  <option value="Other">Other (অন্যান্য)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Symptoms / Medical Issue</label>
                <textarea required value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} className="organic-input py-4 px-6 min-h-[100px]" placeholder="Explain the health issue..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">NID Front</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-red-500 transition-all bg-gray-50 h-32 relative overflow-hidden">
                  <input type="file" accept="image/*" onChange={e => handleNidUpload(e, 'front')} className="hidden" />
                  {isCompressing.front ? <RefreshCw className="animate-spin text-red-500" /> : nidFront ? <img src={nidFront} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">NID Back</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-red-500 transition-all bg-gray-50 h-32 relative overflow-hidden">
                  <input type="file" accept="image/*" onChange={e => handleNidUpload(e, 'back')} className="hidden" />
                  {isCompressing.back ? <RefreshCw className="animate-spin text-red-500" /> : nidBack ? <img src={nidBack} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                </label>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Agent ID (Optional)</label>
              <div className="relative">
                <input 
                  value={agentId} 
                  onChange={e => {
                    setAgentId(e.target.value);
                    if (e.target.value.length >= 4) lookupAgent(e.target.value);
                    else setAgentData(null);
                  }} 
                  className="organic-input py-4 pr-12" 
                  placeholder="AGENT-XXXX" 
                />
                {isSearchingAgent && <RefreshCw size={18} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                {!isSearchingAgent && agentData && <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
              </div>
              {agentData && <p className="mt-1 ml-4 text-[10px] font-bold text-green-600">Verified: {agentData.name}</p>}
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-4">
              <div className="flex items-center gap-2 text-orange-700 font-bold mb-1">
                <Info size={16} />
                <span className="text-[10px] uppercase tracking-wider">Note</span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-orange-700 leading-tight">
                {i18n.language === 'en' 
                  ? 'NB: A specific fee must be paid to the medical officer. (Fee waiver in special cases)' 
                  : 'NB- পরিক্ষককে নিদিষ্ট পরিমানের ফি প্রদান করতে হবে। (বিশেষ ক্ষেত্র ফি মওকুপ)'}
              </p>
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-900/20 active:scale-95"
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Send size={20} />}
              {i18n.language === 'en' ? 'Submit Application' : 'আবেদন জমা দিন'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

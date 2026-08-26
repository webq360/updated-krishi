import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Camera, Send, RefreshCw, CheckCircle2, ChevronLeft, Info, Thermometer, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth, collection, addDoc, serverTimestamp, query, where, getDocs } from '../lib/db';
import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';

export default function FishWaterTest() {
  const { i18n } = useTranslation();
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
    testType: 'Complete Analysis',
    parameters: [] as string[],
    district: '',
    upazila: '',
    address: ''
  });

  const parameters = [
    { id: 'ammonia', label: 'Ammonia (অ্যামোনিয়া)' },
    { id: 'ph', label: 'pH' },
    { id: 'tds', label: 'TDS' },
    { id: 'salinity', label: 'Salinity (লবণাক্ততা)' },
    { id: 'oxygen', label: 'DO/Oxygen (অক্সিজেন)' }
  ];

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

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(prev => ({ ...prev, [side]: true }));
    try {
      const url = await uploadToCloudinary(file, 'krishi-fish');
      if (side === 'front') setNidFront(url);
      else setNidBack(url);
    } catch (err) {
      console.error("Fish test NID upload error:", err);
    } finally {
      setIsCompressing(prev => ({ ...prev, [side]: false }));
    }
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
      await addDoc(collection(db, 'fishWaterTestRequests'), {
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

  const toggleParam = (id: string) => {
    setForm(prev => ({
      ...prev,
      parameters: prev.parameters.includes(id) 
        ? prev.parameters.filter(p => p !== id) 
        : [...prev.parameters, id]
    }));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] pb-20">
      <div className="bg-cyan-600 pt-16 pb-40 px-6 rounded-b-[4rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <button onClick={() => navigate(-1)} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white mb-6">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
          {i18n.language === 'en' ? 'Fish Water Test' : 'মাছের পানি পরীক্ষা'}
        </h1>
        <p className="text-cyan-100 font-bold opacity-80 uppercase tracking-widest text-xs">Amnonia, pH, TDS, Oxygen Testing</p>
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
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Required Parameters</label>
                <div className="grid grid-cols-2 gap-2">
                  {parameters.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleParam(p.id)}
                      className={cn(
                        "p-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                        form.parameters.includes(p.id) ? "bg-cyan-600 border-cyan-600 text-white" : "border-gray-100 text-gray-400 hover:border-cyan-600"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Address</label>
                <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="organic-input py-4 px-6 min-h-[80px]" placeholder="Farm Location..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">NID Front</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-cyan-500 transition-all bg-gray-50 h-32 relative overflow-hidden">
                  <input type="file" accept="image/*" onChange={e => handleNidUpload(e, 'front')} className="hidden" />
                  {isCompressing.front ? <RefreshCw className="animate-spin text-cyan-500" /> : nidFront ? <img src={nidFront} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">NID Back</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-cyan-500 transition-all bg-gray-50 h-32 relative overflow-hidden">
                  <input type="file" accept="image/*" onChange={e => handleNidUpload(e, 'back')} className="hidden" />
                  {isCompressing.back ? <RefreshCw className="animate-spin text-cyan-500" /> : nidBack ? <img src={nidBack} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
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
                {isSearchingAgent && <RefreshCw size={18} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500" />}
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
                  ? 'NB: A specific fee must be paid to the tester. (Fee waiver in special cases)' 
                  : 'NB- পরিক্ষককে নিদিষ্ট পরিমানের ফি প্রদান করতে হবে। (বিশেষ ক্ষেত্র ফি মওকুপ)'}
              </p>
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-cyan-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/20 active:scale-95"
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Send size={20} />}
              {i18n.language === 'en' ? 'Submit Request' : 'আবেদন জমা দিন'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

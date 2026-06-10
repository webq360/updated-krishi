import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { TestTube, Calculator, Info, CheckCircle2, AlertCircle, RefreshCw, Sprout, FlaskConical, Cpu, Droplets, Thermometer, Activity, Camera, Send } from 'lucide-react';
import { cn } from '../lib/utils';

import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { compressBase64 } from '../lib/imageUtils';

export default function SoilHealth() {
  const { t, i18n } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [agentData, setAgentData] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: '',
    phone: '',
    district: '',
    upazila: '',
    additionalInfo: ''
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

  const handleNidUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await compressBase64(base64, 300, 300, 0.2);
      if (side === 'front') setNidFront(compressed);
      else setNidBack(compressed);
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of your NID card' : 'অনুগ্রহ করে এনআইডির সামনের ও পিছনের উভয় ছবি আপলোড করুন');
      return;
    }

    setIsRequesting(true);
    try {
      await addDoc(collection(db, 'soilTestRequests'), {
        ...requestForm,
        nidFront,
        nidBack,
        agentId: agentId || null,
        agentName: agentData?.name || null,
        userId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(i18n.language === 'en' ? 'Request submitted successfully!' : 'অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!');
      setShowRequestForm(false);
    } catch (err) {
      console.error("Request error", err);
    } finally {
      setIsRequesting(false);
    }
  };

  const [formData, setFormData] = useState({
    crop: 'Rice',
    landSize: '',
    landUnit: 'Decimal',
    soilType: 'Loamy',
    nitrogen: '',
    phosphorus: '',
    potassium: ''
  });
  const [recommendation, setRecommendation] = useState<any>(null);

  // IoT Simulation State
  const [iotData, setIotData] = useState({
    moisture: 45,
    temp: 28,
    ph: 6.5,
    status: 'Normal'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIotData(prev => ({
        moisture: Math.max(20, Math.min(80, prev.moisture + (Math.random() - 0.5) * 2)),
        temp: Math.max(20, Math.min(40, prev.temp + (Math.random() - 0.5))),
        ph: Math.max(5.5, Math.min(7.5, prev.ph + (Math.random() - 0.5) * 0.1)),
        status: prev.moisture < 30 ? 'Low Moisture' : prev.temp > 35 ? 'High Temp' : 'Normal'
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const calculateFertilizer = (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseFloat(formData.landSize);
    if (isNaN(size)) return;

    // Standard kg per decimal (approximate recommendations for Bangladesh)
    const cropRequirements: Record<string, { urea: number; tsp: number; mop: number; gypsum: number; zinc: number }> = {
      'Rice': { urea: 0.8, tsp: 0.4, mop: 0.3, gypsum: 0.2, zinc: 0.05 },
      'Wheat': { urea: 0.9, tsp: 0.5, mop: 0.4, gypsum: 0.2, zinc: 0.05 },
      'Potato': { urea: 1.2, tsp: 0.8, mop: 1.0, gypsum: 0.3, zinc: 0.1 },
      'Maize': { urea: 1.3, tsp: 0.6, mop: 0.5, gypsum: 0.3, zinc: 0.1 },
      'Jute': { urea: 0.6, tsp: 0.3, mop: 0.2, gypsum: 0.1, zinc: 0.05 }
    };

    const soilFactors: Record<string, number> = {
      'Loamy': 1.0,
      'Clayey': 0.95, // Clay holds N better
      'Sandy': 1.15   // Sandy soil leaches faster
    };

    const req = cropRequirements[formData.crop] || cropRequirements['Rice'];
    const soilFactor = soilFactors[formData.soilType] || 1.0;

    const unitFactor = formData.landUnit === 'Decimal' ? 1 : 33;
    const totalArea = size * unitFactor;

    setRecommendation({
      urea: (totalArea * req.urea * soilFactor).toFixed(1),
      tsp: (totalArea * req.tsp * soilFactor).toFixed(1),
      mop: (totalArea * req.mop * soilFactor).toFixed(1),
      gypsum: (totalArea * req.gypsum * soilFactor).toFixed(1),
      zinc: (totalArea * req.zinc * soilFactor).toFixed(1)
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <FlaskConical size={18} />
              {t('soil_health')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] text-center">
              {i18n.language === 'en' ? 'SOIL' : 'মাটি'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">{i18n.language === 'en' ? 'HEALTH' : 'স্বাস্থ্য'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {i18n.language === 'en' 
                ? 'Get precise fertilizer recommendations based on your soil test results and crop type.' 
                : 'আপনার মাটির পরীক্ষার ফলাফল এবং ফসলের ধরন অনুযায়ী সঠিক সারের পরিমাণ জানুন।'}
            </p>
          </div>
        </div>
        <TestTube className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      {/* IoT Dashboard */}
      <section className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 border border-[#E0E8E0] dark:border-white/10 shadow-xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1B301B] rounded-2xl flex items-center justify-center text-[#4CAF50]">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">IoT Smart Farm Monitor</h2>
              <p className="text-[#556B55] dark:text-gray-400 text-sm font-bold uppercase tracking-widest">Real-time Sensor Data</p>
            </div>
          </div>
          <div className={cn(
            "px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2",
            iotData.status === 'Normal' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-pulse"
          )}>
            <Activity size={14} />
            Status: {iotData.status}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
          <div className="p-6 bg-[#F9FBF9] dark:bg-dark-bg rounded-3xl border border-[#E0E8E0] dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Droplets size={20} />
              </div>
              <span className="text-[10px] font-black text-[#8BA88B] dark:text-gray-500 uppercase tracking-widest">Moisture</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#1B301B] dark:text-white">{iotData.moisture.toFixed(1)}</span>
              <span className="text-lg font-bold text-[#556B55] dark:text-gray-500">%</span>
            </div>
            <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${iotData.moisture}%` }}
                className="h-full bg-blue-500"
              />
            </div>
          </div>

          <div className="p-6 bg-[#F9FBF9] dark:bg-dark-bg rounded-3xl border border-[#E0E8E0] dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
                <Thermometer size={20} />
              </div>
              <span className="text-[10px] font-black text-[#8BA88B] dark:text-gray-500 uppercase tracking-widest">Temperature</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#1B301B] dark:text-white">{iotData.temp.toFixed(1)}</span>
              <span className="text-lg font-bold text-[#556B55] dark:text-gray-500">°C</span>
            </div>
            <div className="w-full h-2 bg-orange-100 dark:bg-orange-900/20 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${(iotData.temp / 50) * 100}%` }}
                className="h-full bg-orange-500"
              />
            </div>
          </div>

          <div className="p-6 bg-[#F9FBF9] dark:bg-dark-bg rounded-3xl border border-[#E0E8E0] dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <FlaskConical size={20} />
              </div>
              <span className="text-[10px] font-black text-[#8BA88B] dark:text-gray-500 uppercase tracking-widest">Soil pH</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#1B301B] dark:text-white">{iotData.ph.toFixed(1)}</span>
              <span className="text-lg font-bold text-[#556B55] dark:text-gray-500">pH</span>
            </div>
            <div className="w-full h-2 bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${(iotData.ph / 14) * 100}%` }}
                className="h-full bg-purple-500"
              />
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4CAF50]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 sm:p-12 border border-[#E0E8E0] dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#F0F5F0] dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-[#4CAF50]">
              <Calculator size={24} />
            </div>
            <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">
              {i18n.language === 'en' ? 'Input Soil Data' : 'মাটির তথ্য দিন'}
            </h2>
          </div>

          <form onSubmit={calculateFertilizer} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Crop Type</label>
                <select 
                  value={formData.crop}
                  onChange={(e) => setFormData({...formData, crop: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                >
                  <option value="Rice">Rice (ধান)</option>
                  <option value="Wheat">Wheat (গম)</option>
                  <option value="Potato">Potato (আলু)</option>
                  <option value="Maize">Maize (ভুট্টা)</option>
                  <option value="Jute">Jute (পাট)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Soil Type</label>
                <select 
                  value={formData.soilType}
                  onChange={(e) => setFormData({...formData, soilType: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                >
                  <option value="Loamy">{t('loamy')}</option>
                  <option value="Clayey">{t('clayey')}</option>
                  <option value="Sandy">{t('sandy')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Land Size</label>
                <input 
                  required
                  type="number"
                  value={formData.landSize}
                  onChange={(e) => setFormData({...formData, landSize: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                  placeholder="e.g. 33"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Unit</label>
                <select 
                  value={formData.landUnit}
                  onChange={(e) => setFormData({...formData, landUnit: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                >
                  <option value="Decimal">{t('decimal')}</option>
                  <option value="Bigha">{t('bigha')}</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-[#F0F5F0] dark:border-white/5">
              <p className="text-xs font-bold text-[#8BA88B] dark:text-gray-500 uppercase tracking-widest mb-4">Soil Nutrient Levels (Optional)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase text-center block">N</label>
                  <input type="text" placeholder="Low" className="w-full px-3 py-3 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-xl text-center text-sm text-organic-dark dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase text-center block">P</label>
                  <input type="text" placeholder="Med" className="w-full px-3 py-3 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-xl text-center text-sm text-organic-dark dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase text-center block">K</label>
                  <input type="text" placeholder="High" className="w-full px-3 py-3 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-xl text-center text-sm text-organic-dark dark:text-white" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold text-lg hover:bg-[#43A047] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2"
            >
              <Calculator size={20} />
              {t('calculate_fertilizer')}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {recommendation ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 sm:p-12 border border-[#E0E8E0] dark:border-white/10 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#E8F5E9] dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-[#4CAF50]">
                    <CheckCircle2 size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">
                    {t('recommended_fertilizer')}
                  </h2>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Urea (ইউরিয়া)', value: recommendation.urea, color: 'bg-blue-500' },
                    { label: 'TSP (টিএসপি)', value: recommendation.tsp, color: 'bg-gray-700' },
                    { label: 'MoP (এমওপি)', value: recommendation.mop, color: 'bg-red-500' },
                    { label: 'Gypsum (জিপসাম)', value: recommendation.gypsum, color: 'bg-yellow-600' },
                    { label: 'Zinc (দস্তা)', value: recommendation.zinc, color: 'bg-teal-600' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F9FBF9] dark:bg-dark-bg rounded-2xl border border-[#E0E8E0] dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", item.color)} />
                        <span className="font-bold text-[#556B55] dark:text-gray-300">{item.label}</span>
                      </div>
                      <div className="text-lg font-black text-[#1B301B] dark:text-white">
                        {item.value} <span className="text-xs text-[#8BA88B] dark:text-gray-500 uppercase">kg</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-[#F0F5F0] dark:bg-green-900/10 rounded-2xl border border-[#E0E8E0] dark:border-white/5">
                  <div className="flex items-center gap-2 text-[#2E7D32] dark:text-green-400 font-bold mb-2">
                    <Info size={18} />
                    {i18n.language === 'en' ? 'Application Advice' : 'প্রয়োগের পরামর্শ'}
                  </div>
                  <p className="text-sm text-[#556B55] dark:text-gray-400 leading-relaxed">
                    {i18n.language === 'en' 
                      ? 'Apply Urea in 3 equal splits. TSP and MoP should be applied during final land preparation.' 
                      : 'ইউরিয়া সার ৩ কিস্তিতে প্রয়োগ করুন। টিএসপি এবং এমওপি জমি তৈরির শেষ পর্যায়ে প্রয়োগ করা ভালো।'}
                  </p>
                </div>

                <button 
                  onClick={() => setRecommendation(null)}
                  className="w-full mt-8 py-4 bg-[#F0F5F0] dark:bg-white/5 text-[#1B301B] dark:text-white rounded-2xl font-bold hover:bg-[#E0E8E0] dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  {i18n.language === 'en' ? 'Reset Calculator' : 'পুনরায় হিসাব করুন'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#F9FBF9] dark:bg-dark-surface rounded-[2.5rem] p-12 border-2 border-dashed border-[#E0E8E0] dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 bg-white dark:bg-dark-bg rounded-3xl flex items-center justify-center text-[#8BA88B]">
                  <Sprout size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1B301B] dark:text-white">
                    {i18n.language === 'en' ? 'Waiting for Input' : 'তথ্যের জন্য অপেক্ষা'}
                  </h3>
                  <p className="text-[#8BA88B] dark:text-gray-500 max-w-xs">
                    {i18n.language === 'en' 
                      ? 'Fill out the form to get personalized fertilizer recommendations for your land.' 
                      : 'আপনার জমির জন্য সঠিক সারের পরিমাণ জানতে ফরমটি পূরণ করুন।'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-orange-50 rounded-[2.5rem] p-8 border border-orange-100 space-y-6">
            <div className="flex items-center gap-2 text-orange-700 font-bold">
              <AlertCircle size={20} />
              {i18n.language === 'en' ? 'Need Expert Testing?' : 'মাটি পরীক্ষার জন্য লোক প্রয়োজন?'}
            </div>
            <p className="text-sm text-orange-600 leading-relaxed">
              {i18n.language === 'en' 
                ? 'These calculations are approximate. For official certification, request a physical soil collection from our department.' 
                : 'এই হিসাবটি একটি আনুমানিক ধারণা। সরকারি সনদের জন্য আমাদের বিভাগ থেকে মাটি সংগ্রহের অনুরোধ করুন।'}
            </p>
            <button 
              onClick={() => setShowRequestForm(true)}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
            >
              <FlaskConical size={20} />
              {i18n.language === 'en' ? 'Request Physical Test' : 'মাটি পরীক্ষার আবেদন'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRequestForm && (
          <motion.div 
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRequestForm(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 px-4"
          />
        )}
        {showRequestForm && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] bg-white rounded-[3rem] shadow-2xl z-[60] overflow-hidden flex flex-col p-8"
          >
              <h2 className="text-2xl font-black text-organic-dark mb-6 tracking-tighter uppercase">
                {i18n.language === 'en' ? 'Physical Test Request' : 'মাটি পরীক্ষার আবেদন ফরম'}
              </h2>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <input 
                  required
                  placeholder={i18n.language === 'en' ? "Full Name" : "পূর্ণ নাম"}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-orange-500"
                  value={requestForm.name}
                  onChange={e => setRequestForm({...requestForm, name: e.target.value})}
                />
                <input 
                  required
                  placeholder={i18n.language === 'en' ? "Phone Number" : "ফোন নাম্বার"}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-orange-500"
                  value={requestForm.phone}
                  onChange={e => setRequestForm({...requestForm, phone: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">NID Front</label>
                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-orange-500 transition-all">
                      <input type="file" accept="image/*" onChange={e => handleNidUpload(e, 'front')} className="hidden" />
                      {nidFront ? <CheckCircle2 size={24} className="text-green-500" /> : <Camera size={24} className="text-gray-300" />}
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">NID Back</label>
                    <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:border-orange-500 transition-all">
                      <input type="file" accept="image/*" onChange={e => handleNidUpload(e, 'back')} className="hidden" />
                      {nidBack ? <CheckCircle2 size={24} className="text-green-500" /> : <Camera size={24} className="text-gray-300" />}
                    </label>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    placeholder={i18n.language === 'en' ? "Agent ID (Optional)" : "এজেন্ট আইডি (ঐচ্ছিক)"}
                    className="w-full px-6 py-4 pr-12 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-orange-500"
                    value={agentId}
                    onChange={e => {
                      setAgentId(e.target.value);
                      if (e.target.value.length >= 4) lookupAgent(e.target.value);
                      else setAgentData(null);
                    }}
                  />
                  {isSearchingAgent && <RefreshCw size={18} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" />}
                </div>
                {agentData && (
                  <div className="p-3 bg-green-50 rounded-xl text-[10px] font-bold text-green-700">Verified Agent: {agentData.name}</div>
                )}
                
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 italic">
                  <p className="text-[10px] sm:text-xs font-bold text-blue-700 leading-tight">
                    {i18n.language === 'en' 
                      ? 'NB: A specific fee must be paid to the tester. (Fee waiver in special cases)' 
                      : 'NB- পরিক্ষককে নিদিষ্ট পরিমানের ফি প্রদান করতে হবে। (বিশেষ ক্ষেত্র ফি মওকুপ)'}
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isRequesting}
                  className="w-full py-5 bg-orange-500 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  {isRequesting ? <RefreshCw className="animate-spin" /> : <Send size={20} />}
                  {i18n.language === 'en' ? 'Submit Request' : 'আবেদন জমা দিন'}
                </button>
              </form>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


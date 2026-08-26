import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Wheat, Bird, Fish, Beef, Sprout, TrendingUp, Send, Loader2, CheckCircle2, Calculator, Info, MapPin, Camera, FileImage, Image as ImageIcon, AlertCircle, History, RefreshCw, Calendar, FileText, User } from 'lucide-react';
import { auth, db, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from '../lib/db';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';

import { compressBase64 } from '../lib/imageUtils';

interface ProtectionApp {
  id: string;
  status: string;
  approvalDate?: any;
  subType?: string;
  cropType: string;
  protectionId: string;
  userName: string;
  createdAt: any;
}

export default function Suraksha() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'apply' | 'updates'>('apply');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState({ front: false, back: false });
  const [submitted, setSubmitted] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [updatePic, setUpdatePic] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeProtection, setActiveProtection] = useState<any>(null);
  const [pastProtections, setPastProtections] = useState<any[]>([]);
  const [pastUpdates, setPastUpdates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cropType: 'Fish',
    subType: '',
    totalValue: '',
    premium: 0,
    name: '',
    phone: '',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: '',
    date: new Date().toISOString().split('T')[0],
    agentId: ''
  });

  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);

  const lookupAgent = async (id: string) => {
    if (!id || id.length < 5) {
      setAgentDetails(null);
      return;
    }
    setIsSearchingAgent(true);
    try {
      const { getDocs, query, where } = await import('../lib/db');
      const q = query(collection(db, 'agents'), where('agentId', '==', id.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAgentDetails(snap.docs[0].data());
      } else {
        setAgentDetails(null);
      }
    } catch (err) {
      console.error("Agent lookup error", err);
    } finally {
      setIsSearchingAgent(false);
    }
  };

  const [updateData, setUpdateData] = useState({
    details: '',
    date: new Date().toISOString().split('T')[0]
  });

  const expiryDeltas: Record<string, number> = {
    'Fish': 90,
    'Poultry-Broiler': 35,
    'Poultry-Sonali': 45,
    'Livestock': 365,
    'Rice': 90,
    'Wheat': 120,
    'Maize': 90,
    'Jute': 120,
    'Potato': 90,
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'protectionApplications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ProtectionApp[];
      const active = allApps.find(app => {
        if (app.status === 'pending') return true;
        if (app.status === 'approved' && app.approvalDate) {
          const key = app.subType ? `${app.cropType}-${app.subType}` : app.cropType;
          const days = expiryDeltas[key] || 90;
          const approvalDateObj = app.approvalDate?.toDate ? app.approvalDate.toDate() : new Date(app.approvalDate);
          const expiryDate = new Date(approvalDateObj);
          expiryDate.setDate(expiryDate.getDate() + days);
          return new Date() < expiryDate;
        }
        return false;
      });

      if (active) {
        setActiveProtection(active);
        // Fetch updates for this protection
        const updatesQ = query(
          collection(db, 'protectionUpdates'),
          where('protectionId', '==', active.protectionId),
          orderBy('createdAt', 'desc')
        );
        onSnapshot(updatesQ, (uSnapshot) => {
          setPastUpdates(uSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else {
        setActiveProtection(null);
      }
      setPastProtections(allApps.filter(app => app.id !== active?.id));
    });

    return () => unsubscribe();
  }, []);

  const upazilas = DISTRICT_UPAZILAS[formData.district] || [];

  const cropTypes = [
    { id: 'Fish', name: 'মাছ', en: 'Fish', icon: Fish },
    { id: 'Poultry', name: 'মুরগী', en: 'Poultry', icon: Bird },
    { id: 'Livestock', name: 'গবাদি পশু', en: 'Livestock', icon: Beef },
    { id: 'Rice', name: 'ধান', en: 'Rice', icon: Wheat },
    { id: 'Wheat', name: 'গম', en: 'Wheat', icon: Sprout },
    { id: 'Jute', name: 'পাট', en: 'Jute', icon: Sprout },
    { id: 'Maize', name: 'ভুট্টা', en: 'Maize', icon: Sprout },
    { id: 'Potato', name: 'আলু', en: 'Potato', icon: Sprout },
  ];

  const calculatePremium = (value: string) => {
    const val = parseFloat(value) || 0;
    const premium = val * 0.05;
    setFormData({ ...formData, totalValue: value, premium });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, district: e.target.value, upazila: '' });
  };

  const handleUpdateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setUpdatePic(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError(i18n.language === 'en' ? 'Please login to apply' : 'আবেদন করতে লগইন করুন');
      return;
    }

    if (activeProtection) {
      setError(i18n.language === 'en' ? 'You already have an active or pending application.' : 'আপনার ইতিমধ্যে একটি সক্রিয় বা অপেক্ষমাণ আবেদন রয়েছে।');
      return;
    }

    if (!nidFront || !nidBack) {
      setError(i18n.language === 'en' ? 'Please upload both front and back of NID card' : 'অনুগ্রহ করে এনআইডি কার্ডের সামনের এবং পেছনের ছবি আপলোড করুন');
      return;
    }

    if (!formData.agentId || !agentDetails) {
      setError(i18n.language === 'en' ? 'Valid Agent ID is required' : 'সঠিক এজেন্ট আইডি প্রদান করা বাধ্যতামূলক');
      return;
    }

    setLoading(true);
    try {
      const protectionId = `SR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await addDoc(collection(db, 'protectionApplications'), {
        ...formData,
        protectionId,
        nidFront,
        nidBack,
        referredByAgentId: formData.agentId || null,
        referredByAgentName: agentDetails?.name || null,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || formData.name || 'Farmer',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Protection application error:", err);
      setError('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProtection || !updatePic) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'protectionUpdates'), {
        ...updateData,
        protectionId: activeProtection.protectionId,
        userName: activeProtection.userName,
        cropType: activeProtection.cropType,
        updatePic,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setUpdateData({ details: '', date: new Date().toISOString().split('T')[0] });
      setUpdatePic(null);
      alert(i18n.language === 'en' ? 'Update submitted successfully!' : 'আপডেট সফলভাবে জমা হয়েছে!');
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-6 max-w-md border border-[#E0E8E0]"
        >
          <div className="w-24 h-24 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#4CAF50] mx-auto">
            <CheckCircle2 size={60} />
          </div>
          <h2 className="text-3xl font-black text-[#1B301B]">
            {i18n.language === 'en' ? 'Application Successful!' : 'সুরক্ষা আবেদন সফল!'}
          </h2>
          <p className="text-[#556B55] leading-relaxed">
            {i18n.language === 'en' 
              ? 'Your agriculture protection application has been submitted. Protection will be active after paying 5% premium.' 
              : 'আপনার কৃষি সুরক্ষা আবেদনটি সফলভাবে জমা হয়েছে। ৫% প্রিমিয়াম জমা দেওয়ার পর আপনার সুরক্ষা সক্রিয় হবে।'}
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setNidFront(null);
              setNidBack(null);
              setFormData({
                cropType: 'Fish',
                subType: '',
                totalValue: '',
                premium: 0,
                name: '',
                phone: '',
                district: BANGLADESH_DISTRICTS[0].en,
                upazila: '',
                date: new Date().toISOString().split('T')[0],
                agentId: ''
              });
            }}
            className="w-full py-4 bg-[#1B301B] text-white rounded-2xl font-bold hover:bg-[#2E4A2E] transition-all"
          >
            {i18n.language === 'en' ? 'Apply Again' : 'নতুন আবেদন করুন'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="bg-[#1B301B] rounded-[3rem] p-10 sm:p-20 text-white relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
        <div className="relative z-10 space-y-6 max-w-3xl flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-green-300 text-xs font-black uppercase tracking-[0.2em] border border-white/20">
              <Shield size={18} />
              {i18n.language === 'en' ? 'Suraksha' : 'সুরক্ষা'}
            </div>
            {activeProtection && (
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4CAF50]/20 rounded-full text-[#4CAF50] text-xs font-black border border-[#4CAF50]/30 tracking-widest animate-pulse">
                ID: {activeProtection.protectionId}
              </div>
            )}
          </div>
          <h1 className="text-[10vw] sm:text-6xl font-black tracking-tight uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Agriculture Protection' : 'কৃষি সুরক্ষা'}
          </h1>
          <p className="text-green-50/60 font-bold text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Protecting your hard work against unpredictable natural disasters.' 
              : 'প্রাকৃতিক দুর্যোগের হাত থেকে আপনার হাড়ভাঙ্গা খাটুনির ফসল রক্ষা করতে আমরা প্রতিজ্ঞাবদ্ধ।'}
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-10">
            <button 
              onClick={() => setActiveTab('apply')}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-black transition-all",
                activeTab === 'apply' ? "bg-white text-[#1B301B]" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {i18n.language === 'en' ? 'Apply New' : 'নতুন আবেদন'}
            </button>
            <button 
              onClick={() => setActiveTab('updates')}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2",
                activeTab === 'updates' ? "bg-white text-[#1B301B]" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <RefreshCw size={14} />
              {i18n.language === 'en' ? 'Suraksha Update' : 'সুরক্ষা আপডেট'}
            </button>
          </div>
        </div>
        <Shield className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 -rotate-12" />
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'apply' ? (
          <motion.div 
            key="apply"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-[#E0E8E0] shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider text-center w-full block">
                  {i18n.language === 'en' ? 'Select Crop Type' : 'ফসলের ধরণ নির্বাচন করুন'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {cropTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, cropType: type.id, subType: '' })}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                        formData.cropType === type.id 
                          ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-lg" 
                          : "bg-[#F9FBF9] text-[#556B55] border-[#E0E8E0] hover:border-[#4CAF50]"
                      )}
                    >
                      <type.icon size={24} />
                      <span className="text-xs font-bold">{i18n.language === 'en' ? type.en : type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.cropType === 'Poultry' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Poultry Sub-type' : 'পোল্ট্রির ধরণ'}
                  </label>
                  <select
                    required
                    value={formData.subType}
                    onChange={(e) => setFormData({...formData, subType: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all appearance-none"
                  >
                    <option value="">{i18n.language === 'en' ? 'Select Sub-type' : 'ধরণ নির্বাচন করুন'}</option>
                    <option value="Broiler">{i18n.language === 'en' ? 'Broiler (35 days)' : 'ব্রয়লার (৩৫ দিন)'}</option>
                    <option value="Sonali">{i18n.language === 'en' ? 'Sonali/Cock (45 days)' : 'সোনালী/কক (৪৫ দিন)'}</option>
                  </select>
                </div>
              ) || formData.cropType === 'Livestock' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Livestock Animal' : 'প্রাণীর ধরণ'}
                  </label>
                  <select
                    required
                    value={formData.subType}
                    onChange={(e) => setFormData({...formData, subType: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all appearance-none"
                  >
                    <option value="">{i18n.language === 'en' ? 'Select Animal' : 'প্রাণী নির্বাচন করুন'}</option>
                    <option value="Goat">{i18n.language === 'en' ? 'Goat' : 'ছাগল'}</option>
                    <option value="Sheep">{i18n.language === 'en' ? 'Sheep' : 'ভেড়া'}</option>
                    <option value="Cow">{i18n.language === 'en' ? 'Cow' : 'গরু'}</option>
                    <option value="Buffalo">{i18n.language === 'en' ? 'Buffalo' : 'মহিষ'}</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Approx Crop Value (TK)' : 'মোট ফসলের আনুমানিক দাম (টাকা)'}
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                    <input
                      type="number"
                      required
                      placeholder={i18n.language === 'en' ? "e.g. 1,00,000" : "যেমন: ১,০০,০০০"}
                      value={formData.totalValue}
                      onChange={(e) => calculatePremium(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Premium (5%)' : 'প্রিমিয়াম (৫%)'}
                  </label>
                  <div className="relative">
                    <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4CAF50]" size={20} />
                    <input
                      type="text"
                      readOnly
                      value={`${formData.premium.toLocaleString()} ${i18n.language === 'en' ? 'TK' : 'টাকা'}`}
                      className="w-full pl-12 pr-6 py-4 bg-[#E8F5E9] border border-[#4CAF50] rounded-2xl text-[#2E7D32] font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Application Date' : 'আবেদনের তারিখ'}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                    <input
                      type="date"
                      readOnly
                      value={formData.date}
                      className="w-full pl-12 pr-6 py-4 bg-[#F2F4F2] border border-[#E0E8E0] rounded-2xl text-[#556B55] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                  type="text"
                  required
                  placeholder={i18n.language === 'en' ? "Your Name" : "আপনার নাম"}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
                />
                <input
                  type="tel"
                  required
                  placeholder={i18n.language === 'en' ? "Mobile Number" : "মোবাইল নাম্বার"}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
                />
              </div>

              <div className="p-6 bg-[#E8F5E9]/50 rounded-3xl border border-[#4CAF50]/10 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Agent ID' : 'এজেন্ট আইডি'}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                    <input 
                      type="text"
                      value={formData.agentId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData({...formData, agentId: val});
                        lookupAgent(val);
                      }}
                      placeholder="e.g. KB-1234"
                      className="w-full pl-12 pr-6 py-4 bg-white border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all uppercase font-black"
                    />
                    {isSearchingAgent && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {agentDetails && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-[#2E7D32] text-xs font-black bg-white p-3 rounded-xl border border-[#E0E8E0]"
                    >
                      <CheckCircle2 size={14} />
                      {i18n.language === 'en' ? 'Verified Agent:' : 'যাচাইকৃত এজেন্ট:'} {agentDetails.name} ({agentDetails.shopName})
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'District' : 'জেলা'}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                    <select
                      value={formData.district}
                      onChange={handleDistrictChange}
                      className="w-full pl-12 pr-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all appearance-none"
                    >
                      {BANGLADESH_DISTRICTS.map(d => (
                        <option key={d.en} value={d.en}>{i18n.language === 'en' ? d.en : d.bn}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                    {i18n.language === 'en' ? 'Upazila' : 'উপজেলা'}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                    <select
                      required
                      value={formData.upazila}
                      onChange={(e) => setFormData({...formData, upazila: e.target.value})}
                      className="w-full pl-12 pr-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all appearance-none"
                    >
                      <option value="">{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন করুন'}</option>
                      {upazilas.map(u => (
                        <option key={u.en} value={u.en}>{i18n.language === 'en' ? u.en : u.bn}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                      {i18n.language === 'en' ? 'NID Front Photo' : 'এনআইডি সামনের ছবি'}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            setVerifying(prev => ({ ...prev, front: true }));
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const base64 = ev.target?.result as string;
                              try {
                                const compressed = await compressBase64(base64, 400, 400, 0.2);
                                setTimeout(() => {
                                  setNidFront(compressed);
                                  setVerifying(prev => ({ ...prev, front: false }));
                                }, 1500);
                              } catch (err) {
                                setNidFront(base64);
                                setVerifying(prev => ({ ...prev, front: false }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="suraksha-nid-front"
                        disabled={verifying.front}
                      />
                      <label 
                        htmlFor="suraksha-nid-front"
                        className={cn(
                          "w-full flex items-center justify-center min-h-[120px] px-6 py-4 border-2 border-dashed rounded-[2rem] transition-all relative overflow-hidden",
                          verifying.front ? "border-organic-green animate-pulse" : nidFront ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                        )}
                      >
                        {verifying.front ? (
                          <div className="flex flex-col items-center gap-2 text-organic-green">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                          </div>
                        ) : nidFront ? (
                          <div className="flex flex-col items-center gap-2 text-organic-green relative z-10">
                             <CheckCircle2 size={24} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'আপলোড হয়েছে'}</span>
                             <img src={nidFront} alt="Front Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-[#8BA88B]">
                            <Camera size={24} />
                            <span className="text-sm font-bold tracking-tight">
                              {i18n.language === 'en' ? 'Upload Front' : 'সামনের দিক আপলোড'}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                      {i18n.language === 'en' ? 'NID Back Photo' : 'এনআইডি পেছনের ছবি'}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            setVerifying(prev => ({ ...prev, back: true }));
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const base64 = ev.target?.result as string;
                              try {
                                const compressed = await compressBase64(base64, 400, 400, 0.2);
                                setTimeout(() => {
                                  setNidBack(compressed);
                                  setVerifying(prev => ({ ...prev, back: false }));
                                }, 1500);
                              } catch (err) {
                                setNidBack(base64);
                                setVerifying(prev => ({ ...prev, back: false }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="suraksha-nid-back"
                        disabled={verifying.back}
                      />
                      <label 
                        htmlFor="suraksha-nid-back"
                        className={cn(
                          "w-full flex items-center justify-center min-h-[120px] px-6 py-4 border-2 border-dashed rounded-[2rem] transition-all relative overflow-hidden",
                          verifying.back ? "border-organic-green animate-pulse" : nidBack ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                        )}
                      >
                        {verifying.back ? (
                          <div className="flex flex-col items-center gap-2 text-organic-green">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                          </div>
                        ) : nidBack ? (
                          <div className="flex flex-col items-center gap-2 text-organic-green relative z-10">
                             <CheckCircle2 size={24} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'আপলোড হয়েছে'}</span>
                             <img src={nidBack} alt="Back Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-[#8BA88B]">
                            <Camera size={24} />
                            <span className="text-sm font-bold tracking-tight">
                              {i18n.language === 'en' ? 'Upload Back' : 'পেছনের দিক আপলোড'}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

              {(nidFront || nidBack) && !verifying.front && !verifying.back && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {nidFront && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-[#4CAF50] uppercase tracking-tighter">Front Preview</p>
                      <img src={nidFront} alt="Front Preview" className="rounded-xl border border-[#E0E8E0] shadow-sm" />
                    </div>
                  )}
                  {nidBack && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-[#4CAF50] uppercase tracking-tighter">Back Preview</p>
                      <img src={nidBack} alt="Back Preview" className="rounded-xl border border-[#E0E8E0] shadow-sm" />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#1B301B] text-white rounded-2xl font-black text-xl hover:bg-[#2E4A2E] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Shield size={24} />}
                {i18n.language === 'en' ? 'Confirm Protection' : 'সুরক্ষা নিশ্চিত করুন'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
              <div className="bg-[#E8F5E9] rounded-[2rem] p-10 border border-[#4CAF50]/20 space-y-6 text-center flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl text-[#2E7D32] shadow-sm">
                  <Info size={32} />
                </div>
                <h3 className="font-black text-2xl text-[#1B301B]">{i18n.language === 'en' ? 'Terms & Conditions' : 'শর্তাবলী'}</h3>
                <ul className="space-y-4 text-sm text-[#2E7D32]/80 font-bold max-w-sm">
              <li className="flex gap-2 text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] mt-1.5 shrink-0" />
                {i18n.language === 'en' ? 'Up to 99% compensation for natural disasters.' : 'প্রাকৃতিক দুর্যোগে ফসলের ক্ষতি হলে ৯৯% পর্যন্ত ক্ষতিপূরণ প্রদান করা হবে।'}
              </li>
              <li className="flex gap-2 text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] mt-1.5 shrink-0" />
                {i18n.language === 'en' ? '5% premium must be paid after application.' : 'আবেদনের পর প্রিমিয়ামের ৫% টাকা জমা দিতে হবে।'}
              </li>
              <li className="flex gap-2 text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] mt-1.5 shrink-0" />
                {i18n.language === 'en' ? 'Expert report is final for compensation.' : 'ক্ষতিপূরণ নির্ধারণে কৃষি বিশেষজ্ঞের প্রতিবেদন চূড়ান্ত বলে গণ্য হবে।'}
              </li>
            </ul>
          </div>

          <div className="bg-[#1B301B] rounded-[2rem] p-8 text-white space-y-4">
            <h3 className="font-bold text-xl">{i18n.language === 'en' ? 'Why Agriculture Protection?' : 'কেন কৃষি সুরক্ষা?'}</h3>
            <p className="text-green-50/70 text-sm leading-relaxed text-left">
              {i18n.language === 'en' 
                ? 'Farmers hard work should not go to waste in disasters. We stand by you for your crops safety.' 
                : 'কৃষকের হাড়ভাঙ্গা খাটুনির ফসল যেন কোনো দুর্যোগে নষ্ট না হয়, সেই লক্ষ্যেই আমাদের এই সুরক্ষা সেবা। আমরা আছি আপনার পাশে, আপনার ফসলের নিরাপত্তায়।'}
            </p>
          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div 
        key="updates"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        {!activeProtection ? (
           <div className="bg-white rounded-[2.5rem] p-12 text-center space-y-4 border border-dashed border-[#E0E8E0]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
              <Shield size={40} />
            </div>
            <h3 className="text-2xl font-black text-[#1B301B]">
              {i18n.language === 'en' ? 'No Active Protection' : 'সুরক্ষা সক্রিয় নেই'}
            </h3>
            <p className="text-[#556B55] max-w-sm mx-auto font-medium">
              {i18n.language === 'en' 
                ? 'Apply for protection first. Once approved, you can submit monthly updates here.' 
                : 'প্রথমে সুরক্ষার জন্য আবেদন করুন। আইডি অনুমোদিত হওয়ার পর আপনি এখানে মাসিক আপডেট দিতে পারবেন।'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-[#E0E8E0] shadow-sm space-y-4">
                <h3 className="font-black text-lg text-[#1B301B]">{i18n.language === 'en' ? 'Active Protection' : 'সক্রিয় সুরক্ষা'}</h3>
                <div className="p-4 bg-[#E8F5E9] rounded-2xl border border-[#4CAF50]/20">
                  <p className="text-[10px] text-[#4CAF50] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Crop Type' : 'ফসলের ধরণ'}</p>
                  <p className="text-xl font-black text-[#2E7D32]">{activeProtection.cropType}</p>
                </div>
                <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                  <p className="text-[10px] text-[#8BA88B] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Protection ID' : 'সুরক্ষা আইডি'}</p>
                  <p className="text-lg font-black text-[#1B301B]">{activeProtection.protectionId}</p>
                </div>
                {activeProtection.approvalDate && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Approval Date' : 'অনুমোদনের তারিখ'}</p>
                    <p className="text-sm font-black text-blue-800">{activeProtection.approvalDate?.toDate ? activeProtection.approvalDate.toDate().toLocaleDateString() : new Date(activeProtection.approvalDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#1B301B] p-6 rounded-[2rem] text-white">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                  <History size={18} />
                  {i18n.language === 'en' ? 'Past Updates' : 'পূর্ববর্তী আপডেট'}
                </h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {pastUpdates.length === 0 ? (
                    <p className="text-white/30 text-xs italic">{i18n.language === 'en' ? 'No updates yet' : 'এখনো কোন আপডেট নেই'}</p>
                  ) : (
                    pastUpdates.map((upd: any) => (
                      <div key={upd.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-50 text-left">
                          <span>{upd.date}</span>
                        </div>
                        <p className="text-sm line-clamp-2 text-left">{upd.details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6 text-left">
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-[#E0E8E0] shadow-sm">
                <h2 className="text-3xl font-black text-[#1B301B] mb-10 flex flex-col items-center gap-4 text-center">
                  <RefreshCw className="text-[#4CAF50] w-12 h-12" />
                  {i18n.language === 'en' ? 'Submit Monthly Update' : 'মাসিক আপডেট জমা দিন'}
                </h2>
                
                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1B301B] uppercase ml-2">{i18n.language === 'en' ? 'Date' : 'তারিখ'}</label>
                    <input 
                      type="date"
                      required
                      value={updateData.date}
                      onChange={(e) => setUpdateData({...updateData, date: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1B301B] uppercase ml-2">{i18n.language === 'en' ? 'Condition Details' : 'ফসলের অবস্থার বিবরণ'}</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder={i18n.language === 'en' ? "Describe your crop condition..." : "ফসলের বর্তমান অবস্থা বর্ণনা করুন..."}
                      value={updateData.details}
                      onChange={(e) => setUpdateData({...updateData, details: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1B301B] uppercase ml-2">{i18n.language === 'en' ? 'Recent Photo' : 'সাম্প্রতিক ছবি'}</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setUpdatePic(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="update-pic-upload"
                      />
                      <label 
                        htmlFor="update-pic-upload"
                        className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FBF9] border border-dashed border-[#E0E8E0] rounded-2xl hover:border-[#4CAF50] cursor-pointer transition-all"
                      >
                        <Camera className="text-[#8BA88B]" size={20} />
                        <span className="text-sm text-[#556B55] font-bold">
                          {updatePic ? (i18n.language === 'en' ? 'Photo picked' : 'ছবি নির্বাচন করা হয়েছে') : (i18n.language === 'en' ? 'Pick a photo of your field' : 'ফটোর ছবি নির্বাচন করুন')}
                        </span>
                      </label>
                    </div>
                  </div>

                  {updatePic && <img src={updatePic} className="max-h-48 rounded-2xl border" alt="preview" />}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-[#4CAF50] text-white rounded-2xl font-black text-lg hover:bg-[#43A047] transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    {i18n.language === 'en' ? 'Submit Update' : 'আপডেট জমা দিন'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</div>
);
}

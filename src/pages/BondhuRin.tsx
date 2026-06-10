import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, User, Phone, MapPin, Camera, Send, Loader2, CheckCircle2, FileImage, Image as ImageIcon, History, CreditCard, Calendar, TrendingUp, Info, Activity, Wheat, Bird, Fish, Beef, Sprout } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';

import { compressBase64 } from '../lib/imageUtils';

export default function BondhuRin() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'apply' | 'repayments'>('apply');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState({ front: false, back: false });
  const [submitted, setSubmitted] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [allLoans, setAllLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    phone: '',
    cropType: 'Fish',
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
      const q = query(collection(db, 'agents'), where('agentId', '==', id.toUpperCase()), where('status', '!=', 'suspended'));
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

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch all applications to show status
    const allQ = query(
      collection(db, 'loanApplications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubAll = onSnapshot(allQ, (snapshot) => {
      setAllLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q = query(
      collection(db, 'loanApplications'),
      where('userId', '==', auth.currentUser.uid),
      where('status', '==', 'approved'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setActiveLoan({ id: doc.id, ...doc.data() });

        const repQ = query(
          collection(db, 'loanPayments'),
          where('loanId', '==', doc.data().loanId),
          orderBy('createdAt', 'desc')
        );
        onSnapshot(repQ, (rSnapshot) => {
          setRepayments(rSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else {
        setActiveLoan(null);
      }
    });

    return () => {
      unsubAll();
      unsubscribe();
    };
  }, []);

  const upazilas = DISTRICT_UPAZILAS[formData.district] || [];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, district: e.target.value, upazila: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert(i18n.language === 'en' ? 'Please login to apply' : 'আবেদন করতে লগইন করুন');
      return;
    }

    if (activeLoan || allLoans.some(l => l.status === 'pending')) {
      alert(i18n.language === 'en' ? 'You already have an active or pending application.' : 'আপনার ইতিমধ্যে একটি সক্রিয় বা অপেক্ষমাণ আবেদন রয়েছে।');
      return;
    }

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of NID card' : 'অনুগ্রহ করে এনআইডি কার্ডের সামনের এবং পেছনের ছবি আপলোড করুন');
      return;
    }

    /* Agent ID is optional as per user request */
    // if (!formData.agentId || !agentDetails) {
    //   alert(i18n.language === 'en' ? 'Valid Agent ID is required' : 'সঠিক এজেন্ট আইডি প্রদান করা বাধ্যতামূলক');
    //   return;
    // }

    setLoading(true);
    try {
      const loanId = `LN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await addDoc(collection(db, 'loanApplications'), {
        ...formData,
        loanId,
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
      console.error("Loan application error:", err);
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
            {i18n.language === 'en' ? 'Application Successful!' : 'আবেদন সফল!'}
          </h2>
          <p className="text-[#556B55] leading-relaxed">
            {i18n.language === 'en' 
              ? 'Your Bondhu Rin application has been submitted successfully. Our representative will contact you soon.' 
              : 'আপনার বন্ধু ঋণ আবেদনটি সফলভাবে জমা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।'}
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setNidFront(null);
              setNidBack(null);
              setFormData({
                amount: '',
                name: '',
                phone: '',
                cropType: 'Fish',
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
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1549421263-5494285848bb" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/90 via-transparent to-organic-dark/90" />
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
                <Landmark size={18} />
                {i18n.language === 'en' ? 'BONDHU RIN' : 'বন্ধু ঋণ'}
              </div>
              {activeLoan && (
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest">
                  LOAN ID: {activeLoan.loanId}
                </div>
              )}
            </div>

            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'FARM' : 'কৃষি'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words">{i18n.language === 'en' ? 'CREDIT' : 'ঋণ'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-xl leading-snug sm:leading-relaxed mt-4 px-6">
              {i18n.language === 'en' 
                ? 'Empowering farmers with transparent, low-impact financial support and micro-loans.' 
                : 'স্বচ্ছ এবং সহজ শর্তে কৃষকদের আর্থিক সহায়তায় ও মাইক্রো-ঋণে আমরা আপনার সাথে আছি।'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-10 w-full px-6">
              <button 
                onClick={() => setActiveTab('apply')}
                className={cn(
                  "w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all",
                  activeTab === 'apply' 
                    ? "bg-organic-green text-white shadow-[0_20px_50px_rgba(34,197,94,0.3)]" 
                    : "bg-white/10 text-white border border-white/20 backdrop-blur-2xl hover:bg-white/20"
                )}
              >
                {i18n.language === 'en' ? 'New Application' : 'নতুন আবেদন'}
              </button>
              <button 
                onClick={() => setActiveTab('repayments')}
                className={cn(
                  "w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] flex items-center justify-center gap-3 sm:gap-4 transition-all",
                  activeTab === 'repayments' 
                    ? "bg-organic-green text-white shadow-[0_20px_50px_rgba(34,197,94,0.3)]" 
                    : "bg-white/10 text-white border border-white/20 backdrop-blur-2xl hover:bg-white/20"
                )}
              >
                <History size={18} />
                {i18n.language === 'en' ? 'Repayments' : 'কিস্তি ট্র্যাকিং'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'apply' ? (
          <motion.div 
            key="apply"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-[#E0E8E0] shadow-sm"
          >
            <div className="mb-8 p-6 bg-[#E8F5E9] rounded-3xl border border-[#4CAF50]/30 shadow-sm">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 bg-white rounded-2xl text-[#4CAF50] shadow-sm shrink-0">
                  <Info size={24} />
                </div>
                <div className="space-y-4 w-full">
                  <h3 className="font-black text-[#1B301B] text-xl tracking-tight">
                    {i18n.language === 'en' ? 'Loan Conditions & Logic' : 'ঋণের শর্তাবলী ও নিয়মাবলী'}
                  </h3>
                  <div className="text-xs sm:text-sm text-[#2E7D32] font-medium leading-relaxed space-y-1">
                    {i18n.language === 'en' ? (
                      <ul className="space-y-2">
                        <li>• This loan is strictly for agricultural and farming development.</li>
                        <li>• No traditional fixed interest, but a symbolic "vow" or service charge is applicable.</li>
                        <li>• Monthly installments may increase if delayed, up to a specific limit.</li>
                        <li>• Repaying within 2 months ensures maximum benefits for future loans.</li>
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                        <li>• এই ঋণটি শুধুমাত্র কৃষি এবং খামার উন্নয়নের জন্য দেয়া হয়।</li>
                        <li>• কোন ধরাবাঁধা সুদ নেই, তবে ফসলের ধরণ অনুযায়ী একটি নির্দিষ্ট সার্ভিস চার্জ বা মানত প্রযোজ্য হতে পারে।</li>
                        <li>• সময়মতো কিস্তি পরিশোধ না করলে সার্ভিস চার্জের হার প্রতি মাসে পরিবর্তিত হয়।</li>
                        <li>• ২ মাসের মধ্যে ৪টি কিস্তিতে ঋণ পরিশোধ করলে ভবিষ্যতে আরও বড় ঋণের সুবিধা পাওয়া যাবে।</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider text-center w-full block">
                  {i18n.language === 'en' ? 'Which crop do you need a loan for? (Select)' : 'কোন ফসলের জন্য ঋণ প্রযোজন? (নির্বাচন করুন)'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {cropTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, cropType: type.id })}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                {i18n.language === 'en' ? 'Loan Amount (TK)' : 'ঋণের পরিমাণ (টাকা)'}
              </label>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                <input
                  type="number"
                  required
                  placeholder={i18n.language === 'en' ? "e.g. 50,000" : "যেমন: ৫০,০০০"}
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                {i18n.language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                <input
                  type="text"
                  required
                  placeholder={i18n.language === 'en' ? "Your name" : "আপনার নাম লিখুন"}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                {i18n.language === 'en' ? 'Mobile Number' : 'মোবাইল নাম্বার'}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2 p-6 bg-[#E8F5E9]/30 rounded-3xl border border-[#4CAF50]/10 space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1B301B] uppercase tracking-wider ml-2">
                {i18n.language === 'en' ? 'NID Front Photo' : 'এনআইডি সামনের ছবি'}
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if(file) {
                      setVerifying(prev => ({ ...prev, front: true }));
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        const base64 = ev.target?.result as string;
                        try {
                          const compressed = await compressBase64(base64, 300, 300, 0.2);
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
                  id="nid-front"
                  disabled={verifying.front}
                />
                <label 
                  htmlFor="nid-front"
                  className={cn(
                    "w-full flex items-center justify-center min-h-[120px] px-6 py-4 border-2 border-dashed rounded-3xl transition-all relative overflow-hidden",
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
                      <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Upload Front' : 'সামনের দিক আপলোড'}</span>
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if(file) {
                      setVerifying(prev => ({ ...prev, back: true }));
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        const base64 = ev.target?.result as string;
                        try {
                          const compressed = await compressBase64(base64, 300, 300, 0.2);
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
                  id="nid-back"
                  disabled={verifying.back}
                />
                <label 
                  htmlFor="nid-back"
                  className={cn(
                    "w-full flex items-center justify-center min-h-[120px] px-6 py-4 border-2 border-dashed rounded-3xl transition-all relative overflow-hidden",
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
                      <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Upload Back' : 'পেছনের দিক আপলোড'}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {(nidFront || nidBack) && !verifying.front && !verifying.back && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {nidFront && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#4CAF50] uppercase tracking-tighter">Front Preview</p>
                  <img src={nidFront} alt="Front Preview" className="rounded-2xl border border-[#E0E8E0] shadow-sm max-h-40 object-cover" />
                </div>
              )}
              {nidBack && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#4CAF50] uppercase tracking-tighter">Back Preview</p>
                  <img src={nidBack} alt="Back Preview" className="rounded-2xl border border-[#E0E8E0] shadow-sm max-h-40 object-cover" />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#1B301B] text-white rounded-2xl font-black text-xl hover:bg-[#2E4A2E] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 uppercase tracking-wider"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
            {i18n.language === 'en' ? 'Submit Application' : 'আবেদন জমা দিন'}
          </button>
        </form>
      </motion.div>
        ) : (
          <motion.div 
            key="repayments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!activeLoan ? (
              <div className="space-y-8">
                {allLoans.length > 0 && (
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E0E8E0] shadow-sm">
                    <h3 className="font-black text-[#1B301B] mb-4 flex items-center gap-2">
                      <History size={18} className="text-[#4CAF50]" />
                      {i18n.language === 'en' ? 'Application Status' : 'আবেদনের অবস্থা'}
                    </h3>
                    <div className="space-y-3">
                      {allLoans.map(loan => (
                        <div key={loan.id} className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                          <div>
                            <p className="font-bold text-[#1B301B]">{loan.loanId}</p>
                            <p className="text-[10px] text-[#8BA88B] uppercase font-black">
                              {loan.cropType} • {loan.amount} TK • {loan.date || new Date(loan.createdAt?.toDate?.() || loan.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            loan.status === 'approved' ? "bg-green-100 text-green-700" : 
                            loan.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                          )}>
                            {loan.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded-[2.5rem] p-12 text-center space-y-4 border border-dashed border-[#E0E8E0]">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
                    <Landmark size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1B301B]">
                    {i18n.language === 'en' ? 'No Active Loan' : 'কোন সক্রিয় ঋণ নেই'}
                  </h3>
                  <p className="text-[#556B55] max-w-sm mx-auto font-medium">
                    {i18n.language === 'en' 
                      ? 'Submit an application first. Once approved, you can track your installments here.' 
                      : 'প্রথমে একটি আবেদন জমা দিন। অনুমোদিত হওয়ার পর আপনি আপনার কিস্তি এখানে ট্র্যাক করতে পারবেন।'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-[#E0E8E0] shadow-sm space-y-6">
                    <h3 className="font-black text-xl text-[#1B301B] flex flex-col items-center gap-4 text-center w-full mb-8">
                      <CreditCard className="text-[#4CAF50]" size={48} />
                      {i18n.language === 'en' ? 'Loan Details' : 'ঋণ সংক্রান্ত তথ্য'}
                    </h3>
                    <div className="space-y-4 text-left">
                      <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                        <p className="text-[10px] text-[#8BA88B] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Crop Category' : 'ফসলের ক্যাটাগরি'}</p>
                        <p className="text-xl font-black text-[#1B301B]">{activeLoan.cropType}</p>
                      </div>
                      <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                        <p className="text-[10px] text-[#8BA88B] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Approved Amount' : 'অনুমোদিত পরিমাণ'}</p>
                        <p className="text-2xl font-black text-[#1B301B]">{activeLoan.approvedAmount || activeLoan.amount} <span className="text-sm">TK</span></p>
                      </div>
                      <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                        <p className="text-[10px] text-[#8BA88B] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Loan ID' : 'ঋণ আইডি'}</p>
                        <p className="text-lg font-black text-[#4CAF50]">{activeLoan.loanId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1B301B] p-8 rounded-[2rem] text-white">
                    <h4 className="font-bold flex items-center gap-2 mb-6">
                      <History size={18} />
                      {i18n.language === 'en' ? 'Repayment History' : 'কিস্তির ইতিহাস'}
                    </h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                      {repayments.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                          <p className="text-white/30 text-xs italic">{i18n.language === 'en' ? 'No installments paid yet' : 'এখনো কোন কিস্তি পরিশোধ করা হয়নি'}</p>
                        </div>
                      ) : (
                        repayments.map(rp => (
                          <div key={rp.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1 text-left">
                            <div className="flex justify-between items-center text-left">
                              <span className="text-xs font-black text-white">{rp.amount} TK</span>
                              <span className="text-[10px] text-green-400 font-bold">{rp.date}</span>
                            </div>
                            <p className="text-[10px] text-white/50">{rp.method || 'Cash Payment'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6 text-left">
                  <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-[#E0E8E0] shadow-sm">
                    <div className="flex flex-col items-center gap-4 mb-10 text-center">
                      <div className="w-20 h-20 bg-[#E8F5E9] rounded-[2rem] flex items-center justify-center text-[#4CAF50] shadow-inner">
                        <TrendingUp size={40} />
                      </div>
                      <div className="max-w-md">
                        <h2 className="text-3xl font-black text-[#1B301B]">
                          {i18n.language === 'en' ? 'Instalment Tracker' : 'কিস্তি ট্র্যাকার'}
                        </h2>
                        <p className="text-[#556B55] text-sm font-bold opacity-70">
                          {i18n.language === 'en' ? 'Monitor your real-time repayment data' : 'আপনার কিস্তির বাস্তব তথ্য পর্যবেক্ষণ করুন'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-left">
                      <div className="p-6 bg-[#F9FBF9] rounded-[2rem] border border-[#E0E8E0]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-white rounded-xl shadow-sm"><Calendar size={18} className="text-[#4CAF50]" /></div>
                          <span className="text-xs font-black text-[#1B301B] uppercase">{i18n.language === 'en' ? 'Monthly Multiplier' : 'মাসিক বৃদ্ধির হার'}</span>
                        </div>
                        <p className="text-xl font-black text-[#1B301B]">
                          {Math.pow(2, Math.max(0, Math.floor((Date.now() - (activeLoan.approvalDate?.toDate?.() || activeLoan.createdAt?.toDate?.() || Date.now())) / (30 * 24 * 60 * 60 * 1000))))}% 
                        </p>
                        <p className="text-[10px] text-[#8BA88B] mt-1 italic leading-tight">
                          {activeLoan.approvalDate ? (
                             <span className="text-[#4CAF50] font-bold">
                               Approved: {new Date(activeLoan.approvalDate.toDate()).toLocaleDateString()}
                             </span>
                          ) : (
                             i18n.language === 'en' 
                              ? 'Increases exponentially every month until paid.' 
                              : 'পরিশোধ না করা পর্যন্ত প্রতি মাসে দ্বিগুণ হারে বৃদ্ধি পাবে।'
                          )}
                        </p>
                      </div>
                      <div className="p-6 bg-[#1B301B] rounded-[2rem] text-white shadow-xl shadow-green-900/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-white/10 rounded-xl"><Landmark size={18} className="text-green-300" /></div>
                          <span className="text-xs font-black text-green-300 uppercase">{i18n.language === 'en' ? 'Current Balance' : 'বর্তমান ব্যালেন্স'}</span>
                        </div>
                        <p className="text-xl font-black">{(activeLoan.approvedAmount || activeLoan.amount)} TK</p>
                        <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest font-bold">Principal Only</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                       <h4 className="font-black text-[#1B301B] flex items-center gap-2 ml-2">
                        <Activity size={18} className="text-[#4CAF50]" />
                        {i18n.language === 'en' ? 'Installment Projections' : 'কিস্তির পূর্বানুমান'}
                       </h4>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[1, 2, 3, 4].map(month => {
                            const multiplier = Math.pow(2, month - 1);
                            const amount = ((activeLoan.approvedAmount || activeLoan.amount) * (multiplier / 100)).toFixed(0);
                            return (
                              <div key={month} className="p-3 bg-gray-50 rounded-2xl border border-[#E0E8E0] text-center">
                                <p className="text-[9px] font-black text-[#8BA88B] uppercase mb-1">{i18n.language === 'en' ? `Month ${month}` : `${month}ম মাস`}</p>
                                <p className="text-sm font-black text-[#1B301B]">{multiplier}%</p>
                                <p className="text-[10px] text-[#4CAF50] font-bold">{amount} TK</p>
                              </div>
                            );
                          })}
                       </div>
                    </div>

                    <div className="p-6 bg-[#E8F5E9] rounded-[2rem] border border-[#4CAF50]/40 flex flex-col sm:flex-row items-center gap-6 mb-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm shrink-0">
                        <Info size={32} className="text-[#4CAF50]" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="font-black text-[#1B301B] flex items-center gap-2">
                           {i18n.language === 'en' ? 'Recommendation Note' : 'সুপারিশ নোট'}
                        </h4>
                        <p className="text-sm text-[#2E7D32] font-black leading-relaxed">
                          {i18n.language === 'en' 
                            ? 'We recommend repaying the approved amount in 4 installments within 2 months to minimize exponential growth.' 
                            : 'অতিরিক্ত বৃদ্ধি এড়াতে অনুমোদিত অর্থ ২ মাসের মধ্যে ৪টি কিস্তিতে পরিশোধ করার জন্য বিশেষভাবে সুপারিশ করা হচ্ছে।'}
                        </p>
                      </div>
                    </div>

                    <div className="p-8 bg-[#F9FBF9] rounded-[2rem] border border-[#E0E8E0] flex flex-col sm:flex-row items-center gap-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm shrink-0">
                        <Landmark size={32} className="text-[#4CAF50]" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="font-black text-[#1B301B]">
                          {i18n.language === 'en' ? 'Payment Portal' : 'পরিশোধের পোর্টাল'}
                        </h4>
                        <p className="text-sm text-[#556B55] font-medium leading-relaxed">
                          {i18n.language === 'en' 
                            ? 'Please contact your nearest agent to pay your installments. Only Admin can update repayment records.' 
                            : 'দয়া করে কিস্তি পরিশোধ করতে আপনার নিকটস্থ এজেন্টের সাথে যোগাযোগ করুন। শুধুমাত্র এডমিন কিস্তির তথ্য আপডেট করতে পারবেন।'}
                        </p>
                      </div>
                    </div>
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

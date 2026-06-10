import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Send, MapPin, Phone, User, CreditCard, Info, CheckCircle2, Landmark, FileImage, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

import { compressBase64 } from '../lib/imageUtils';

export default function CardApplication() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifying, setVerifying] = useState({ front: false, back: false });
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    nid: '',
    landSize: '',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: '',
    agentId: ''
  });

  const lookupAgent = async (id: string) => {
    if (!id || id.length < 5) {
      setAgentDetails(null);
      return;
    }
    setIsSearchingAgent(true);
    try {
      const { getDocs, query, where } = await import('firebase/firestore');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setVerifying(prev => ({ ...prev, [field]: true }));
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const compressed = await compressBase64(base64, 300, 300, 0.2);
        setTimeout(() => {
          if (field === 'front') setNidFront(compressed);
          else setNidBack(compressed);
          setVerifying(prev => ({ ...prev, [field]: false }));
        }, 1500);
      } catch (err) {
        if (field === 'front') setNidFront(base64);
        else setNidBack(base64);
        setVerifying(prev => ({ ...prev, [field]: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, district: e.target.value, upazila: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert(i18n.language === 'en' ? 'Please login to apply' : 'আবেদন করতে লগইন করুন');
      return;
    }

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of NID card' : 'অনুগ্রহ করে এনআইডি কার্ডের সামনের এবং পিছনের উভয় অংশ আপলোড করুন');
      return;
    }

    /* Agent ID is optional as per user request */
    // if (!form.agentId || !agentDetails) {
    //   setError(i18n.language === 'en' ? 'Valid Agent ID is required' : 'সঠিক এজেন্ট আইডি প্রদান করা বাধ্যতামূলক');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'cardApplications'), {
        ...form,
        nidFront,
        nidBack,
        referredByAgentId: form.agentId || null,
        referredByAgentName: agentDetails?.name || null,
        userId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(i18n.language === 'en' ? 'Application submitted successfully!' : 'আবেদন সফলভাবে জমা দেওয়া হয়েছে!');
      navigate('/');
    } catch (err) {
      console.error("Submit error", err);
      alert(i18n.language === 'en' ? 'Something went wrong' : 'কিছু ভুল হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUpazilas = DISTRICT_UPAZILAS[form.district] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="bg-[#1B301B] rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/20">
            <CreditCard size={18} className="text-[#4CAF50]" />
            {i18n.language === 'en' ? 'Digital ID' : 'ডিজিটাল আইডি'}
          </div>
          <h1 className="text-[10vw] sm:text-8xl font-black tracking-tighter uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Krishi Bondhu Card' : 'কৃষি বন্ধু কার্ড আবেদন'}
          </h1>
          <p className="text-gray-300 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Apply for your digital farmer ID card to access government subsidies, loans, and expert support.' 
              : 'সরকারি ভর্তুকি, ঋণ এবং বিশেষজ্ঞ সহায়তা পেতে আপনার ডিজিটাল কৃষক আইডি কার্ডের জন্য আবেদন করুন।'}
          </p>
        </div>
        <CreditCard className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-[#E0E8E0] shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
                >
                  <AlertCircle size={20} />
                  {error}
                </motion.div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <User size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                  </label>
                  <input 
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <Phone size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'Mobile Number' : 'মোবাইল নম্বর'}
                  </label>
                  <input 
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <User size={16} className="text-emerald-600" />
                    {i18n.language === 'en' ? 'Agent ID' : 'এজেন্ট আইডি'}
                  </label>
                  <div className="relative group">
                    <input 
                      type="text"
                      value={form.agentId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setForm({...form, agentId: val});
                        lookupAgent(val);
                      }}
                      placeholder="e.g. KB-1234"
                      className="w-full px-6 py-4 rounded-2xl border border-emerald-200 focus:border-emerald-500 outline-none transition-all uppercase font-black"
                    />
                    {isSearchingAgent && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {agentDetails && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-emerald-700 text-xs font-black bg-white/50 p-3 rounded-xl border border-emerald-200"
                    >
                      <CheckCircle2 size={14} />
                      {i18n.language === 'en' ? 'Verified Agent:' : 'যাচাইকৃত এজেন্ট:'} {agentDetails.name} ({agentDetails.shopName})
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <CreditCard size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'NID Number' : 'এনআইডি নম্বর'}
                  </label>
                  <input 
                    required
                    type="text"
                    value={form.nid}
                    onChange={(e) => setForm({...form, nid: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <Landmark size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'Land Size (Decimal)' : 'জমির পরিমাণ (শতাংশ)'}
                  </label>
                  <input 
                    required
                    type="text"
                    value={form.landSize}
                    onChange={(e) => setForm({...form, landSize: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <MapPin size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'District' : 'জেলা'}
                  </label>
                  <select 
                    value={form.district}
                    onChange={handleDistrictChange}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all font-bold"
                  >
                    {BANGLADESH_DISTRICTS.map(district => (
                      <option key={district.en} value={district.en}>
                        {i18n.language === 'en' ? district.en : district.bn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <MapPin size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'Upazila' : 'উপজেলা'}
                  </label>
                  <select 
                    required
                    value={form.upazila}
                    onChange={(e) => setForm({...form, upazila: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all font-bold"
                  >
                    <option value="">{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন করুন'}</option>
                    {currentUpazilas.map(u => (
                      <option key={u.en} value={u.en}>
                        {i18n.language === 'en' ? u.en : u.bn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                  <ImageIcon size={16} className="text-[#4CAF50]" />
                  {i18n.language === 'en' ? 'NID Card Photos' : 'এনআইডি কার্ডের ছবিসমূহ'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#8BA88B] uppercase ml-2">{i18n.language === 'en' ? 'Front Side' : 'সামনের অংশ'}</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'front')}
                      className="hidden" 
                      id="nid-front"
                    />
                    <label 
                      htmlFor="nid-front"
                      className="w-full h-32 rounded-2xl border-2 border-dashed border-[#E0E8E0] hover:border-[#4CAF50] bg-[#F9FBF9] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all overflow-hidden relative"
                    >
                      {verifying.front ? (
                        <div className="flex flex-col items-center gap-3 text-[#4CAF50] animate-pulse">
                          <div className="w-6 h-6 border-2 border-t-transparent border-[#4CAF50] rounded-full animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                        </div>
                      ) : nidFront ? (
                        <>
                          <img src={nidFront} alt="Front Preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          <div className="relative z-10 flex flex-col items-center gap-2 text-[#4CAF50]">
                             <CheckCircle2 size={24} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'আপলোড হয়েছে'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <FileImage size={24} className="text-[#8BA88B]" />
                          <span className="text-[10px] text-[#556B55] font-black uppercase">{i18n.language === 'en' ? 'Upload Front' : 'সামনের ছবি'}</span>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#8BA88B] uppercase ml-2">{i18n.language === 'en' ? 'Back Side' : 'পিছনের অংশ'}</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'back')}
                      className="hidden" 
                      id="nid-back"
                      disabled={verifying.back}
                    />
                    <label 
                      htmlFor="nid-back"
                      className="w-full h-32 rounded-2xl border-2 border-dashed border-[#E0E8E0] hover:border-[#4CAF50] bg-[#F9FBF9] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all overflow-hidden relative"
                    >
                      {verifying.back ? (
                        <div className="flex flex-col items-center gap-3 text-[#4CAF50] animate-pulse">
                          <div className="w-6 h-6 border-2 border-t-transparent border-[#4CAF50] rounded-full animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                        </div>
                      ) : nidBack ? (
                        <>
                          <img src={nidBack} alt="Back Preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          <div className="relative z-10 flex flex-col items-center gap-2 text-[#4CAF50]">
                             <CheckCircle2 size={24} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Uploaded' : 'আপলোড হয়েছে'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <FileImage size={24} className="text-[#8BA88B]" />
                          <span className="text-[10px] text-[#556B55] font-black uppercase">{i18n.language === 'en' ? 'Upload Back' : 'পিছনের ছবি'}</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-[#4CAF50] text-white rounded-2xl font-black text-lg hover:bg-[#2E7D32] transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : (i18n.language === 'en' ? 'Apply for Card' : 'কার্ডের জন্য আবেদন করুন')}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#E8F5E9] p-8 rounded-[2.5rem] border border-[#C8E6C9]">
            <h3 className="text-xl font-black text-[#1B301B] mb-4">
              {i18n.language === 'en' ? 'Card Benefits' : 'কার্ডের সুবিধা'}
            </h3>
            <ul className="space-y-4">
              {[
                { en: 'Easy access to bank loans', bn: 'সহজে ব্যাংক ঋণ সুবিধা' },
                { en: 'Government subsidies', bn: 'সরকারি ভর্তুকি প্রাপ্তি' },
                { en: 'Discount on seeds & fertilizer', bn: 'বীজ ও সারে বিশেষ ছাড়' },
                { en: 'Priority expert support', bn: 'বিশেষজ্ঞ পরামর্শে অগ্রাধিকার' }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#2E7D32]">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  {i18n.language === 'en' ? item.en : item.bn}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

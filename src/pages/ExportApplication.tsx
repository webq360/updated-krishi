import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Send, MapPin, Phone, User, Package, Info, CheckCircle2, Globe, FileImage, Image as ImageIcon, ShieldCheck, Camera } from 'lucide-react';
import { useState } from 'react';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { db, auth, collection, addDoc, serverTimestamp, query, where, getDocs } from '../lib/db';
import { useNavigate } from 'react-router-dom';

import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';

export default function ExportApplication() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('');
  const [agentData, setAgentData] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: '',
    productName: '',
    details: ''
  });

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCompressing(true);
    try {
      const url = await uploadToCloudinary(file, 'krishi-exports');
      if (side === 'front') setNidFront(url);
      else setNidBack(url);
    } catch (err) {
      console.error("Export NID upload error:", err);
    } finally {
      setIsCompressing(false);
    }
  };

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
      alert(i18n.language === 'en' ? 'Please upload both front and back of your NID card' : 'অনুগ্রহ করে এনআইডির সামনের ও পিছনের উভয় ছবি আপলোড করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'exportApplications'), {
        ...form,
        nidFront,
        nidBack,
        agentId: agentId || null,
        agentName: agentData?.name || null,
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
            <Globe size={18} className="text-[#4CAF50]" />
            {i18n.language === 'en' ? 'Export Opportunity' : 'রপ্তানি সুযোগ'}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Export Application' : 'রপ্তানি আবেদন'}
          </h1>
          <p className="text-gray-300 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Farmers with surplus crops can now directly connect with international exporters for better prices.' 
              : 'অতিরিক্ত ফলন এবং স্থানীয় বাজারে দাম কম হওয়ায় কৃষক সরাসরি রপ্তানিকারকের সাথে যোগাযোগের সুযোগ পাবেন।'}
          </p>
        </div>
        <Globe className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-[#E0E8E0] shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder={i18n.language === 'en' ? "Your Name" : "আপনার নাম"}
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
                    placeholder="017XXXXXXXX"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <ImageIcon size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'NID Card Front' : 'এনআইডি কার্ড (সামনে)'}
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleNidUpload(e, 'front')}
                      className="hidden" 
                      id="nid-front-upload"
                    />
                    <label 
                      htmlFor="nid-front-upload"
                      className="w-full px-6 py-8 rounded-2xl border-2 border-dashed border-[#E0E8E0] hover:border-[#4CAF50] bg-[#F9FBF9] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {nidFront ? (
                        <div className="flex items-center gap-2 text-[#4CAF50] font-bold">
                          <CheckCircle2 size={24} />
                          {i18n.language === 'en' ? 'Front Uploaded' : 'সামনে আপলোড হয়েছে'}
                        </div>
                      ) : (
                        <>
                          <Camera size={32} className="text-[#8BA88B]" />
                          <span className="text-[#556B55] font-bold text-sm text-center">
                            {i18n.language === 'en' ? 'Upload Front' : 'সামনে আপলোড'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                    <ImageIcon size={16} className="text-[#4CAF50]" />
                    {i18n.language === 'en' ? 'NID Card Back' : 'এনআইডি কার্ড (পেছনে)'}
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleNidUpload(e, 'back')}
                      className="hidden" 
                      id="nid-back-upload"
                    />
                    <label 
                      htmlFor="nid-back-upload"
                      className="w-full px-6 py-8 rounded-2xl border-2 border-dashed border-[#E0E8E0] hover:border-[#4CAF50] bg-[#F9FBF9] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {nidBack ? (
                        <div className="flex items-center gap-2 text-[#4CAF50] font-bold">
                          <CheckCircle2 size={24} />
                          {i18n.language === 'en' ? 'Back Uploaded' : 'পেছনে আপলোড হয়েছে'}
                        </div>
                      ) : (
                        <>
                          <Camera size={32} className="text-[#8BA88B]" />
                          <span className="text-[#556B55] font-bold text-sm text-center">
                            {i18n.language === 'en' ? 'Upload Back' : 'পেছনে আপলোড'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                  <ShieldCheck size={16} className="text-[#4CAF50]" />
                  {i18n.language === 'en' ? 'Agent ID (Optional)' : 'এজেন্ট আইডি (ঐচ্ছিক)'}
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={agentId}
                    onChange={(e) => {
                      setAgentId(e.target.value);
                      if (e.target.value.length >= 4) lookupAgent(e.target.value);
                      else setAgentData(null);
                    }}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all pr-12"
                    placeholder={i18n.language === 'en' ? "Agent ID / Reference" : "এজেন্ট আইডি / রেফারেন্স"}
                  />
                  {isSearchingAgent && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <RefreshCw size={18} className="animate-spin text-[#4CAF50]" />
                    </div>
                  )}
                </div>
                {agentData && (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-xs font-bold text-green-700">Verified Agent: {agentData.name} ({agentData.district})</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                  <Package size={16} className="text-[#4CAF50]" />
                  {i18n.language === 'en' ? 'Product Name' : 'পণ্যের নাম'}
                </label>
                <select 
                  required
                  value={form.productName}
                  onChange={(e) => setForm({...form, productName: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all font-bold"
                >
                  <option value="">{i18n.language === 'en' ? 'Select Product' : 'পণ্য নির্বাচন করুন'}</option>
                  {[
                    { en: 'Himsagar Mango', bn: 'হিমসাগর আম' },
                    { en: 'Black Tiger Shrimp', bn: 'ব্ল্যাক টাইগার চিংড়ি' },
                    { en: 'Fine Jute', bn: 'উন্নত পাট' },
                    { en: 'Organic Tea', bn: 'অর্গানিক চা' },
                    { en: 'Potato (Export Quality)', bn: 'রপ্তানিযোগ্য আলু' },
                    { en: 'Fresh Vegetables', bn: 'তাজা শাকসবজি' },
                    { en: 'Other', bn: 'অন্যান্য' }
                  ].map(p => (
                    <option key={p.en} value={p.en}>
                      {i18n.language === 'en' ? p.en : p.bn}
                    </option>
                  ))}
                </select>
                {form.productName === 'Other' && (
                   <input 
                    required
                    type="text"
                    onChange={(e) => setForm({...form, productName: e.target.value})}
                    className="w-full mt-2 px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all"
                    placeholder={i18n.language === 'en' ? "Please specify product" : "পণ্যের নাম লিখুন"}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#556B55]">
                  <Info size={16} className="text-[#4CAF50]" />
                  {i18n.language === 'en' ? 'Surplus Details' : 'বিস্তারিত বিবরণ'}
                </label>
                <textarea 
                  required
                  rows={4}
                  value={form.details}
                  onChange={(e) => setForm({...form, details: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none transition-all resize-none"
                  placeholder={i18n.language === 'en' ? "Quantity, quality, and other details..." : "পরিমাণ, গুণমান এবং অন্যান্য তথ্য..."}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-[#4CAF50] text-white rounded-2xl font-black text-lg hover:bg-[#2E7D32] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : (
                  <>
                    <Send size={24} />
                    {i18n.language === 'en' ? 'Submit Application' : 'আবেদন জমা দিন'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#E8F5E9] p-8 rounded-[2.5rem] border border-[#C8E6C9]">
            <h3 className="text-xl font-black text-[#1B301B] mb-4">
              {i18n.language === 'en' ? 'Why Export?' : 'কেন রপ্তানি করবেন?'}
            </h3>
            <ul className="space-y-4">
              {[
                { en: 'Better prices than local market', bn: 'স্থানীয় বাজারের চেয়ে ভালো দাম' },
                { en: 'Direct connection with exporters', bn: 'রপ্তানিকারকদের সাথে সরাসরি যোগাযোগ' },
                { en: 'Reduce surplus wastage', bn: 'অতিরিক্ত ফলন নষ্ট হওয়া রোধ' },
                { en: 'International market reach', bn: 'আন্তর্জাতিক বাজারে প্রবেশের সুযোগ' }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#2E7D32]">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  {i18n.language === 'en' ? item.en : item.bn}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E0E8E0] shadow-sm">
            <h3 className="text-xl font-black text-[#1B301B] mb-4">
              {i18n.language === 'en' ? 'Process' : 'প্রক্রিয়া'}
            </h3>
            <div className="space-y-6">
              {[
                { en: 'Apply with details', bn: 'বিস্তারিত তথ্য দিয়ে আবেদন করুন' },
                { en: 'Admin reviews data', bn: 'এডমিন তথ্য যাচাই করবেন' },
                { en: 'Exporters contact you', bn: 'রপ্তানিকারক আপনার সাথে যোগাযোগ করবেন' }
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1B301B] text-white flex items-center justify-center font-black text-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm font-bold text-[#556B55]">
                    {i18n.language === 'en' ? step.en : step.bn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

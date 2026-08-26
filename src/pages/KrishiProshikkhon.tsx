import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Calendar,
  Award,
  DollarSign,
  Phone,
  User,
  MapPin,
  X,
  FileImage,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { db, auth, collection, addDoc, serverTimestamp } from '../lib/db';
import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';

const KrishiProshikkhon = () => {
  const { t, i18n } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifying, setVerifying] = useState({ front: false, back: false });
  const [isSuccess, setIsSuccess] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    phone: '',
    district: '',
    upazila: '',
    feeType: 'free',
    agentId: ''
  });

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifying(prev => ({ ...prev, [type]: true }));
    try {
      const url = await uploadToCloudinary(file, 'krishi-training');
      if (type === 'front') setNidFront(url);
      else setNidBack(url);
    } catch (err) {
      console.error("Training NID upload error:", err);
    } finally {
      setVerifying(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, district: e.target.value, upazila: '' });
  };

  const currentUpazilas = DISTRICT_UPAZILAS[formData.district] || [];

  const trainingTopics = [
    { 
      id: 'Fish Farming', 
      title: i18n.language === 'en' ? 'Modern Fish Farming' : 'আধুনিক মৎস্য চাষ', 
      icon: BookOpen, 
      color: 'bg-blue-500', 
      fee: 'Free',
      duration: '3 Days',
      desc: i18n.language === 'en' ? 'Learn advanced techniques for high-yield fish production.' : 'উচ্চ ফলনশীল মাছ উৎপাদনের উন্নত কৌশল শিখুন।'
    },
    { 
      id: 'Poultry Management', 
      title: i18n.language === 'en' ? 'Poultry Management' : 'পোল্ট্রি ব্যবস্থাপনা', 
      icon: Users, 
      color: 'bg-orange-500', 
      fee: '500 BDT',
      duration: '5 Days',
      desc: i18n.language === 'en' ? 'Master the art of commercial poultry farming and biosecurity.' : 'বাণিজ্যিক পোল্ট্রি খামার এবং বায়োসিকিউরিটি ব্যবস্থাপনায় দক্ষ হন।'
    },
    { 
      id: 'Cattle Rearing', 
      title: i18n.language === 'en' ? 'Modern Cattle Rearing' : 'আধুনিক গবাদি পশু পালন', 
      icon: GraduationCap, 
      color: 'bg-green-600', 
      fee: 'Free',
      duration: '2 Days',
      desc: i18n.language === 'en' ? 'Techniques for dairy and beef cattle health and nutrition.' : 'দুগ্ধ ও মাংসের গবাদি পশুর স্বাস্থ্য ও পুষ্টির কৌশল।'
    },
    { 
      id: 'Vegetable Cultivation', 
      title: i18n.language === 'en' ? 'Vegetable Cultivation' : 'শাকসবজি চাষ', 
      icon: Award, 
      color: 'bg-emerald-500', 
      fee: 'Free',
      duration: '1 Day',
      desc: i18n.language === 'en' ? 'Seasonal vegetable farming and pest management.' : 'মৌসুমী শাকসবজি চাষ এবং পোকা দমন ব্যবস্থাপনা।'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedTopic) return;

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both Front and Back of your NID card' : 'অনুগ্রহ করে ভোটার আইডি কার্ডের সামনের এবং পেছনের ছবি আপলোড করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trainingApplications'), {
        userId: auth.currentUser.uid,
        userName: formData.name,
        phone: formData.phone,
        district: formData.district,
        upazila: formData.upazila,
        nidFront,
        nidBack,
        trainingType: selectedTopic.title,
        feeType: formData.feeType,
        agentId: formData.agentId || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setShowForm(false);
        setSelectedTopic(null);
        setFormData({ 
          name: auth.currentUser?.displayName || '',
          phone: '', 
          district: '', 
          upazila: '', 
          feeType: 'free',
          agentId: ''
        });
        setNidFront(null);
        setNidBack(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Header Banner */}
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-organic-green shadow-3xl mb-4 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-organic-green opacity-0 group-hover:opacity-10 transition-opacity" />
            <GraduationCap size={64} className="sm:w-16 sm:h-16 relative z-10" />
          </motion.div>
          
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <BookOpen size={18} />
              {i18n.language === 'en' ? 'Krishi Proshikkhon' : 'কৃষি প্রশিক্ষণ'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'SKILL' : 'দক্ষতা'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words">{i18n.language === 'en' ? 'MASTERY' : 'উন্নয়ন'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {t('krishi_proshikkhon_desc')}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-organic-dark to-transparent pointer-events-none" />
      </header>

      {/* Training Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {trainingTopics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 border-2 border-[#E0E8E0] hover:border-[#4CAF50] transition-all hover:shadow-2xl group flex flex-col sm:flex-row gap-8"
          >
            <div className={cn("w-24 h-24 shrink-0 rounded-3xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", topic.color)}>
              <topic.icon size={40} />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#1B301B]">{topic.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-[#4CAF50]">
                      <Clock size={14} /> {topic.duration}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                      <DollarSign size={14} /> {topic.fee}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[#556B55] leading-relaxed">{topic.desc}</p>
              <button 
                onClick={() => {
                  setSelectedTopic(topic);
                  setFormData({ ...formData, feeType: topic.fee === 'Free' ? 'free' : 'paid' });
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 text-[#4CAF50] font-black uppercase tracking-widest text-sm hover:gap-4 transition-all"
              >
                {t('apply_now')} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-[#4CAF50] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                      {i18n.language === 'en' ? 'Application Form' : 'আবেদন ফর্ম'}
                    </h2>
                    <p className="text-green-50/80 text-sm font-bold uppercase tracking-widest">
                      {selectedTopic?.title}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest ml-1">
                      {i18n.language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4CAF50]" size={20} />
                      <input
                        required
                        type="text"
                        placeholder={i18n.language === 'en' ? 'Enter your name' : 'আপনার নাম লিখুন'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-[#F9FBF9] border-2 border-transparent focus:border-[#4CAF50] rounded-2xl outline-none transition-all font-medium text-[#1B301B] placeholder:text-[#8BA88B]"
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest ml-1">
                      {t('phone_number')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4CAF50]" size={20} />
                      <input
                        required
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-[#F9FBF9] border-2 border-transparent focus:border-[#4CAF50] rounded-2xl outline-none transition-all font-medium text-[#1B301B] placeholder:text-[#8BA88B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* District Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest ml-1">
                        {i18n.language === 'en' ? 'District' : 'জেলা'}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4CAF50]" size={20} />
                        <select
                          required
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-[#F9FBF9] border-2 border-transparent focus:border-[#4CAF50] rounded-2xl outline-none transition-all font-medium text-[#1B301B] appearance-none"
                        >
                          <option value="">{i18n.language === 'en' ? 'Select District' : 'জেলা নির্বাচন করুন'}</option>
                          {BANGLADESH_DISTRICTS.map(district => (
                            <option key={district.en} value={district.en}>
                              {i18n.language === 'en' ? district.en : district.bn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Upazila Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest ml-1">
                        {i18n.language === 'en' ? 'Upazila' : 'উপজেলা'}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4CAF50]" size={20} />
                        <select
                          required
                          value={formData.upazila}
                          onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-[#F9FBF9] border-2 border-transparent focus:border-[#4CAF50] rounded-2xl outline-none transition-all font-medium text-[#1B301B] appearance-none"
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Agent ID Field */}
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-organic-green uppercase tracking-widest ml-1">
                        Agent ID (Optional)
                      </label>
                      <input 
                        value={formData.agentId} 
                        onChange={e => setFormData({...formData, agentId: e.target.value})} 
                        className="w-full px-6 py-4 bg-white border-2 border-organic-green/30 focus:border-organic-green rounded-2xl outline-none transition-all font-medium text-organic-dark" 
                        placeholder="e.g. 1003"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest ml-1">
                        {i18n.language === 'en' ? 'NID Front' : 'এনআইডি সম্মুখ অংশ'}
                      </label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleNidUpload(e, 'front')}
                          className="hidden" 
                          id="nid-front"
                        />
                        <label 
                          htmlFor="nid-front"
                          className={cn(
                            "w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden",
                            nidFront ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                          )}
                        >
                          {nidFront ? (
                            <div className="flex flex-col items-center text-[#4CAF50] animate-in fade-in zoom-in duration-300 relative z-10 font-bold">
                              <CheckCircle2 size={24} />
                              <span className="text-[10px] font-black uppercase mt-1">{i18n.language === 'en' ? 'Uploaded' : 'সফল'}</span>
                              <img src={nidFront} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                            </div>
                          ) : (
                            <>
                              <FileImage className="text-[#8BA88B]" size={24} />
                              <span className="text-[10px] font-bold text-[#556B55] uppercase tracking-wider">{i18n.language === 'en' ? 'Front Side' : 'সামনের ছবি'}</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest ml-1">
                        {i18n.language === 'en' ? 'NID Back' : 'এনআইডি পেছনের অংশ'}
                      </label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleNidUpload(e, 'back')}
                          className="hidden" 
                          id="nid-back"
                        />
                        <label 
                          htmlFor="nid-back"
                          className={cn(
                            "w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden",
                            nidBack ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                          )}
                        >
                          {nidBack ? (
                            <div className="flex flex-col items-center text-[#4CAF50] animate-in fade-in zoom-in duration-300 relative z-10 font-bold">
                              <CheckCircle2 size={24} />
                              <span className="text-[10px] font-black uppercase mt-1">{i18n.language === 'en' ? 'Uploaded' : 'সফল'}</span>
                              <img src={nidBack} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="text-[#8BA88B]" size={24} />
                              <span className="text-[10px] font-bold text-[#556B55] uppercase tracking-wider">{i18n.language === 'en' ? 'Back Side' : 'পিছনের ছবি'}</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, feeType: 'free' })}
                      className={cn(
                        "py-4 rounded-2xl font-bold border-2 transition-all",
                        formData.feeType === 'free' ? "bg-[#4CAF50] border-[#4CAF50] text-white shadow-lg" : "bg-[#F9FBF9] border-transparent text-[#556B55]"
                      )}
                    >
                      {t('free_training')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, feeType: 'paid' })}
                      className={cn(
                        "py-4 rounded-2xl font-bold border-2 transition-all",
                        formData.feeType === 'paid' ? "bg-[#4CAF50] border-[#4CAF50] text-white shadow-lg" : "bg-[#F9FBF9] border-transparent text-[#556B55]"
                      )}
                    >
                      {t('paid_training')}
                    </button>
                  </div>

                  <button
                    disabled={isSubmitting || isSuccess}
                    type="submit"
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 mt-4",
                      isSuccess 
                        ? "bg-green-500 text-white" 
                        : "bg-[#4CAF50] text-white hover:bg-[#43A047] active:scale-[0.98]"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isSuccess ? (
                      <>
                        <CheckCircle2 size={24} />
                        {i18n.language === 'en' ? 'Application Sent!' : 'আবেদন পাঠানো হয়েছে!'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={24} />
                        {t('apply_now')}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        {[
          { icon: Award, title: i18n.language === 'en' ? 'Certification' : 'সার্টিফিকেশন', desc: i18n.language === 'en' ? 'Get recognized certificates after successful completion.' : 'সফলভাবে কোর্স সম্পন্ন করার পর সার্টিফিকেট প্রদান করা হয়।' },
          { icon: Users, title: i18n.language === 'en' ? 'Expert Trainers' : 'দক্ষ প্রশিক্ষক', desc: i18n.language === 'en' ? 'Learn from experienced agricultural specialists.' : 'অভিজ্ঞ কৃষি বিশেষজ্ঞদের কাছ থেকে হাতে-কলমে শিখুন।' },
          { icon: Calendar, title: i18n.language === 'en' ? 'Flexible Schedule' : 'নমনীয় সময়সূচী', desc: i18n.language === 'en' ? 'Choose batches that fit your farming schedule.' : 'আপনার চাষাবাদের সময়ের সাথে সামঞ্জস্যপূর্ণ ব্যাচ বেছে নিন।' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border-2 border-[#E0E8E0] space-y-6 hover:border-[#4CAF50] transition-all hover:shadow-xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#F0F5F0] flex items-center justify-center text-[#4CAF50] shadow-inner mb-2">
              <item.icon size={32} />
            </div>
            <h4 className="text-2xl font-black text-[#1B301B]">{item.title}</h4>
            <p className="text-[#556B55] leading-relaxed font-medium opacity-80">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KrishiProshikkhon;

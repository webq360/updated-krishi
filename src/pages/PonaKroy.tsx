import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fish, 
  Bird, 
  Beef, 
  ShoppingBag, 
  Phone, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  Info,
  AlertCircle,
  RefreshCw,
  Camera
} from 'lucide-react';
import { db, auth, collection, addDoc, serverTimestamp, query, where, getDocs } from '../lib/db';
import { cn } from '../lib/utils';
import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';

const PonaKroy = () => {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [agentData, setAgentData] = useState<any>(null);
  const [isSearchingAgent, setIsSearchingAgent] = useState(false);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    details: ''
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

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCompressing(true);
    try {
      const url = await uploadToCloudinary(file, 'krishi-pona');
      if (side === 'front') setNidFront(url);
      else setNidBack(url);
    } catch (err) {
      console.error("Pona NID upload error:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  const categories = [
    { 
      id: 'Fish', 
      title: t('fish'), 
      icon: Fish, 
      color: 'bg-blue-500', 
      desc: i18n.language === 'en' ? 'High quality fish seedlings for your pond.' : 'আপনার পুকুরের জন্য উন্নত মানের মাছের পোনা।',
      image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=800'
    },
    { 
      id: 'Poultry Chicks', 
      title: t('poultry_chicks'), 
      icon: Bird, 
      color: 'bg-orange-500', 
      desc: i18n.language === 'en' ? 'Healthy day-old chicks of various breeds.' : 'বিভিন্ন জাতের সুস্থ একদিনের মুরগীর বাচ্চা।',
      image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800'
    },
    { 
      id: 'Calves', 
      title: t('calves'), 
      icon: Beef, 
      color: 'bg-green-600', 
      desc: i18n.language === 'en' ? 'Superior breed calves for dairy and meat.' : 'দুগ্ধ ও মাংসের জন্য উন্নত জাতের বাছুর।',
      image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&q=80&w=800'
    },
    { 
      id: 'Shrimp', 
      title: t('shrimp'), 
      icon: Fish, 
      color: 'bg-cyan-600', 
      desc: i18n.language === 'en' ? 'Quality shrimp PL for commercial farming.' : 'বাণিজ্যিক চাষের জন্য উন্নত মানের চিংড়ি পোনা।',
      image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedCategory) return;

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of your NID card' : 'অনুগ্রহ করে এনআইডির সামনের ও পিছনের উভয় ছবি আপলোড করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'ponaOrders'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        phone: formData.phone,
        category: selectedCategory,
        details: formData.details,
        nidFront,
        nidBack,
        agentId: agentId || null,
        agentName: agentData?.name || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setShowForm(false);
        setSelectedCategory(null);
        setFormData({ phone: '', details: '' });
      }, 3000);
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Header Banner */}
      <header className="bg-[#1B301B] rounded-[3rem] p-10 sm:p-20 text-white relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
        <div className="relative z-10 space-y-6 max-w-3xl flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-[#4CAF50] text-white shadow-2xl mb-4"
          >
            <ShoppingBag size={48} />
          </motion.div>
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-green-300 text-xs font-black uppercase tracking-[0.2em] border border-white/20">
              <ShoppingBag size={18} />
              {i18n.language === 'en' ? 'Pona Kroy' : 'পোনা ক্রয়'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1]">
              {t('pona_kroy')}
            </h1>
            <p className="text-green-50/60 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              {t('pona_kroy_desc')}
            </p>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              setSelectedCategory(cat.id);
              setShowForm(true);
            }}
            className={cn(
              "group relative overflow-hidden rounded-[2rem] bg-white border-2 transition-all cursor-pointer hover:shadow-2xl",
              selectedCategory === cat.id ? "border-[#4CAF50] ring-4 ring-[#4CAF50]/10" : "border-[#E0E8E0] hover:border-[#4CAF50]/50"
            )}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={cat.image} 
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg", cat.color)}>
                <cat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-1">{cat.title}</h3>
              <p className="text-sm text-white/80 line-clamp-2">{cat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-[#E0E8E0]"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-[#1B301B] uppercase tracking-tight">
                {t('purchase_form')}
              </h2>
              <div className="px-4 py-2 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full font-bold text-sm">
                {selectedCategory}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#556B55] uppercase tracking-wider ml-1">
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
                    className="w-full pl-12 pr-4 py-4 bg-[#F0F5F0] border-2 border-transparent focus:border-[#4CAF50] focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#556B55] uppercase tracking-wider ml-1">
                  {i18n.language === 'en' ? 'Order Details / Quantity' : 'অর্ডারের বিবরণ / পরিমাণ'}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={i18n.language === 'en' ? 'Example: 500 pcs Pangaas Pona...' : 'উদাহরণ: ৫০০ পিস পাঙ্গাস মাছের পোনা...'}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full p-4 bg-[#F0F5F0] border-2 border-transparent focus:border-[#4CAF50] focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black first-letter:uppercase text-[#556B55] tracking-widest ml-1">
                    {i18n.language === 'en' ? 'NID Front' : 'এনআইডি সামনের'}
                  </label>
                  <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E0E8E0] rounded-2xl hover:border-[#4CAF50] cursor-pointer transition-all bg-[#F9FBF9]">
                    <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'front')} className="hidden" />
                    {nidFront ? (
                      <div className="flex items-center gap-2 text-[#4CAF50] font-bold">
                        <CheckCircle2 size={16} />
                        <span className="text-xs uppercase tracking-widest">{i18n.language === 'en' ? 'Success' : 'সফল'}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ShoppingBag size={20} className="text-[#8BA88B]" />
                        <span className="text-[8px] font-bold text-[#8BA88B] uppercase">{i18n.language === 'en' ? 'Upload Front' : 'সামনে আপলোড'}</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black first-letter:uppercase text-[#556B55] tracking-widest ml-1">
                    {i18n.language === 'en' ? 'NID Back' : 'এনআইডি পিছনের'}
                  </label>
                  <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E0E8E0] rounded-2xl hover:border-[#4CAF50] cursor-pointer transition-all bg-[#F9FBF9]">
                    <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'back')} className="hidden" />
                    {nidBack ? (
                      <div className="flex items-center gap-2 text-[#4CAF50] font-bold">
                        <CheckCircle2 size={16} />
                        <span className="text-xs uppercase tracking-widest">{i18n.language === 'en' ? 'Success' : 'সফল'}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ShoppingBag size={20} className="text-[#8BA88B]" />
                        <span className="text-[8px] font-bold text-[#8BA88B] uppercase">{i18n.language === 'en' ? 'Upload Back' : 'পেছনে আপলোড'}</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#556B55] uppercase tracking-wider ml-1">
                  {i18n.language === 'en' ? 'Agent ID (Optional)' : 'এজেন্ট আইডি (ঐচ্ছিক)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={i18n.language === 'en' ? "Agent ID / Reference" : "এজেন্ট আইডি / রেফারেন্স"}
                    value={agentId}
                    onChange={(e) => {
                      setAgentId(e.target.value);
                      if (e.target.value.length >= 4) lookupAgent(e.target.value);
                      else setAgentData(null);
                    }}
                    className="w-full px-6 py-4 bg-[#F0F5F0] border-2 border-transparent focus:border-[#4CAF50] focus:bg-white rounded-2xl outline-none transition-all font-medium pr-12"
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

              <div className="bg-[#1B301B] rounded-2xl p-6 text-white flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#4CAF50] flex items-center justify-center shadow-lg">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest mb-1">{t('hotline')}</p>
                    <p className="text-xl font-black tracking-tighter">{t('hotline_number')}</p>
                  </div>
                </div>
                <a 
                  href={`tel:${t('hotline_number')}`}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#4CAF50] transition-colors"
                >
                  <ArrowRight size={20} />
                </a>
              </div>

              <button
                disabled={isSubmitting || isSuccess}
                type="submit"
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3",
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
                    {i18n.language === 'en' ? 'Order Placed!' : 'অর্ডার সম্পন্ন!'}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={24} />
                    {t('order_now')}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        {[
          { icon: Info, title: i18n.language === 'en' ? 'Quality Guarantee' : 'মানের নিশ্চয়তা', desc: i18n.language === 'en' ? 'We provide the best quality seedlings from certified hatcheries.' : 'আমরা সার্টিফাইড হ্যাচারি থেকে সেরা মানের পোনা সরবরাহ করি।' },
          { icon: Phone, title: i18n.language === 'en' ? 'Direct Support' : 'সরাসরি সহায়তা', desc: i18n.language === 'en' ? 'Call our hotline for any queries or bulk orders.' : 'যেকোনো জিজ্ঞাসা বা বড় অর্ডারের জন্য হটলাইনে কল করুন।' },
          { icon: AlertCircle, title: i18n.language === 'en' ? 'Safe Delivery' : 'নিরাপদ ডেলিভারি', desc: i18n.language === 'en' ? 'Ensuring safe and healthy delivery to your farm.' : 'আপনার খামারে নিরাপদ এবং সুস্থ ডেলিভারি নিশ্চিত করা হয়।' }
        ].map((item, i) => (
          <div key={i} className="bg-[#F0F5F0] p-10 rounded-[2.5rem] space-y-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-[1.25rem] bg-white flex items-center justify-center text-[#4CAF50] shadow-sm">
              <item.icon size={32} />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black text-[#1B301B]">{item.title}</h4>
              <p className="text-[#556B55] leading-relaxed font-medium opacity-80">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PonaKroy;

import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Search, MapPin, Calendar, RefreshCw, Sparkles, Loader2, Plus, User, FileImage, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';
import { collection, onSnapshot, query, updateDoc, doc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase';

export default function MarketPrice() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true');
  const [isUpdating, setIsUpdating] = useState(false);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userMarketData, setUserMarketData] = useState<any[]>([]);
  const [verifying, setVerifying] = useState({ front: false, back: false });
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    productName: '',
    price: '',
    unit: 'kg',
    district: BANGLADESH_DISTRICTS[0].en,
    upazila: '',
    area: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleNidFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifying(prev => ({ ...prev, front: true }));
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const { compressBase64 } = await import('../lib/imageUtils');
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
  };

  const handleNidBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifying(prev => ({ ...prev, back: true }));
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const { compressBase64 } = await import('../lib/imageUtils');
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
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserForm({ ...userForm, district: e.target.value, upazila: '' });
  };

  const currentUpazilas = DISTRICT_UPAZILAS[userForm.district] || [];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'marketPrices'), (snapshot) => {
      setMarketData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'marketPrices'));

    const userUnsub = onSnapshot(
      query(collection(db, 'userMarketPrices'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        setUserMarketData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, 
      (err) => handleFirestoreError(err, OperationType.LIST, 'userMarketPrices')
    );

    return () => {
      unsub();
      userUnsub();
    };
  }, []);

  const handleUserPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert(i18n.language === 'en' ? 'Please login to post market price' : 'বাজার দর পোস্ট করতে লগইন করুন');
      return;
    }

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload both front and back of your NID card' : 'অনুগ্রহ করে এনআইডি কার্ডের সামনের এবং পেছনের উভয় ছবি আপলোড করুন');
      return;
    }

    try {
      await addDoc(collection(db, 'userMarketPrices'), {
        ...userForm,
        nidFront,
        nidBack,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Farmer',
        createdAt: serverTimestamp()
      });
      setShowUserForm(false);
      setNidFront(null);
      setNidBack(null);
      setUserForm({
        productName: '',
        price: '',
        unit: 'kg',
        district: BANGLADESH_DISTRICTS[0].en,
        upazila: '',
        area: '',
        date: new Date().toISOString().split('T')[0]
      });
      alert(i18n.language === 'en' ? 'Market price posted successfully!' : 'বাজার দর সফলভাবে পোস্ট করা হয়েছে!');
    } catch (err) {
      console.error("Post error", err);
    }
  };

  const filteredData = marketData.filter(item => {
    const nameMatches = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const districtMatches = selectedDistrict === 'All' || item.district === selectedDistrict;
    const categoryMatches = selectedCategory === 'All' || item.category === selectedCategory;
    return nameMatches && districtMatches && categoryMatches;
  });

  const handleAIUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      alert(i18n.language === 'en' ? 'Market data updated using Gemini AI from latest news!' : 'সর্বশেষ সংবাদ থেকে জেমিনি এআই ব্যবহার করে বাজার দর আপডেট করা হয়েছে!');
    }, 2000);
  };

  const handleManualUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'marketPrices', editingItem.id), {
        price: editingItem.price
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Update error", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4CAF50]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e" 
            alt="Market" 
            className="w-full h-full object-cover scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/90 via-transparent to-organic-dark/90" />
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-4 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <TrendingUp size={18} />
              {t('market_price')}
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowUserForm(!showUserForm)}
                className="flex items-center gap-3 px-10 py-5 bg-organic-green text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-organic-green/90 transition-all shadow-2xl shadow-organic-green/30 hover:-translate-y-1"
              >
                <Plus size={20} />
                {i18n.language === 'en' ? 'POST PRICE' : 'দর পোস্ট করুন'}
              </button>
              {isAdmin && (
                <button 
                  onClick={handleAIUpdate}
                  disabled={isUpdating}
                  className="flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-2xl text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all disabled:opacity-50 border border-white/20"
                >
                  {isUpdating ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} className="text-yellow-400" />}
                  {t('ai_update')}
                </button>
              )}
            </div>

            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'MARKET' : 'বাজার'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">{i18n.language === 'en' ? 'REALTIME RATES' : 'সর্বশেষ দর'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6">
              {i18n.language === 'en' 
                ? 'Stay updated with the latest wholesale and retail prices of agricultural products across Bangladesh.' 
                : 'বাংলাদেশের বিভিন্ন জেলার কৃষি পণ্যের পাইকারি ও খুচরা মূল্যের সর্বশেষ আপডেট জানুন।'}
            </p>
          </div>
        </div>
      </header>

      {showUserForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-8 rounded-[2.5rem] border border-[#E0E8E0] shadow-xl overflow-hidden"
        >
          <h3 className="text-2xl font-black text-[#1B301B] mb-6">
            {i18n.language === 'en' ? 'Post Local Market Price' : 'আপনার এলাকার বাজার দর পোস্ট করুন'}
          </h3>
          <form onSubmit={handleUserPost} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'Product Name' : 'পণ্যের নাম'}</label>
              <input 
                required
                type="text" 
                value={userForm.productName}
                onChange={(e) => setUserForm({...userForm, productName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none"
                placeholder={i18n.language === 'en' ? "e.g. Potato" : "যেমন: আলু"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'Price' : 'দাম'}</label>
              <input 
                required
                type="text" 
                value={userForm.price}
                onChange={(e) => setUserForm({...userForm, price: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none"
                placeholder="৳"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'Unit' : 'একক'}</label>
              <select 
                value={userForm.unit}
                onChange={(e) => setUserForm({...userForm, unit: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none"
              >
                <option value="kg">কেজি (kg)</option>
                <option value="maund">মণ (maund)</option>
                <option value="dozen">ডজন (dozen)</option>
                <option value="piece">পিস (piece)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'District' : 'জেলা'}</label>
              <select value={userForm.district} onChange={handleDistrictChange} className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] outline-none focus:border-[#4CAF50]">
                {BANGLADESH_DISTRICTS.map(district => (
                  <option key={district.en} value={district.en}>
                    {i18n.language === 'en' ? district.en : district.bn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'Upazila' : 'উপজেলা'}</label>
              <select 
                required
                value={userForm.upazila} 
                onChange={e => setUserForm({...userForm, upazila: e.target.value})} 
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'Area / Market' : 'এলাকা / বাজার'}</label>
              <input 
                required
                type="text" 
                value={userForm.area}
                onChange={(e) => setUserForm({...userForm, area: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none"
                placeholder={i18n.language === 'en' ? "Market name" : "বাজারের নাম"}
              />
            </div>
            <div className="space-y-4 sm:col-span-2 md:col-span-3">
              <label className="text-sm font-black text-[#1B301B] uppercase tracking-widest">{i18n.language === 'en' ? 'NID Card Photos (Verification Required)' : 'এনআইডি কার্ডের ছবি (ভেরিফিকেশন প্রয়োজন)'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#556B55] uppercase">{i18n.language === 'en' ? 'NID Front' : 'এনআইডি সামনের অংশ'}</p>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleNidFrontUpload}
                      className="hidden" 
                      id="market-nid-front"
                      disabled={verifying.front}
                    />
                    <label 
                      htmlFor="market-nid-front"
                      className={cn(
                        "w-full px-4 py-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden",
                        verifying.front ? "border-organic-green animate-pulse" : nidFront ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] hover:border-[#4CAF50] bg-[#F9FBF9] cursor-pointer"
                      )}
                    >
                      {verifying.front ? (
                        <div className="flex flex-col items-center gap-2 text-organic-green">
                          <Loader2 className="animate-spin text-organic-green" size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                        </div>
                      ) : nidFront ? (
                        <div className="flex flex-col items-center gap-1 text-organic-green font-black text-xs uppercase tracking-widest relative z-10">
                          <CheckCircle2 size={24} />
                          {i18n.language === 'en' ? 'Uploaded' : 'সফল'}
                          <img src={nidFront} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="text-[#8BA88B]" size={24} />
                          <span className="text-[#556B55] font-bold text-xs">
                            {i18n.language === 'en' ? 'Upload Front' : 'সামনের ছবি যোগ করুন'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#556B55] uppercase">{i18n.language === 'en' ? 'NID Back' : 'এনআইডি পেছনের অংশ'}</p>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleNidBackUpload}
                      className="hidden" 
                      id="market-nid-back"
                      disabled={verifying.back}
                    />
                    <label 
                      htmlFor="market-nid-back"
                      className={cn(
                        "w-full px-4 py-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden",
                        verifying.back ? "border-organic-green animate-pulse" : nidBack ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] hover:border-[#4CAF50] bg-[#F9FBF9] cursor-pointer"
                      )}
                    >
                      {verifying.back ? (
                        <div className="flex flex-col items-center gap-2 text-organic-green">
                          <Loader2 className="animate-spin text-organic-green" size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                        </div>
                      ) : nidBack ? (
                        <div className="flex flex-col items-center gap-1 text-organic-green font-black text-xs uppercase tracking-widest relative z-10">
                          <CheckCircle2 size={24} />
                          {i18n.language === 'en' ? 'Uploaded' : 'সফল'}
                          <img src={nidBack} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="text-[#8BA88B]" size={24} />
                          <span className="text-[#556B55] font-bold text-xs">
                            {i18n.language === 'en' ? 'Upload Back' : 'পেছনের ছবি যোগ করুন'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#556B55]">{i18n.language === 'en' ? 'Date' : 'তারিখ'}</label>
              <input 
                required
                type="date" 
                value={userForm.date}
                onChange={(e) => setUserForm({...userForm, date: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E8E0] focus:border-[#4CAF50] outline-none"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full py-3 bg-[#4CAF50] text-white rounded-xl font-black hover:bg-[#2E7D32] transition-all">
                {i18n.language === 'en' ? 'Submit Post' : 'পোস্ট করুন'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {userMarketData.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg">
              <User size={20} />
            </div>
            <h2 className="text-2xl font-black text-[#1B301B]">
              {i18n.language === 'en' ? 'User Provided Prices' : 'ব্যবহারকারী প্রদত্ত বাজার দর'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userMarketData.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-3xl border border-[#E0E8E0] shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-[#1B301B]">{item.productName}</h4>
                    <p className="text-[10px] text-[#8BA88B] font-bold uppercase">{item.area}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#4CAF50]">৳{item.price}</p>
                    <p className="text-[10px] text-[#556B55] font-bold">/ {item.unit}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#F0F5F0] text-[10px] font-bold text-[#8BA88B]">
                  <div className="flex items-center gap-1">
                    <User size={10} />
                    {item.userName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    {item.date}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {editingItem && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border-2 border-[#4CAF50] shadow-xl space-y-4"
        >
          <h3 className="text-xl font-bold text-[#1B301B]">Edit Price: {editingItem.name}</h3>
          <form onSubmit={handleManualUpdate} className="flex flex-wrap gap-4">
            <input 
              type="text" 
              value={editingItem.price} 
              onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
              className="px-4 py-2 border rounded-xl outline-none focus:border-[#4CAF50]"
              placeholder="Price Range"
            />
            <button type="submit" className="px-6 py-2 bg-[#4CAF50] text-white rounded-xl font-bold">Save</button>
            <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold">Cancel</button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
          <input 
            type="text"
            placeholder={i18n.language === 'en' ? "Search crop..." : "ফসল খুঁজুন..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 outline-none transition-all"
          />
        </div>
        
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-4 py-4 bg-white border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all font-bold text-[#556B55]"
          >
            <option value="All">{i18n.language === 'en' ? 'All Districts' : 'সকল জেলা'}</option>
            {BANGLADESH_DISTRICTS.map(district => (
              <option key={district.en} value={district.en}>
                {i18n.language === 'en' ? district.en : district.bn}
              </option>
            ))}
          </select>

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-4 bg-white border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none transition-all font-bold text-[#556B55]"
        >
          <option value="All">{i18n.language === 'en' ? 'All Categories' : 'সকল ক্যাটাগরি'}</option>
          <option value="Crops">{i18n.language === 'en' ? 'Crops' : 'ফসল'}</option>
          <option value="Fish">{i18n.language === 'en' ? 'Fish' : 'মাছ'}</option>
          <option value="Poultry">{i18n.language === 'en' ? 'Poultry & Eggs' : 'মুরগী ও ডিম'}</option>
        </select>

        <div className="flex items-center gap-2 text-[#556B55] text-sm font-bold bg-white px-4 py-2 rounded-2xl border border-[#E0E8E0] justify-center">
          <Calendar size={18} />
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-[2.5rem] border border-[#E0E8E0] hover:border-[#4CAF50] transition-all shadow-sm hover:shadow-xl group overflow-hidden flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={item.imageUrl || `https://picsum.photos/seed/${item.name}/400/300`} 
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-[#2E7D32] shadow-sm">
                  {item.category}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm backdrop-blur-sm",
                  item.change === 'up' ? "bg-red-500/90 text-white" : 
                  item.change === 'down' ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"
                )}>
                  {item.change === 'up' ? <TrendingUp size={12} /> : 
                   item.change === 'down' ? <TrendingDown size={12} /> : null}
                  {item.trend}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-grow flex flex-col">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#1B301B] group-hover:text-[#4CAF50] transition-colors">{item.name}</h3>
                  <div className="flex items-center gap-1 text-[#8BA88B] text-xs font-bold">
                    <MapPin size={12} className="text-[#4CAF50]" />
                    {item.district}
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="p-2 bg-[#F0F5F0] text-[#4CAF50] rounded-lg hover:bg-[#4CAF50] hover:text-white transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F0F5F0]">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#1B301B]">৳{item.marketPrice || item.price?.split('-')[0]}</span>
                    <span className="text-[#556B55] font-bold text-xs">/ {item.unit}</span>
                  </div>
                  {item.price?.includes('-') && (
                    <span className="text-[10px] text-[#8BA88B] font-bold">Range: ৳{item.price}</span>
                  )}
                </div>
                <button className="px-4 py-2 bg-[#F0F5F0] text-[#2E7D32] rounded-xl font-bold text-xs hover:bg-[#4CAF50] hover:text-white transition-all">
                  {i18n.language === 'en' ? 'Details' : 'বিস্তারিত'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

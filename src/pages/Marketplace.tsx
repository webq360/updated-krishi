import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, MapPin, Plus, Filter, Tag, MessageSquare, User, Loader2, X, Image as ImageIcon, CreditCard, ShieldCheck, CheckCircle2, Camera, CheckCircle, Info, Phone } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../firebase';
import { compressBase64 } from '../lib/imageUtils';

export default function Marketplace() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdPaymentModal, setShowAdPaymentModal] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adPaymentStep, setAdPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    unit: 'kg',
    district: '',
    category: 'Crops',
    description: '',
    contact: '',
    imageUrl: '',
    agentId: ''
  });

  const [adType, setAdType] = useState<'free' | 'paid'>('free');

  const AD_CHARGE = 50;
  const PAYMENT_NUMBER = '+8801634-651943';

  useEffect(() => {
    const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'marketplace'));
    return () => unsub();
  }, []);

  const handleAddProductClick = () => {
    setShowAddModal(true);
  };

  const createNotification = async (product: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title: i18n.language === 'en' ? 'New Featured Product!' : 'নতুন ফিচারড পণ্য!',
        body: i18n.language === 'en' 
          ? `${product.name} is now available in the marketplace for ৳${product.price}.` 
          : `${product.name} এখন বাজারে পাওয়া যাচ্ছে, দাম মাত্র ৳${product.price}।`,
        type: 'info',
        userId: 'all',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const handleNidUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressBase64(base64, 400, 400, 0.3);
        if (side === 'front') setNidFront(compressed);
        else setNidBack(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompressing) return;

    if (!nidFront || !nidBack) {
      alert(i18n.language === 'en' ? 'Please upload NID front and back' : 'এনআইডির সামনে এবং পিছনের ছবি আপলোড করুন');
      return;
    }
    
    if (adType === 'paid') {
      setShowAddModal(false);
      setAdPaymentStep('details');
      setShowAdPaymentModal(true);
    } else {
      // Free posting directly
      try {
        setLoading(true);
        if (!auth.currentUser) return;
        await addDoc(collection(db, 'marketplace'), {
          ...newProduct,
          nidFront,
          nidBack,
          sellerId: auth.currentUser.uid,
          sellerName: auth.currentUser.displayName || 'Farmer',
          createdAt: serverTimestamp(),
          isPaid: false
        });
        setShowAddModal(false);
        setLoading(false);
        setImagePreview(null);
        setNidFront(null);
        setNidBack(null);
        setNewProduct({
          name: '',
          price: '',
          unit: 'kg',
          district: '',
          category: 'Crops',
          description: '',
          contact: '',
          imageUrl: '',
          agentId: ''
        });
      } catch (err) {
        console.error("Add free product error:", err);
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressBase64(base64, 400, 400, 0.3);
        setImagePreview(compressed);
        setNewProduct(prev => ({ ...prev, imageUrl: compressed }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAdPayment = async () => {
    setAdPaymentStep('processing');
    
    // Simulate payment processing
    setTimeout(async () => {
      if (!auth.currentUser) return;
      
      try {
        await addDoc(collection(db, 'marketplace'), {
          ...newProduct,
          nidFront,
          nidBack,
          sellerId: auth.currentUser.uid,
          sellerName: auth.currentUser.displayName || 'Farmer',
          createdAt: serverTimestamp(),
          isPaid: true
        });
        
        await createNotification(newProduct);
        
        setAdPaymentStep('success');
        setNidFront(null);
        setNidBack(null);
        setNewProduct({
          name: '',
          price: '',
          unit: 'kg',
          district: '',
          category: 'Crops',
          description: '',
          contact: '',
          imageUrl: '',
          agentId: ''
        });
      } catch (err) {
        console.error("Add product error:", err);
        setAdPaymentStep('details');
      }
    }, 2000);
  };

  const handleBuyNow = (product: any) => {
    setSelectedProduct(product);
    setPaymentStep('details');
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
    }, 2000);
  };

  const categories = ['All', 'Crops', 'Vegetables', 'Fruits', 'Fish', 'Poultry', 'Livestock', 'Subscription'];

  const filteredProducts = products
    .sort((a, b) => {
      // Sort by paid status first
      if (a.isPaid && !b.isPaid) return -1;
      if (!a.isPaid && b.isPaid) return 1;
      // Then by date
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    })
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4CAF50]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="bg-[#1B301B] rounded-[3rem] p-10 sm:p-20 text-white relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
        <div className="relative z-10 space-y-6 max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-green-300 text-xs font-black uppercase tracking-[0.2em] border border-white/20">
            <ShoppingBag size={18} />
            {t('marketplace')}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center max-w-[90%] mx-auto">
            {i18n.language === 'en' ? 'Farmer\'s Marketplace' : 'কৃষক বাজার'}
          </h1>
          <p className="text-green-50/60 font-bold text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Sell your produce directly to buyers or find the best agricultural products from fellow farmers.' 
              : 'আপনার উৎপাদিত পণ্য সরাসরি ক্রেতাদের কাছে বিক্রি করুন অথবা অন্য কৃষকদের কাছ থেকে সেরা কৃষি পণ্য খুঁজে নিন।'}
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddProductClick}
            className="px-12 py-6 bg-[#4CAF50] text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-[#43A047] transition-all shadow-[0_20px_50px_rgba(74,222,128,0.3)] flex items-center gap-4 mt-6"
          >
            <Plus size={24} />
            {i18n.language === 'en' ? 'Post Your Product' : 'আপনার পণ্য যোগ করুন'}
          </motion.button>
        </div>
        <ShoppingBag className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12" />
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
          <input
            type="text"
            placeholder={i18n.language === 'en' ? 'Search products...' : 'পণ্য খুঁজুন...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-surface rounded-2xl border border-[#E0E8E0] dark:border-dark-border focus:border-[#4CAF50] outline-none transition-all shadow-sm text-organic-dark dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border",
                selectedCategory === cat 
                  ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-lg shadow-green-900/20" 
                  : "bg-white dark:bg-dark-surface text-[#556B55] dark:text-gray-400 border-[#E0E8E0] dark:border-dark-border hover:border-[#4CAF50]"
              )}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            className={cn(
              "bg-white dark:bg-dark-surface rounded-[2.5rem] border overflow-hidden hover:shadow-2xl transition-all group relative",
              product.isPaid ? "border-organic-green ring-2 ring-organic-green/10" : "border-[#E0E8E0] dark:border-dark-border"
            )}
          >
            {product.isPaid && (
              <div className="absolute top-4 right-4 z-10 bg-organic-dark text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-1.5 border border-white/10">
                <CheckCircle2 size={10} className="text-organic-green" />
                Featured Ad
              </div>
            )}
            <div className="h-48 bg-[#F0F5F0] dark:bg-dark-bg relative flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon size={48} className="text-[#8BA88B]/30" />
              )}
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-organic-green uppercase tracking-[0.1em] shadow-sm border border-organic-green/5">
                {product.category}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-black text-[#1B301B] dark:text-white line-clamp-1 group-hover:text-organic-green transition-colors">{product.name}</h3>
                <div className="text-organic-green font-black text-lg">
                  ৳{product.price} <span className="text-[10px] text-[#8BA88B] dark:text-gray-400 font-bold uppercase tracking-tighter">/ {product.unit}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[#556B55] dark:text-gray-300 text-xs mb-4 font-bold">
                <div className="w-6 h-6 bg-organic-green/10 rounded-lg flex items-center justify-center">
                  <MapPin size={12} className="text-organic-green" />
                </div>
                {product.district}
              </div>
...
              <p className="text-sm text-[#556B55]/70 dark:text-gray-400 line-clamp-2 mb-6 h-10 font-medium leading-relaxed">
                {product.description}
              </p>

              <div className="pt-6 border-t border-[#F0F5F0] dark:border-dark-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-organic-green text-white flex items-center justify-center text-xs font-black shadow-lg shadow-organic-green/20">
                      {product.sellerName[0]}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[#8BA88B] dark:text-gray-500 block uppercase tracking-widest leading-none mb-1">Seller</span>
                      <span className="text-xs font-bold text-[#1B301B] dark:text-gray-200">{product.sellerName}</span>
                    </div>
                  </div>
                  <a 
                    href={`tel:${product.contact}`}
                    className="w-10 h-10 bg-white border border-organic-green/20 text-organic-green hover:bg-organic-green hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm"
                  >
                    <Phone size={18} />
                  </a>
                </div>
                <button 
                  onClick={() => handleBuyNow(product)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm mt-2",
                    product.isPaid 
                      ? "bg-organic-dark text-white hover:bg-black shadow-xl shadow-black/10" 
                      : "bg-organic-green text-white hover:bg-organic-dark shadow-organic-green/10"
                  )}
                >
                  <CreditCard size={14} />
                  {i18n.language === 'en' ? 'Buy Now' : 'এখনই কিনুন'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {paymentStep === 'details' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">Checkout</h2>
                    <button onClick={() => setShowPaymentModal(false)} className="dark:text-white"><X size={24} /></button>
                  </div>
                  
                  <div className="p-4 bg-[#F9FBF9] dark:bg-dark-bg rounded-2xl border border-[#E0E8E0] dark:border-dark-border flex items-center gap-4">
                    <div className="w-16 h-16 bg-white dark:bg-dark-surface rounded-xl flex items-center justify-center text-[#8BA88B]">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-[#1B301B] dark:text-white">{selectedProduct?.name}</p>
                      <p className="text-sm text-[#4CAF50] font-black">৳{selectedProduct?.price}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] dark:text-gray-400 uppercase tracking-widest">Payment Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="p-4 border-2 border-[#4CAF50] bg-[#F0F5F0] dark:bg-organic-green/10 rounded-2xl flex flex-col items-center gap-2">
                          <div className="w-8 h-8 bg-pink-500 rounded-lg" />
                          <span className="text-xs font-bold dark:text-white">bKash</span>
                        </button>
                        <button className="p-4 border-2 border-[#E0E8E0] dark:border-dark-border rounded-2xl flex flex-col items-center gap-2 opacity-50">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg" />
                          <span className="text-xs font-bold dark:text-white">Nagad</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] dark:text-gray-400 uppercase tracking-widest">Phone Number</label>
                      <input type="tel" placeholder="01XXXXXXXXX" className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl outline-none focus:border-[#4CAF50] dark:text-white" />
                    </div>
                  </div>

                  <button 
                    onClick={processPayment}
                    className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold shadow-xl shadow-green-900/20"
                  >
                    Pay ৳{selectedProduct?.price}
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#8BA88B] font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    Secure SSL Encryption
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-black text-[#1B301B]">Processing Payment</h3>
                    <p className="text-[#556B55]">Please do not close this window...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#1B301B]">Payment Successful!</h3>
                    <p className="text-[#556B55]">Your order has been placed. The seller will contact you soon.</p>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-4 bg-[#1B301B] text-white rounded-2xl font-bold"
                  >
                    Back to Marketplace
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">
                  {i18n.language === 'en' ? 'Sell Your Product' : 'পণ্য বিক্রি করুন'}
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-[#F0F5F0] dark:hover:bg-dark-bg rounded-full transition-colors dark:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePostProduct} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-organic-dark dark:text-gray-400 uppercase tracking-[0.2em] ml-2">{t('ad_type')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAdType('free');
                          setImagePreview(null);
                          setNewProduct({...newProduct, imageUrl: ''});
                        }}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                          adType === 'free' 
                            ? "bg-white dark:bg-dark-surface border-organic-green text-organic-green shadow-xl shadow-organic-green/10" 
                            : "bg-gray-50 dark:bg-dark-bg border-transparent text-[#8BA88B] opacity-60"
                        )}
                      >
                        {t('free_ad')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdType('paid')}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                          adType === 'paid' 
                            ? "bg-white dark:bg-dark-surface border-organic-dark dark:border-white text-organic-dark dark:text-white shadow-xl shadow-black/10" 
                            : "bg-gray-50 dark:bg-dark-bg border-transparent text-[#8BA88B] opacity-60"
                        )}
                      >
                        {t('featured_ad')}
                      </button>
                    </div>
                    <div className="p-4 bg-organic-light/50 dark:bg-dark-bg/50 rounded-2xl border border-organic-green/10">
                      <p className="text-[10px] font-bold text-organic-dark/60 dark:text-gray-400 leading-relaxed uppercase tracking-tight">
                        <Info size={12} className="inline mr-2 text-organic-green" />
                        {adType === 'paid' ? t('paid_benefit') : (i18n.language === 'en' ? 'Free ads appear below paid ones. Photos and notifications are not available for free ads.' : 'ফ্রি বিজ্ঞাপন তালিকার নিচে থাকবে। ছবি এবং নোটিফিকেশন সুবিধা ফ্রি বিজ্ঞাপনে নেই।')}
                      </p>
                    </div>
                  </div>

                  {adType === 'paid' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">Product Image</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label
                          htmlFor="product-image-upload"
                          className={cn(
                            "w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden bg-[#F9FBF9] dark:bg-dark-bg",
                            imagePreview ? "border-[#4CAF50]" : "border-[#E0E8E0] dark:border-dark-border hover:border-[#4CAF50]"
                          )}
                        >
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <Camera className="text-[#8BA88B]" size={32} />
                              <span className="text-[#556B55] dark:text-gray-400 font-bold text-sm">Click to upload photo</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">Product Name</label>
                    <input
                      required
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                      placeholder="e.g. Organic Rice"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-organic-green uppercase tracking-widest ml-2">Agent ID (Optional)</label>
                    <input
                      type="text"
                      value={newProduct.agentId}
                      onChange={(e) => setNewProduct({...newProduct, agentId: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-organic-green/30 rounded-2xl focus:border-organic-green outline-none text-organic-dark dark:text-white"
                      placeholder="e.g. 1005"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">Verification (NID Front & Back)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'front')} className="hidden" id="marketplace-nid-front" />
                        <label htmlFor="marketplace-nid-front" className={cn(
                          "w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all overflow-hidden",
                          nidFront ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                        )}>
                          {nidFront ? <img src={nidFront} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black uppercase">Front</span>}
                        </label>
                      </div>
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={(e) => handleNidUpload(e, 'back')} className="hidden" id="marketplace-nid-back" />
                        <label htmlFor="marketplace-nid-back" className={cn(
                          "w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all overflow-hidden",
                          nidBack ? "border-organic-green bg-organic-green/5" : "border-[#E0E8E0] bg-[#F9FBF9] hover:border-organic-green cursor-pointer"
                        )}>
                          {nidBack ? <img src={nidBack} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black uppercase">Back</span>}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Price (৳)</label>
                    <input
                      required
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Unit</label>
                    <select
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="maund">maund</option>
                      <option value="piece">piece</option>
                      <option value="dozen">dozen</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">District</label>
                    <input
                      required
                      type="text"
                      value={newProduct.district}
                      onChange={(e) => setNewProduct({...newProduct, district: e.target.value})}
                      className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                      placeholder="e.g. Bogura"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Contact Number</label>
                  <input
                    required
                    type="tel"
                    value={newProduct.contact}
                    onChange={(e) => setNewProduct({...newProduct, contact: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                    placeholder="017XXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Description</label>
                  <textarea
                    required
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none h-24 resize-none"
                    placeholder="Tell buyers about your product..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#4CAF50] text-white font-bold rounded-2xl hover:bg-[#43A047] transition-all shadow-xl shadow-green-900/20 mt-4"
                >
                  {i18n.language === 'en' ? 'Post Product' : 'পণ্য পোস্ট করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Ad Posting Payment Modal */}
      <AnimatePresence>
        {showAdPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdPaymentModal(false)}
              className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {adPaymentStep === 'details' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#1B301B]">Ad Posting Fee</h2>
                    <button onClick={() => setShowAdPaymentModal(false)}><X size={24} /></button>
                  </div>
                  
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                    <div className="flex items-center gap-3 text-amber-800">
                      <ShieldCheck size={24} />
                      <p className="font-bold">Verification Required</p>
                    </div>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      To prevent spam and ensure quality, we charge a small fee of <b>৳{AD_CHARGE}</b> for each ad post.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0] space-y-2">
                      <p className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest">Send Money To (Personal)</p>
                      <p className="text-xl font-black text-[#1B301B] flex items-center justify-between">
                        {PAYMENT_NUMBER}
                        <span className="text-[10px] px-2 py-1 bg-[#4CAF50] text-white rounded-md">bKash/Nagad</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8BA88B] uppercase tracking-widest">Transaction ID (TrxID)</label>
                      <input 
                        type="text" 
                        placeholder="8N7X..." 
                        className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl outline-none focus:border-[#4CAF50] font-mono" 
                      />
                    </div>
                  </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowAdPaymentModal(false);
                      setShowAddModal(true);
                    }}
                    className="flex-1 py-4 bg-gray-100 text-[#1B301B] rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={processAdPayment}
                    className="flex-1 py-4 bg-[#4CAF50] text-white rounded-2xl font-bold shadow-xl shadow-green-900/20"
                  >
                    Confirm Payment
                  </button>
                </div>
                </div>
              )}

              {adPaymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-black text-[#1B301B]">Verifying Payment</h3>
                    <p className="text-[#556B55]">This usually takes a few seconds...</p>
                  </div>
                </div>
              )}

              {adPaymentStep === 'success' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#1B301B]">Ad Posted!</h3>
                    <p className="text-[#556B55]">Your product is now live in the marketplace.</p>
                  </div>
                  <button 
                    onClick={() => setShowAdPaymentModal(false)}
                    className="w-full py-4 bg-[#1B301B] text-white rounded-2xl font-bold"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

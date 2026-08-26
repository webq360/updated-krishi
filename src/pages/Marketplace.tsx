import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Plus, 
  Filter, 
  Tag, 
  MessageSquare, 
  User, 
  Loader2, 
  X, 
  Image as ImageIcon, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Camera, 
  Info, 
  Phone, 
  Trash2,
  Share2
} from 'lucide-react';
import { 
  db, 
  auth, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp, 
  handleFirestoreError, 
  OperationType 
} from '../lib/db';
import { BANGLADESH_DISTRICTS } from '../constants/districts';
import { cn } from '../lib/utils';
import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';
import { safeLocalStorage } from '../lib/storage';

export default function Marketplace() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdPaymentModal, setShowAdPaymentModal] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adPaymentStep, setAdPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = safeLocalStorage.getItem('isAdmin') === 'true' || safeLocalStorage.getItem('isManager') === 'true';
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.id || currentUser?.uid || currentUser?._id;

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    unit: 'kg',
    district: 'Dhaka',
    category: 'Crops',
    description: '',
    contact: '',
    sellerName: '',
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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'marketplace');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddProductClick = () => {
    if (currentUser) {
      setNewProduct(prev => ({
        ...prev,
        contact: prev.contact || currentUser.phone || '',
        sellerName: prev.sellerName || currentUser.name || currentUser.displayName || ''
      }));
    }
    setShowAddModal(true);
  };

  const createNotification = async (product: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title: i18n.language === 'en' ? 'New Featured Product!' : 'নতুন ফিচারড পণ্য!',
        body: i18n.language === 'en' 
          ? `${product.name} is now available in the marketplace for ৳${product.price}/${product.unit}.` 
          : `${product.name} এখন বাজারে পাওয়া যাচ্ছে, দাম মাত্র ৳${product.price}/${product.unit}।`,
        type: 'info',
        userId: 'all',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const uploadedUrl = await uploadToCloudinary(file, 'krishi-marketplace');
        setImagePreview(uploadedUrl);
        setNewProduct(prev => ({ ...prev, imageUrl: uploadedUrl }));
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handlePostProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompressing) return;

    if (!newProduct.name || !newProduct.price || !newProduct.contact) {
      alert(i18n.language === 'en' ? 'Please fill in all required fields' : 'দয়া করে সব প্রয়োজনীয় তথ্য পূরণ করুন');
      return;
    }
    
    if (adType === 'paid') {
      setShowAddModal(false);
      setAdPaymentStep('details');
      setShowAdPaymentModal(true);
    } else {
      // Free posting directly
      try {
        setSubmitting(true);
        const resolvedSellerId = currentUserId || 'guest-' + Date.now();
        const resolvedSellerName = newProduct.sellerName || currentUser?.name || currentUser?.displayName || (i18n.language === 'en' ? 'Farmer' : 'কৃষক বন্ধু');

        await addDoc(collection(db, 'marketplace'), {
          ...newProduct,
          sellerId: resolvedSellerId,
          sellerName: resolvedSellerName,
          createdAt: serverTimestamp(),
          isPaid: false
        });

        setShowAddModal(false);
        setSubmitting(false);
        setImagePreview(null);
        setNewProduct({
          name: '',
          price: '',
          unit: 'kg',
          district: 'Dhaka',
          category: 'Crops',
          description: '',
          contact: '',
          sellerName: '',
          imageUrl: '',
          agentId: ''
        });
      } catch (err) {
        console.error("Add free product error:", err);
        setSubmitting(false);
      }
    }
  };

  const processAdPayment = async () => {
    setAdPaymentStep('processing');
    
    setTimeout(async () => {
      try {
        const resolvedSellerId = currentUserId || 'guest-' + Date.now();
        const resolvedSellerName = newProduct.sellerName || currentUser?.name || currentUser?.displayName || (i18n.language === 'en' ? 'Farmer' : 'কৃষক বন্ধু');

        await addDoc(collection(db, 'marketplace'), {
          ...newProduct,
          sellerId: resolvedSellerId,
          sellerName: resolvedSellerName,
          createdAt: serverTimestamp(),
          isPaid: true
        });
        
        await createNotification(newProduct);
        
        setAdPaymentStep('success');
        setImagePreview(null);
        setNewProduct({
          name: '',
          price: '',
          unit: 'kg',
          district: 'Dhaka',
          category: 'Crops',
          description: '',
          contact: '',
          sellerName: '',
          imageUrl: '',
          agentId: ''
        });
      } catch (err) {
        console.error("Add product error:", err);
        setAdPaymentStep('details');
      }
    }, 1500);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(i18n.language === 'en' ? 'Are you sure you want to remove this product?' : 'আপনি কি নিশ্চিত এই পণ্যটি মুছে ফেলতে চান?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'marketplace', productId));
    } catch (err) {
      console.error("Delete product error:", err);
    }
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
    }, 1500);
  };

  const categories = ['All', 'Crops', 'Vegetables', 'Fruits', 'Fish', 'Poultry', 'Livestock'];

  const filteredProducts = products
    .sort((a, b) => {
      // Sort by featured status first
      if (a.isPaid && !b.isPaid) return -1;
      if (!a.isPaid && b.isPaid) return 1;
      
      // Then by date descending
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA;
    })
    .filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.district || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesDistrict = selectedDistrict === 'All' || p.district === selectedDistrict;
      return matchesSearch && matchesCategory && matchesDistrict;
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
      {/* Hero Header */}
      <header className="bg-[#1B301B] rounded-[3rem] p-10 sm:p-20 text-white relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
        <div className="relative z-10 space-y-6 max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-green-300 text-xs font-black uppercase tracking-[0.2em] border border-white/20">
            <ShoppingBag size={18} />
            {t('marketplace')}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center max-w-[90%] mx-auto">
            {i18n.language === 'en' ? 'Farmer\'s Marketplace' : 'কৃষক বাজার'}
          </h1>
          <p className="text-green-50/80 font-medium text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Sell your produce directly to buyers or find the best agricultural products from fellow farmers.' 
              : 'আপনার উৎপাদিত ফসল ও পশুপাখি সরাসরি ক্রেতাদের কাছে বিক্রি করুন অথবা সেরা কৃষি পণ্য সংগ্রহ করুন।'}
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddProductClick}
            className="px-10 py-5 bg-[#4CAF50] text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-[#43A047] transition-all shadow-[0_20px_50px_rgba(74,222,128,0.3)] flex items-center gap-3 mt-6 text-sm"
          >
            <Plus size={22} />
            {i18n.language === 'en' ? 'Post Your Product' : 'আপনার পণ্য যোগ করুন'}
          </motion.button>
        </div>
        <ShoppingBag className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 pointer-events-none" />
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
          <input
            type="text"
            placeholder={i18n.language === 'en' ? 'Search by product name, district, seller...' : 'পণ্য, জেলা বা বিক্রেতার নাম দিয়ে খুঁজুন...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-surface rounded-2xl border border-[#E0E8E0] dark:border-dark-border focus:border-[#4CAF50] outline-none transition-all shadow-sm text-organic-dark dark:text-gray-100 text-sm font-medium"
          />
        </div>

        {/* District Filter */}
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-6 py-4 bg-white dark:bg-dark-surface rounded-2xl border border-[#E0E8E0] dark:border-dark-border text-[#1B301B] dark:text-gray-200 font-bold text-sm outline-none focus:border-[#4CAF50] transition-all"
        >
          <option value="All">{i18n.language === 'en' ? 'All Districts' : 'সকল জেলা'}</option>
          {BANGLADESH_DISTRICTS.map(d => (
            <option key={d.en} value={d.en}>
              {i18n.language === 'en' ? d.en : d.bn}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-4 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border",
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

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-dark-surface rounded-[2.5rem] border border-[#E0E8E0] dark:border-dark-border space-y-4">
          <ShoppingBag size={48} className="mx-auto text-[#8BA88B]/40" />
          <h3 className="text-xl font-black text-[#1B301B] dark:text-white">
            {i18n.language === 'en' ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}
          </h3>
          <p className="text-sm text-[#8BA88B]">
            {i18n.language === 'en' ? 'Try adjusting your search or be the first to post a product!' : 'অন্য ক্যাটাগরি বা জেলা বেছে নিন অথবা নতুন পণ্য যোগ করুন!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              className={cn(
                "bg-white dark:bg-dark-surface rounded-[2.5rem] border overflow-hidden hover:shadow-2xl transition-all group relative flex flex-col justify-between",
                product.isPaid ? "border-organic-green ring-2 ring-organic-green/20" : "border-[#E0E8E0] dark:border-dark-border"
              )}
            >
              <div>
                {product.isPaid && (
                  <div className="absolute top-4 right-4 z-10 bg-organic-dark text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-1.5 border border-white/10">
                    <CheckCircle2 size={10} className="text-organic-green" />
                    Featured Ad
                  </div>
                )}

                {/* Product Image */}
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

                {/* Content */}
                <div className="p-6 pb-2">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-black text-[#1B301B] dark:text-white line-clamp-1 group-hover:text-organic-green transition-colors">
                      {product.name}
                    </h3>
                    <div className="text-organic-green font-black text-lg whitespace-nowrap ml-2">
                      ৳{product.price} <span className="text-[10px] text-[#8BA88B] dark:text-gray-400 font-bold uppercase tracking-tighter">/ {product.unit || 'kg'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#556B55] dark:text-gray-300 text-xs mb-3 font-bold">
                    <div className="w-6 h-6 bg-organic-green/10 rounded-lg flex items-center justify-center">
                      <MapPin size={12} className="text-organic-green" />
                    </div>
                    {product.district || 'Bangladesh'}
                  </div>

                  <p className="text-xs text-[#556B55]/80 dark:text-gray-400 line-clamp-2 mb-4 font-medium leading-relaxed">
                    {product.description || (i18n.language === 'en' ? 'High quality fresh farm produce direct from seller.' : 'সরাসরি কৃষকের খামার থেকে সংগৃহীত মানসম্মত ফ্রেশ পণ্য।')}
                  </p>
                </div>
              </div>

              {/* Seller and Actions */}
              <div className="p-6 pt-0">
                <div className="pt-4 border-t border-[#F0F5F0] dark:border-dark-border flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-organic-green text-white flex items-center justify-center text-xs font-black shadow-lg shadow-organic-green/20 uppercase">
                        {product.sellerName?.[0] || 'F'}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-[#8BA88B] dark:text-gray-500 block uppercase tracking-widest leading-none mb-1">Seller</span>
                        <span className="text-xs font-bold text-[#1B301B] dark:text-gray-200">{product.sellerName || 'Farmer'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {product.contact && (
                        <a 
                          href={`tel:${product.contact}`}
                          className="w-9 h-9 bg-white border border-organic-green/20 text-organic-green hover:bg-organic-green hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                          title="Call Seller"
                        >
                          <Phone size={16} />
                        </a>
                      )}
                      {(isAdmin || (currentUserId && product.sellerId === currentUserId)) && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="w-9 h-9 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleBuyNow(product)}
                    className={cn(
                      "w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm",
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
      )}

      {/* Checkout / Buy Now Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedProduct && (
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
                    <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">Order Checkout</h2>
                    <button onClick={() => setShowPaymentModal(false)} className="dark:text-white"><X size={24} /></button>
                  </div>
                  
                  <div className="p-4 bg-[#F9FBF9] dark:bg-dark-bg rounded-2xl border border-[#E0E8E0] dark:border-dark-border flex items-center gap-4">
                    <div className="w-16 h-16 bg-white dark:bg-dark-surface rounded-xl flex items-center justify-center text-[#8BA88B] overflow-hidden">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#1B301B] dark:text-white">{selectedProduct.name}</p>
                      <p className="text-sm text-[#4CAF50] font-black">৳{selectedProduct.price} / {selectedProduct.unit || 'kg'}</p>
                      <p className="text-xs text-[#8BA88B]">{selectedProduct.district}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-[#556B55]">Seller Direct Contact:</p>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between">
                      <span className="font-black text-green-900">{selectedProduct.contact}</span>
                      <a href={`tel:${selectedProduct.contact}`} className="px-3 py-1.5 bg-[#4CAF50] text-white rounded-xl text-xs font-bold">Call Now</a>
                    </div>
                  </div>

                  <button
                    onClick={processPayment}
                    className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold shadow-xl shadow-green-900/20"
                  >
                    Confirm Order Request
                  </button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-black text-[#1B301B] dark:text-white">Connecting Seller</h3>
                    <p className="text-sm text-[#556B55]">Placing direct inquiry...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1B301B] dark:text-white">Inquiry Sent!</h3>
                  <p className="text-sm text-[#556B55]">The seller has been notified with your request. You can also call directly.</p>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-3.5 bg-[#1B301B] text-white rounded-2xl font-bold mt-2"
                  >
                    Done
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
              <div className="flex items-center justify-between mb-6">
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
                {/* Ad Type Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-organic-dark dark:text-gray-400 uppercase tracking-[0.2em] ml-2">{t('ad_type')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAdType('free')}
                      className={cn(
                        "px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
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
                        "px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                        adType === 'paid' 
                          ? "bg-white dark:bg-dark-surface border-organic-dark dark:border-white text-organic-dark dark:text-white shadow-xl shadow-black/10" 
                          : "bg-gray-50 dark:bg-dark-bg border-transparent text-[#8BA88B] opacity-60"
                      )}
                    >
                      {t('featured_ad')} (৳50)
                    </button>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                    {i18n.language === 'en' ? 'Product Photo (Optional)' : 'পণ্যের ছবি (ঐচ্ছিক)'}
                  </label>
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
                        "w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden bg-[#F9FBF9] dark:bg-dark-bg",
                        imagePreview ? "border-[#4CAF50]" : "border-[#E0E8E0] dark:border-dark-border hover:border-[#4CAF50]"
                      )}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="text-[#8BA88B]" size={28} />
                          <span className="text-[#556B55] dark:text-gray-400 font-bold text-xs">
                            {i18n.language === 'en' ? 'Click to upload photo' : 'ছবি যোগ করতে চাপ দিন'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                    {i18n.language === 'en' ? 'Product Name' : 'পণ্যের নাম'}
                  </label>
                  <input
                    required
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                    placeholder="e.g. Organic Rice / দেশি চাল"
                  />
                </div>

                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                      {i18n.language === 'en' ? 'Price (৳)' : 'দাম (৳)'}
                    </label>
                    <input
                      required
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                      {i18n.language === 'en' ? 'Unit' : 'একক'}
                    </label>
                    <select
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                    >
                      <option value="kg">kg (কেজি)</option>
                      <option value="maund">maund (মণ)</option>
                      <option value="piece">piece (টি)</option>
                      <option value="dozen">dozen (ডজন)</option>
                      <option value="bag">bag (বস্তা)</option>
                    </select>
                  </div>
                </div>

                {/* Category and District */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">District (জেলা)</label>
                    <select
                      value={newProduct.district}
                      onChange={(e) => setNewProduct({...newProduct, district: e.target.value})}
                      className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                    >
                      {BANGLADESH_DISTRICTS.map(d => (
                        <option key={d.en} value={d.en}>
                          {i18n.language === 'en' ? d.en : d.bn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seller Name and Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                      {i18n.language === 'en' ? 'Seller Name' : 'বিক্রেতার নাম'}
                    </label>
                    <input
                      type="text"
                      value={newProduct.sellerName}
                      onChange={(e) => setNewProduct({...newProduct, sellerName: e.target.value})}
                      className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                      placeholder="Farmer Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                      {i18n.language === 'en' ? 'Phone Number' : 'মোবাইল নম্বর'}
                    </label>
                    <input
                      required
                      type="tel"
                      value={newProduct.contact}
                      onChange={(e) => setNewProduct({...newProduct, contact: e.target.value})}
                      className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white text-sm"
                      placeholder="017XXXXXXXX"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556B55] dark:text-gray-300 uppercase tracking-widest ml-2">
                    {i18n.language === 'en' ? 'Product Details' : 'পণ্যের বিবরণ'}
                  </label>
                  <textarea
                    required
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-5 py-3.5 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-dark-border rounded-2xl focus:border-[#4CAF50] outline-none h-20 resize-none text-sm"
                    placeholder={i18n.language === 'en' ? 'Describe quantity, quality, and harvest details...' : 'পণ্য সম্পর্কে কিছু বিবরণ লিখুন...'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#4CAF50] text-white font-bold rounded-2xl hover:bg-[#43A047] transition-all shadow-xl shadow-green-900/20 mt-2 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  <span>{i18n.language === 'en' ? 'Submit Product' : 'পণ্য প্রকাশ করুন'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Featured Ad Payment Modal */}
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
              className="relative w-full max-w-md bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {adPaymentStep === 'details' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#1B301B] dark:text-white">Featured Promotion</h2>
                    <button onClick={() => setShowAdPaymentModal(false)} className="dark:text-white"><X size={24} /></button>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center space-y-1">
                    <p className="text-xs text-[#556B55] uppercase font-bold">Featured Listing Charge</p>
                    <p className="text-3xl font-black text-organic-green">৳{AD_CHARGE}</p>
                    <p className="text-[10px] text-[#8BA88B]">Includes Top Placement & Push Notifications</p>
                  </div>

                  <button
                    onClick={processAdPayment}
                    className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold shadow-xl shadow-green-900/20"
                  >
                    Confirm & Publish
                  </button>
                </div>
              )}

              {adPaymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-black text-[#1B301B] dark:text-white">Publishing Ad</h3>
                    <p className="text-sm text-[#556B55]">Activating featured placement...</p>
                  </div>
                </div>
              )}

              {adPaymentStep === 'success' && (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1B301B] dark:text-white">Ad Published!</h3>
                  <p className="text-sm text-[#556B55]">Your product is now live on Krishi Bondhu Marketplace.</p>
                  <button 
                    onClick={() => setShowAdPaymentModal(false)}
                    className="w-full py-3.5 bg-[#1B301B] text-white rounded-2xl font-bold mt-2"
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

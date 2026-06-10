import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Globe, ShieldCheck, Ship, Box, Search, CheckCircle2, 
  AlertTriangle, Info, BookOpen, ExternalLink, ArrowRight,
  Database, Link2, Map as MapIcon, TrendingUp, Package
} from 'lucide-react';

export default function GlobalExportGuide() {
  const { i18n } = useTranslation();

  const [mrlSearch, setMrlSearch] = useState('');

  const bdProducts = [
    {
      id: 'jute',
      name: i18n.language === 'en' ? 'Golden Jute' : 'সোনালী আঁশ (পাট)',
      market: i18n.language === 'en' ? 'Europe, USA, China' : 'ইউরোপ, আমেরিকা, চীন',
      mrl: 'Chlorpyrifos < 0.01 mg/kg',
      certifications: ['Global-GAP', 'Oeko-Tex'],
      image: 'https://images.unsplash.com/photo-1601648764658-cf37e8c18331',
      bgImg: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09' 
    },
    {
      id: 'tea',
      name: i18n.language === 'en' ? 'Premium Tea' : 'প্রিমিয়াম চা',
      market: i18n.language === 'en' ? 'UK, UAE, Pakistan' : 'যুক্তরাজ্য, আরব আমিরাত, পাকিস্তান',
      mrl: 'Acetamiprid < 0.1 mg/kg',
      certifications: ['FairTrade', 'Rainforest Alliance'],
      image: 'https://images.unsplash.com/photo-1544787210-2211d44b565a',
      bgImg: 'https://images.unsplash.com/photo-1582733075929-585015d6768a' 
    },
    {
      id: 'mango',
      name: i18n.language === 'en' ? 'Himsagar Mango' : 'হিমসাগর আম',
      market: i18n.language === 'en' ? 'Germany, Italy, UK' : 'জার্মানি, ইতালি, যুক্তরাজ্য',
      mrl: 'Carbendazim < 0.2 mg/kg',
      certifications: ['Global-GAP', 'HACCP'],
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078',
      bgImg: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed'
    },
    {
      id: 'shrimp',
      name: i18n.language === 'en' ? 'Black Tiger Shrimp' : 'বাগদা চিংড়ি',
      market: i18n.language === 'en' ? 'EU, Japan, USA' : 'ইউরোপীয় ইউনিয়ন, জাপান, আমেরিকা',
      mrl: 'Nitrofuran: PROHIBITED',
      certifications: ['ASC', 'BAP'],
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62',
      bgImg: 'https://images.unsplash.com/photo-1516741757164-96860f383e20'
    }
  ];

  const filteredMrl = bdProducts.filter(p => 
    p.name.toLowerCase().includes(mrlSearch.toLowerCase()) || 
    p.market.toLowerCase().includes(mrlSearch.toLowerCase())
  );

  const demandMap = [
    { country: 'Saudi Arabia', color: 'bg-green-500', demand: i18n.language === 'en' ? 'Potatoes, Onions' : 'আলু, পেঁয়াজ', growth: '+15%' },
    { country: 'Germany', color: 'bg-blue-500', demand: i18n.language === 'en' ? 'Organic Tea, Ginger' : 'অর্গানিক চা, আদা', growth: '+22%' },
    { country: 'USA', color: 'bg-red-500', demand: i18n.language === 'en' ? 'Dry Foods, Spices' : 'শুকনো খাবার, মসলা', growth: '+10%' },
    { country: 'Japan', color: 'bg-yellow-500', demand: i18n.language === 'en' ? 'Frozen Fish, Leather' : 'হিমায়িত মাছ, চামড়া', growth: '+18%' },
  ];

  const standards = [
    {
      title: i18n.language === 'en' ? 'GlobalGAP' : 'গ্লোবালগ্যাপ (GlobalGAP)',
      status: 'Required for EU',
      icon: <ShieldCheck className="text-blue-500" />,
      description: i18n.language === 'en' 
        ? 'The worldwide standard for Good Agricultural Practices. Essential for exporting to European markets.' 
        : 'উত্তম কৃষি চর্চার বিশ্বব্যাপী মানদণ্ড। ইউরোপীয় বাজারে রপ্তানির জন্য এটি অপরিহার্য।',
      points: [
        { en: 'Traceability from farm to fork', bn: 'খামার থেকে ভোক্তা পর্যন্ত তথ্য উপাত্ত সংরক্ষণ' },
        { en: 'Judicious use of fertilizers', bn: 'পরিমিত সারের ব্যবহার' },
        { en: 'Environmental protection', bn: 'পরিবেশ সুরক্ষা' },
        { en: 'Worker health and safety', bn: 'শ্রমিকদের স্বাস্থ্য ও নিরাপত্তা' }
      ]
    },
    {
      title: i18n.language === 'en' ? 'Organic Certification' : 'অর্গানিক সার্টিফিকেট',
      status: 'Premium Markets',
      icon: <Box className="text-green-500" />,
      description: i18n.language === 'en'
        ? 'US and EU organic standards require 3 years of pesticide-free farming records.'
        : 'ইউএস এবং ইইউ অর্গানিক মানের জন্য ৩ বছরের কীটনাশক মুক্ত চাষের রেকর্ড প্রয়োজন।',
      points: [
        { en: 'No synthetic chemicals', bn: 'কোনো কৃত্রিম রাসায়নিক নেই' },
        { en: 'Soil fertility management', bn: 'মাটির উর্বরতা ব্যবস্থাপনা' },
        { en: 'Non-GMO seeds only', bn: 'শুধুমাত্র নন-জিএমও বীজ' },
        { en: 'Third-party inspections', bn: 'তৃতীয় পক্ষ দ্বারা পরিদর্শন' }
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <header className="bg-gradient-to-br from-[#0A2E0A] to-[#1B301B] rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
        <div className="relative z-10 space-y-8 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-blue-300 text-xs font-black uppercase tracking-[0.3em] border border-white/20">
            <Globe size={18} className="animate-pulse" />
            {i18n.language === 'en' ? 'International Level' : 'আন্তর্জাতিক মান'}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Global Market Export Hub' : 'গ্লোবাল মার্কেট এক্সপোর্ট হাব'}
          </h1>
          <p className="text-blue-50/60 text-xl sm:text-2xl font-bold leading-relaxed max-w-2xl mx-auto italic">
            {i18n.language === 'en' 
              ? 'Prepare your farm for the international stage. Connect with global standards, check crop chemical limits, and access worldwide export regulations.' 
              : 'আপনার খামারকে আন্তর্জাতিক মঞ্চের জন্য প্রস্তুত করুন। বৈশ্বিক মানদণ্ডের সাথে সংযোগ করুন, শস্যের রাসায়নিক সীমা পরীক্ষা করুন এবং বিশ্বব্যাপী রপ্তানি নিয়মাবলী জানুন।'}
          </p>
        </div>
        <Ship className="absolute -bottom-24 -right-24 w-[500px] h-[500px] text-white/5 -rotate-12 blur-3xl" />
        <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] text-blue-500/5 animate-spin-slow -z-10" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <h2 className="text-3xl font-black text-organic-dark flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={32} />
              {i18n.language === 'en' ? 'Compliance Standards' : 'পালনীয় মানসমূহ'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {standards.map((std, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-organic-light shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-organic-light rounded-2xl shadow-inner">
                      {std.icon}
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">{std.status}</span>
                  </div>
                  <h3 className="text-xl font-black text-organic-dark mb-2">{std.title}</h3>
                  <p className="text-sm text-organic-dark/60 font-medium mb-6 leading-relaxed">{std.description}</p>
                  <ul className="space-y-3">
                    {std.points.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs font-bold text-organic-dark/80">
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        {i18n.language === 'en' ? p.en : p.bn}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[3rem] p-10 border border-organic-light shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-5 -mr-10 -mt-10">
              <Search size={200} />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-organic-dark">
                  {i18n.language === 'en' ? 'MRL Target Search' : 'রাসায়নিক সীমা (MRL) সার্চ'}
                </h2>
                <p className="text-organic-dark/60 font-medium">
                  {i18n.language === 'en' ? 'Check Maximum Residue Limits for different countries.' : 'বিভিন্ন দেশের জন্য সর্বোচ্চ রাসায়নিক ব্যবহারের সীমা পরীক্ষা করুন।'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/30 group-focus-within:text-organic-green transition-colors" />
                  <input 
                    type="text" 
                    placeholder={i18n.language === 'en' ? "Search product (e.g. Jute, Tea)..." : "পণ্য খুঁজুন (যেমন: পাট, চা)..."}
                    value={mrlSearch}
                    onChange={(e) => setMrlSearch(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-organic-light/50 border border-organic-light rounded-2xl outline-none focus:border-organic-green focus:bg-white transition-all font-bold"
                  />
                </div>
                <select className="px-8 py-5 bg-organic-dark text-white rounded-2xl font-black outline-none hover:bg-black transition-all">
                  <option>European Union</option>
                  <option>USA (FDA)</option>
                  <option>China</option>
                  <option>Gulf Countries (GCC)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Bangladeshi Export Products Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-black text-organic-dark flex items-center gap-3">
              <Package className="text-amber-600" size={32} />
              {i18n.language === 'en' ? 'Export Compliance Catalog' : 'রপ্তানি কমপ্লায়েন্স ক্যাটালগ'}
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {filteredMrl.map((prod, i) => (
                <div key={i} className="group relative bg-white rounded-[3.5rem] border border-organic-light overflow-hidden hover:shadow-2xl transition-all p-1">
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000">
                      <img src={prod.bgImg} alt="" className="w-full h-full object-cover" />
                   </div>
                   
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 p-8 sm:p-10">
                      <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white shrink-0 group-hover:scale-110 transition-transform duration-700">
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="flex-grow space-y-6">
                        <div className="flex flex-wrap items-center gap-4">
                           <h3 className="text-3xl font-black text-organic-dark tracking-tight uppercase leading-none">{prod.name}</h3>
                           <div className="px-4 py-1.5 bg-organic-dark text-white text-[10px] font-black rounded-full uppercase tracking-widest">{prod.market}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 space-y-2">
                              <div className="flex items-center gap-2">
                                 <AlertTriangle size={14} className="text-amber-600" />
                                 <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Chemical Limit (MRL)</span>
                              </div>
                              <p className="font-mono text-sm font-bold text-organic-dark">{prod.mrl}</p>
                           </div>
                           <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-2">
                              <div className="flex items-center gap-2">
                                 <ShieldCheck size={14} className="text-blue-600" />
                                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Certifications</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {prod.certifications.map(c => (
                                   <span key={c} className="text-[9px] font-black bg-white/50 px-2.5 py-1 rounded-lg border border-blue-200">{c}</span>
                                 ))}
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col gap-4">
                         <button className="p-4 bg-organic-light rounded-2xl text-organic-green hover:bg-organic-green hover:text-white transition-all shadow-sm">
                            <ExternalLink size={24} />
                         </button>
                         <button className="p-4 bg-organic-light rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <TrendingUp size={24} />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* Real-time Demand Map (Visual) */}
          <section className="bg-organic-dark rounded-[3rem] p-10 text-white relative overflow-hidden">
             <div className="absolute right-0 bottom-0 p-10 opacity-5">
                <MapIcon size={250} />
             </div>
             <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black">{i18n.language === 'en' ? 'Global Demand Heatmap' : 'বৈশ্বিক চাহিদা হিটম্যাপ'}</h2>
                      <p className="text-white/60 font-medium">{i18n.language === 'en' ? 'Real-time crop demand by country' : 'দেশ ভিত্তিক ফসলের রিয়েল-টাইম চাহিদা'}</p>
                   </div>
                   <div className="hidden sm:flex h-12 w-12 bg-white/10 rounded-full items-center justify-center animate-pulse">
                      <TrendingUp size={24} className="text-green-400" />
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {demandMap.map((item, i) => (
                      <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.country}</span>
                            <span className="text-green-400 font-black text-xs">{item.growth}</span>
                         </div>
                         <p className="text-lg font-black leading-tight">{item.demand}</p>
                         <div className={`h-1 w-12 ${item.color} rounded-full mt-4`} />
                      </div>
                   ))}
                </div>
             </div>
          </section>
        </div>

        <div className="space-y-10">
          <div className="bg-organic-dark rounded-[3rem] p-10 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-2xl font-black mb-6 relative z-10">
              {i18n.language === 'en' ? 'Export Documents' : 'দরকারি নথিপত্র'}
            </h3>
            <div className="space-y-4 relative z-10">
              {[
                { en: 'Phytosanitary Certificate', bn: 'ফাইটোস্যানিটারি সার্টিফিকেট' },
                { en: 'Commercial Invoice', bn: 'কমার্শিয়াল ইনভয়েস' },
                { en: 'Packing List', bn: 'প্যাকিং লিস্ট' },
                { en: 'Certificate of Origin', bn: 'সার্টিফিকেট অফ অরিজিন' },
                { en: 'Quality Analysis Report', bn: 'কোয়ালিটি অ্যানালাইসিস রিপোর্ট' }
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                  <span className="text-sm font-bold text-white/80">{i18n.language === 'en' ? doc.en : doc.bn}</span>
                  <BookOpen size={16} className="text-blue-400" />
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-white text-organic-dark rounded-xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
              {i18n.language === 'en' ? 'Get Templates' : 'টেমপ্লেট নিন'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#1E40AF] to-[#1D4ED8] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-[2s]">
                <Database size={200} />
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Link2 className="text-green-300" size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4">
              {i18n.language === 'en' ? 'Blockchain Traceability' : 'ব্লকচেইন ট্রেসেবিলিটি'}
            </h3>
            <p className="text-blue-100 font-medium text-sm leading-relaxed mb-8 opacity-90">
              {i18n.language === 'en' 
                ? 'Allow international buyers to verify the origin, quality certificates, and pesticide records of your batch via secure blockchain ID.' 
                : 'আন্তর্জাতিক ক্রেতাদের আপনার শস্যের উৎস, গুণগত মানের সার্টিফিকেট এবং কীটনাশক ব্যবহারের রেকর্ড সিকিউর ব্লকচেইন আইডির মাধ্যমে যাচাই করার সুযোগ দিন।'}
            </p>
            <div className="p-6 bg-white/10 rounded-2xl border border-white/20 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center font-black">QR</div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Batch ID</p>
                     <p className="text-xs font-mono font-bold tracking-widest uppercase">#BD-64-MNG-2026-XQ</p>
                  </div>
               </div>
               <button className="w-full py-3 bg-white text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-colors">
                  Generate Trace ID
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

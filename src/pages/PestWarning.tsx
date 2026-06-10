import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { AlertTriangle, MapPin, Calendar, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

export default function PestWarning() {
  const { i18n } = useTranslation();
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pestWarnings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWarnings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1558449028-b53a39d100fc" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-red-900/20 rounded-full border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <AlertTriangle size={18} />
              {i18n.language === 'en' ? 'Pest Warning Map' : 'বালাই সতর্কবার্তা ম্যাপ'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'PEST' : 'বালাই'} <br />
              <span className="text-red-500 uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">{i18n.language === 'en' ? 'ALERTS' : 'সতর্কবার্তা'}</span>
            </h1>
            <p className="text-red-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6">
              {i18n.language === 'en' 
                ? 'Stay informed about pest outbreaks and crop diseases in your area to take preventive measures.' 
                : 'আপনার এলাকায় বালাই আক্রমণ এবং ফসলের রোগ সম্পর্কে অবগত থাকুন এবং প্রতিরোধমূলক ব্যবস্থা নিন।'}
            </p>
          </div>
        </div>
        <ShieldAlert className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warnings.map((warning) => (
          <motion.div
            key={warning.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "bg-white dark:bg-dark-surface p-6 rounded-[2rem] border-2 shadow-sm space-y-4 relative overflow-hidden transition-colors",
              warning.severity === 'high' ? "border-red-100 dark:border-red-900/30" : warning.severity === 'medium' ? "border-orange-100 dark:border-orange-900/30" : "border-blue-100 dark:border-blue-900/30"
            )}
          >
            <div className={cn(
              "absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest",
              warning.severity === 'high' ? "bg-red-500 text-white" : warning.severity === 'medium' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
            )}>
              {warning.severity} Risk
            </div>

            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                warning.severity === 'high' ? "bg-red-50 dark:bg-red-900/20 text-red-500" : warning.severity === 'medium' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500" : "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
              )}>
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#1B301B] dark:text-white uppercase leading-tight">{warning.title}</h3>
                <div className="flex items-center gap-2 text-xs text-[#556B55] dark:text-gray-400 font-bold">
                  <MapPin size={12} className="text-[#4CAF50]" />
                  {warning.area}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F9FBF9] dark:bg-dark-bg rounded-2xl border border-[#E0E8E0] dark:border-white/10">
              <p className="text-sm text-[#556B55] dark:text-gray-400 leading-relaxed">
                {warning.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-[10px] text-[#8BA88B] dark:text-gray-500 font-bold uppercase">
                <Calendar size={12} />
                {warning.createdAt?.toDate().toLocaleDateString()}
              </div>
              <button className="text-[10px] font-black text-[#4CAF50] uppercase tracking-widest hover:underline">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {warnings.length === 0 && (
        <div className="text-center py-20 bg-[#F9FBF9] dark:bg-dark-surface rounded-[2.5rem] border-2 border-dashed border-[#E0E8E0] dark:border-white/10">
          <Info size={48} className="mx-auto text-[#8BA88B] dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-[#1B301B] dark:text-white">No active warnings</h3>
          <p className="text-[#8BA88B] dark:text-gray-500">Your area is currently safe from major pest outbreaks.</p>
        </div>
      )}
    </div>
  );
}

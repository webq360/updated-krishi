import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-dark-bg transition-colors gap-8">
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center relative rounded-[40px] overflow-hidden bg-organic-green"
        >
          <img src="/logo.png" className="w-full h-full object-cover relative z-10" alt="Logo" referrerPolicy="no-referrer" />
        </motion.div>
      </div>

      <div className="flex flex-col items-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-black uppercase text-organic-dark dark:text-white tracking-tighter leading-none"
        >
          {t('app_name')}
        </motion.span>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center w-full mt-2"
        >
          <span className="text-[10px] sm:text-[14px] font-black uppercase text-organic-green tracking-[0.4em] whitespace-nowrap">
            {t('tagline')}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
      <div className="relative w-16 h-16">
        <motion.div 
            className="absolute inset-0 border-4 border-organic-green/20 rounded-full"
        />
        <motion.div 
            className="absolute inset-0 border-4 border-t-organic-green rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="mt-6 text-center">
        <p className="text-xs font-bold text-organic-green uppercase tracking-[0.2em] animate-pulse">লোড হচ্ছে...</p>
        <p className="text-[8px] font-bold text-organic-green uppercase tracking-[0.2em] opacity-60 mt-1">কৃষকের প্রকৃত বন্ধু</p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Calculator, Info, CheckCircle2, RefreshCw, Waves, Wind, Sun, Thermometer } from 'lucide-react';
import { cn } from '../lib/utils';

export default function IrrigationCalc() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    crop: 'Rice',
    landSize: '',
    landUnit: 'Decimal',
    soilType: 'Loamy',
    weather: 'Sunny'
  });
  const [result, setResult] = useState<any>(null);

  const calculateIrrigation = (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseFloat(formData.landSize);
    if (isNaN(size)) return;

    const factor = formData.landUnit === 'Decimal' ? 1 : 33;
    const totalArea = size * factor;

    // Simplified calculation logic
    let waterPerDecimal = 100; // liters
    if (formData.crop === 'Rice') waterPerDecimal = 200;
    if (formData.weather === 'Hot') waterPerDecimal *= 1.2;
    if (formData.soilType === 'Sandy') waterPerDecimal *= 1.3;

    const totalWater = totalArea * waterPerDecimal;
    const pumpTime = totalWater / 5000; // Assume 5000L/hour pump

    setResult({
      liters: totalWater.toFixed(0),
      hours: pumpTime.toFixed(1),
      frequency: formData.crop === 'Rice' ? 'Every 2-3 days' : 'Every 5-7 days'
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="bg-[#1B301B] rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/20">
            <Droplets size={18} className="text-green-300" />
            {t('irrigation_calc')}
          </div>
          <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1]">
            {i18n.language === 'en' ? 'Smart Irrigation Calculator' : 'স্মার্ট সেচ ক্যালকুলেটর'}
          </h1>
          <p className="text-green-50/60 font-bold text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {i18n.language === 'en' 
              ? 'Calculate the exact water requirement for your crops to save energy and water.' 
              : 'আপনার ফসলের জন্য সঠিক পানির পরিমাণ হিসাব করুন এবং বিদ্যুৎ ও পানি সাশ্রয় করুন।'}
          </p>
        </div>
        <Waves className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-[#E0E8E0] shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#F0F5F0] rounded-2xl flex items-center justify-center text-[#4CAF50]">
              <Calculator size={24} />
            </div>
            <h2 className="text-2xl font-black text-[#1B301B]">
              {i18n.language === 'en' ? 'Irrigation Details' : 'সেচের বিবরণ দিন'}
            </h2>
          </div>

          <form onSubmit={calculateIrrigation} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Crop Type</label>
                <select 
                  value={formData.crop}
                  onChange={(e) => setFormData({...formData, crop: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                >
                  <option value="Rice">Rice (ধান)</option>
                  <option value="Wheat">Wheat (গম)</option>
                  <option value="Potato">Potato (আলু)</option>
                  <option value="Maize">Maize (ভুট্টা)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Soil Type</label>
                <select 
                  value={formData.soilType}
                  onChange={(e) => setFormData({...formData, soilType: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                >
                  <option value="Loamy">Loamy (দোআঁশ)</option>
                  <option value="Clayey">Clayey (এঁটেল)</option>
                  <option value="Sandy">Sandy (বেলে)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Land Size</label>
                <input 
                  required
                  type="number"
                  value={formData.landSize}
                  onChange={(e) => setFormData({...formData, landSize: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                  placeholder="e.g. 33"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Unit</label>
                <select 
                  value={formData.landUnit}
                  onChange={(e) => setFormData({...formData, landUnit: e.target.value})}
                  className="w-full px-6 py-4 bg-[#F9FBF9] border border-[#E0E8E0] rounded-2xl focus:border-[#4CAF50] outline-none"
                >
                  <option value="Decimal">Decimal (শতাংশ)</option>
                  <option value="Bigha">Bigha (বিঘা)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#556B55] uppercase tracking-widest ml-2">Current Weather</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'Sunny', icon: Sun, label: 'Sunny' },
                  { id: 'Hot', icon: Thermometer, label: 'Hot' },
                  { id: 'Windy', icon: Wind, label: 'Windy' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({...formData, weather: item.id})}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                      formData.weather === item.id 
                        ? "bg-[#E8F5E9] border-[#4CAF50] text-[#2E7D32]" 
                        : "bg-[#F9FBF9] border-[#E0E8E0] text-[#556B55] hover:border-[#4CAF50]"
                    )}
                  >
                    <item.icon size={24} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold text-lg hover:bg-[#43A047] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2"
            >
              <Droplets size={20} />
              {i18n.language === 'en' ? 'Calculate Water Requirement' : 'পানির পরিমাণ দেখুন'}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-[#E0E8E0] shadow-xl"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center text-[#4CAF50]">
                    <CheckCircle2 size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-[#1B301B]">
                    {i18n.language === 'en' ? 'Irrigation Plan' : 'সেচ পরিকল্পনা'}
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-[#F9FBF9] rounded-3xl border border-[#E0E8E0] text-center">
                    <p className="text-xs font-bold text-[#8BA88B] uppercase mb-2">Total Water Needed</p>
                    <p className="text-4xl font-black text-[#1B301B]">{result.liters} <span className="text-xl">Liters</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                      <p className="text-[10px] font-bold text-[#8BA88B] uppercase mb-1">Pump Time</p>
                      <p className="text-lg font-bold text-[#1B301B]">{result.hours} Hours</p>
                    </div>
                    <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                      <p className="text-[10px] font-bold text-[#8BA88B] uppercase mb-1">Frequency</p>
                      <p className="text-lg font-bold text-[#1B301B]">{result.frequency}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-[#F0F5F0] rounded-2xl border border-[#E0E8E0]">
                  <div className="flex items-center gap-2 text-[#2E7D32] font-bold mb-2">
                    <Info size={18} />
                    {i18n.language === 'en' ? 'Water Saving Tip' : 'পানি সাশ্রয়ের টিপস'}
                  </div>
                  <p className="text-sm text-[#556B55] leading-relaxed">
                    {i18n.language === 'en' 
                      ? 'Irrigate early in the morning or late in the evening to reduce evaporation loss.' 
                      : 'বাষ্পীভবন কমাতে খুব সকালে অথবা সন্ধ্যায় সেচ দিন।'}
                  </p>
                </div>

                <button 
                  onClick={() => setResult(null)}
                  className="w-full mt-8 py-4 bg-[#F0F5F0] text-[#1B301B] rounded-2xl font-bold hover:bg-[#E0E8E0] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  {i18n.language === 'en' ? 'Reset Calculator' : 'পুনরায় হিসাব করুন'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#F9FBF9] rounded-[2.5rem] p-12 border-2 border-dashed border-[#E0E8E0] flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-[#8BA88B]">
                  <Waves size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1B301B]">
                    {i18n.language === 'en' ? 'Calculate Now' : 'হিসাব শুরু করুন'}
                  </h3>
                  <p className="text-[#8BA88B] max-w-xs">
                    {i18n.language === 'en' 
                      ? 'Enter your farm details to get a customized irrigation schedule.' 
                      : 'আপনার খামারের তথ্য দিয়ে একটি কাস্টম সেচ পরিকল্পনা তৈরি করুন।'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

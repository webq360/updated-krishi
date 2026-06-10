import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Calculator, Info, CheckCircle2, RefreshCw, Waves, Wind, Sun, Thermometer, Cpu, Power, Activity, ThermometerSnowflake, Droplet } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SmartIrrigation() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator'>('dashboard');
  
  // Calculator State
  const [formData, setFormData] = useState({
    crop: 'Rice',
    landSize: '',
    landUnit: 'Decimal',
    soilType: 'Loamy',
    weather: 'Sunny'
  });
  const [result, setResult] = useState<any>(null);

  // Dashboard State (Simulated)
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [moisture, setMoisture] = useState(45);
  const [temp, setTemp] = useState(28);
  const [humidity, setHumidity] = useState(65);

  useEffect(() => {
    const interval = setInterval(() => {
      setMoisture(prev => {
        if (isPumpOn) return Math.min(prev + 0.5, 85);
        return Math.max(prev - 0.1, 30);
      });
      setTemp(prev => prev + (Math.random() - 0.5) * 0.2);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPumpOn]);

  const calculateIrrigation = (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseFloat(formData.landSize);
    if (isNaN(size)) return;

    const factor = formData.landUnit === 'Decimal' ? 1 : 33;
    const totalArea = size * factor;

    let waterPerDecimal = 100; // liters
    if (formData.crop === 'Rice') waterPerDecimal = 200;
    if (formData.weather === 'Hot') waterPerDecimal *= 1.2;
    if (formData.soilType === 'Sandy') waterPerDecimal *= 1.3;

    const totalWater = totalArea * waterPerDecimal;
    const pumpTime = totalWater / 5000; 

    setResult({
      liters: totalWater.toFixed(0),
      hours: pumpTime.toFixed(1),
      frequency: formData.crop === 'Rice' ? 'Every 2-3 days' : 'Every 5-7 days'
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-blue-900/20 rounded-full border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Cpu size={18} />
              {i18n.language === 'en' ? 'Smart Irrigation' : 'স্মার্ট সেচ'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] text-center">
              {i18n.language === 'en' ? 'SMART' : 'স্মার্ট'} <br />
              <span className="text-blue-500 uppercase drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">{i18n.language === 'en' ? 'IRRIGATION' : 'সেচ'}</span>
            </h1>
            <p className="text-blue-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {i18n.language === 'en' 
                ? 'Monitor soil moisture in real-time or calculate water requirements for your crops.' 
                : 'রিয়েল-টাইমে মাটির আর্দ্রতা পর্যবেক্ষণ করুন অথবা আপনার ফসলের জন্য পানির পরিমাণ হিসাব করুন।'}
            </p>
          </div>
        </div>
        <Waves className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-2xl" />
      </header>

      <div className="flex p-1 bg-[#F0F5F0] rounded-2xl w-fit mx-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
            activeTab === 'dashboard' ? "bg-white text-[#1B301B] shadow-md" : "text-[#556B55] hover:bg-white/50"
          )}
        >
          <Activity size={18} />
          {i18n.language === 'en' ? 'IoT Dashboard' : 'আইওটি ড্যাশবোর্ড'}
        </button>
        <button 
          onClick={() => setActiveTab('calculator')}
          className={cn(
            "px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
            activeTab === 'calculator' ? "bg-white text-[#1B301B] shadow-md" : "text-[#556B55] hover:bg-white/50"
          )}
        >
          <Calculator size={18} />
          {i18n.language === 'en' ? 'Calculator' : 'ক্যালকুলেটর'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 border border-[#E0E8E0] shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#1B301B]">Real-time Monitoring</h2>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-[#4CAF50] uppercase">Live Data</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-[#F0F7FF] rounded-3xl border border-blue-100 flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                    <Droplet size={24} />
                  </div>
                  <p className="text-xs font-bold text-blue-400 uppercase">Soil Moisture</p>
                  <p className="text-3xl font-black text-blue-900">{moisture.toFixed(1)}%</p>
                </div>
                <div className="p-6 bg-[#FFF4F0] rounded-3xl border border-orange-100 flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                    <Thermometer size={24} />
                  </div>
                  <p className="text-xs font-bold text-orange-400 uppercase">Temperature</p>
                  <p className="text-3xl font-black text-orange-900">{temp.toFixed(1)}°C</p>
                </div>
                <div className="p-6 bg-[#F0FDF4] rounded-3xl border border-green-100 flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-500 shadow-sm">
                    <Wind size={24} />
                  </div>
                  <p className="text-xs font-bold text-green-400 uppercase">Humidity</p>
                  <p className="text-3xl font-black text-green-900">{humidity}%</p>
                </div>
              </div>

              <div className="p-8 bg-[#1B301B] rounded-[2rem] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="text-xl font-bold">Irrigation Pump Control</h3>
                  <p className="text-green-300/80 text-sm">Remotely turn your water pump on or off.</p>
                </div>
                <button 
                  onClick={() => setIsPumpOn(!isPumpOn)}
                  className={cn(
                    "px-10 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-xl",
                    isPumpOn 
                      ? "bg-red-500 hover:bg-red-600 shadow-red-900/40" 
                      : "bg-[#4CAF50] hover:bg-[#43A047] shadow-green-900/40"
                  )}
                >
                  <Power size={24} />
                  {isPumpOn ? 'STOP PUMP' : 'START PUMP'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-[#E0E8E0] shadow-xl space-y-6">
              <h3 className="text-xl font-black text-[#1B301B]">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4CAF50]">
                      <Activity size={20} />
                    </div>
                    <span className="font-bold text-[#1B301B]">Gateway</span>
                  </div>
                  <span className="text-xs font-black text-[#4CAF50]">ONLINE</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4CAF50]">
                      <Droplets size={20} />
                    </div>
                    <span className="font-bold text-[#1B301B]">Sensor A1</span>
                  </div>
                  <span className="text-xs font-black text-[#4CAF50]">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-2xl border border-[#E0E8E0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#8BA88B]">
                      <Power size={20} />
                    </div>
                    <span className="font-bold text-[#1B301B]">Pump Relay</span>
                  </div>
                  <span className={cn("text-xs font-black", isPumpOn ? "text-red-500" : "text-[#8BA88B]")}>
                    {isPumpOn ? 'RUNNING' : 'IDLE'}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-[#F0F5F0]">
                <div className="flex items-center gap-2 text-[#2E7D32] font-bold mb-2 text-sm">
                  <Info size={16} />
                  Smart Suggestion
                </div>
                <p className="text-xs text-[#556B55] leading-relaxed">
                  Soil moisture is optimal. No irrigation needed for the next 24 hours based on weather forecast.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="calculator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

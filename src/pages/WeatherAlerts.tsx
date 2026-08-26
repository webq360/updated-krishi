import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { CloudRain, CloudLightning, Sun, Wind, Thermometer, AlertTriangle, Info, MapPin, RefreshCw, Loader2, Cloud, Droplets, ArrowRight, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db, doc, getDoc } from '../lib/db';

import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';

export default function WeatherAlerts() {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.id || auth.currentUser.uid || auth.currentUser._id;
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const profile = userDoc.data();
          setUserProfile(profile);
          if (profile.address) {
            setDistrict(profile.address);
            fetchWeather(profile.address);
            return;
          }
        }
      }
      fetchWeather('Dhaka');
    };
    fetchProfile();
  }, []);

  const fetchWeather = async (targetLocation?: string) => {
    setLoading(true);
    const searchVal = targetLocation || district;
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchVal + ', Bangladesh')}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        if (searchVal !== 'Dhaka') {
          return fetchWeather('Dhaka');
        }
        throw new Error("Location not found");
      }
      
      const { latitude, longitude, name } = geoData.results[0];
      setDistrict(name);

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`);
      const weatherData = await weatherRes.json();
      
      const mappedData = {
        current: {
          temp: Math.round(weatherData.current.temperature_2m),
          feelsLike: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          wind: Math.round(weatherData.current.wind_speed_10m),
          cloud: weatherData.current.cloud_cover,
          code: weatherData.current.weather_code,
          condition: getWeatherDesc(weatherData.current.weather_code)
        }
      };
      
      setWeather(mappedData);
    } catch (err) {
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setUpazila('');
    fetchWeather(d);
  };

  const handleUpazilaChange = (u: string) => {
    setUpazila(u);
    fetchWeather(`${u}, ${district}`);
  };

  const getWeatherDesc = (code: number) => {
    const codes: { [key: number]: string } = {
      0: 'Sunny',
      1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Rime Fog',
      51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
      61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
      71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
      80: 'Light Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
      95: 'Thunderstorm', 96: 'Storm with Hail', 99: 'Heavy Storm'
    };
    return codes[code] || 'Clear';
  };

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('showers')) return <CloudRain size={120} className="text-blue-500" />;
    if (c.includes('storm')) return <CloudLightning size={120} className="text-purple-500" />;
    if (c.includes('cloud') || c.includes('overcast')) return <Cloud size={120} className="text-gray-400" />;
    if (c.includes('sun') || c.includes('clear')) return <Sun size={120} className="text-yellow-500" />;
    return <Sun size={120} className="text-yellow-500" />;
  };

  const getAlerts = (data: any) => {
    const alerts = [];
    const current = data.current;
    
    if (current.temp > 35) {
      alerts.push({
        type: 'Heat',
        title: i18n.language === 'en' ? 'Extreme Heat Warning' : 'তীব্র তাপদাহের সতর্কতা',
        desc: i18n.language === 'en' 
          ? 'Temperatures above 35°C detected. Increase irrigation frequency and provide shade to young saplings.' 
          : '৩৫°সে-এর উপরে তাপমাত্রা শনাক্ত হয়েছে। সেচের পরিমাণ বাড়িয়ে দিন এবং চারাগাছে ছায়ার ব্যবস্থা করুন।',
        color: 'bg-orange-500',
        icon: Thermometer
      });
    }

    if (current.condition.toLowerCase().includes('rain')) {
      alerts.push({
        type: 'Rain',
        title: i18n.language === 'en' ? 'Rain Alert' : 'বৃষ্টির সতর্কতা',
        desc: i18n.language === 'en' 
          ? 'Expected rain may cause waterlogging. Ensure proper drainage channels are clear in your fields.' 
          : 'বৃষ্টির ফলে জলাবদ্ধতা সৃষ্টি হতে পারে। আপনার জমির ড্রেনেজ ব্যবস্থা পরিষ্কার রাখুন।',
        color: 'bg-blue-600',
        icon: CloudRain
      });
    }

    if (current.wind > 40) {
      alerts.push({
        type: 'Wind',
        title: i18n.language === 'en' ? 'High Wind Warning' : 'ঝড়ো হাওয়ার সতর্কতা',
        desc: i18n.language === 'en' 
          ? 'Strong winds detected. Stake tall crops (like banana or papaya) to prevent them from snapping.' 
          : 'ঝড়ো হওয়া বয়ে যাওয়ার সম্ভাবনা আছে। লম্বা ফসল (যেমন কলা বা পেঁপে) খুঁটিতে বেঁধে রাখুন।',
        color: 'bg-teal-600',
        icon: Wind
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'Safe',
        title: i18n.language === 'en' ? 'Favorable Conditions' : 'চাষাবাদের অনুকূল পরিবেশ',
        desc: i18n.language === 'en' 
          ? 'Weather conditions are stable. Good time for fertilizer application and harvesting.' 
          : 'আবহাওয়া স্থিতিশীল রয়েছে। সার প্রয়োগ এবং ফসল কাটার জন্য উপযুক্ত সময়।',
        color: 'bg-organic-green',
        icon: Sun
      });
    }

    return alerts;
  };

  return (
    <div className="space-y-12 pb-32">
      {/* Dynamic Header */}
      <header className="relative bg-organic-dark rounded-[4rem] p-10 sm:p-24 text-white overflow-hidden shadow-2xl min-h-[550px] flex flex-col justify-center items-center text-center">
        <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1504608524841-42fe6f032b4b" className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/95 via-organic-dark/60 to-organic-dark" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-12 max-w-4xl">
            <div className="space-y-8 flex flex-col items-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-organic-green text-[10px] font-black uppercase tracking-[0.3em]">
                    <CloudRain size={18} />
                    {t('weather_alerts')}
                </motion.div>
                <div className="space-y-4">
                    <h1 className="text-[10vw] sm:text-9xl font-black tracking-tighter leading-[1] uppercase px-4 break-words">
                        {i18n.language === 'en' ? 'SMART' : 'স্মার্ট'} <br />
                        <span className="text-organic-green">{i18n.language === 'en' ? 'FORECAST' : 'আবহাওয়া'}</span>
                    </h1>
                </div>
                <p className="text-lg sm:text-2xl text-green-50/60 font-bold max-w-2xl mx-auto leading-tight uppercase tracking-tight px-6 pt-2">
                   {i18n.language === 'en' ? 'Real-time agricultural weather intel for your fields.' : 'আপনার জমির জন্য রিয়েল-টাইম কৃষি আবহাওয়ার তথ্য।'}
                </p>
            </div>

            {loading ? (
                <div className="w-48 h-48 rounded-full border-4 border-white/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-organic-green" size={48} />
                </div>
            ) : weather ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 bg-white/5 backdrop-blur-2xl p-12 rounded-[5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] min-w-[280px]">
                    <div className="text-9xl font-black tracking-tighter flex items-start leading-none">
                        {weather.current.temp}<span className="text-4xl mt-6 text-organic-green">°C</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-white/40">{district}</span>
                        <div className="text-2xl font-black uppercase tracking-tight text-organic-green">
                           {i18n.language === 'en' ? weather.current.condition : (weather.current.condition === 'Sunny' ? 'রৌদ্রোজ্জ্বল' : weather.current.condition)}
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-2">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
            {!loading && weather && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {[
                        { label: 'Humidity', value: `${weather.current.humidity}%`, icon: Droplets, color: 'text-blue-500' },
                        { label: 'Wind Speed', value: `${weather.current.wind} km/h`, icon: Wind, color: 'text-teal-400' },
                        { label: 'Cloudiness', value: `${weather.current.cloud}%`, icon: Cloud, color: 'text-gray-400' },
                        { label: 'Feels Like', value: `${weather.current.feelsLike}°C`, icon: Thermometer, color: 'text-orange-400' },
                    ].map((m, i) => (
                        <div key={i} className="organic-card p-10 flex flex-col items-center text-center gap-3">
                            <m.icon size={28} className={m.color} />
                            <span className="text-3xl font-black text-organic-dark dark:text-white transition-colors">{m.value}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-organic-dark/30 dark:text-gray-500">{m.label}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-organic-green rounded-full" />
                    <h2 className="text-3xl font-black text-organic-dark dark:text-white tracking-tighter uppercase">{i18n.language === 'en' ? 'Priority Alerts' : 'গুরুত্বপূর্ণ সতর্কতা'}</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        [1,2].map(i => <div key={i} className="h-40 bg-white dark:bg-dark-surface rounded-[3.5rem] animate-pulse border border-organic-green/5 dark:border-white/5" />)
                    ) : weather ? (
                        getAlerts(weather).map((alert, idx) => (
                            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} key={idx} className="bg-white dark:bg-dark-surface rounded-[3.5rem] p-10 sm:p-12 flex flex-col sm:flex-row items-center gap-10 border border-organic-green/5 dark:border-white/5 shadow-xl group hover:shadow-2xl transition-all">
                                <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-12", alert.color)}>
                                    <alert.icon size={44} />
                                </div>
                                <div className="flex-grow space-y-3 text-center sm:text-left">
                                    <h3 className="text-2xl font-black text-organic-dark dark:text-white uppercase tracking-tight leading-none transition-colors">{alert.title}</h3>
                                    <p className="text-organic-dark/60 dark:text-gray-400 font-medium text-lg max-w-xl leading-relaxed transition-colors">{alert.desc}</p>
                                </div>
                                <div className="hidden sm:block">
                                   <div className="w-12 h-12 bg-organic-light rounded-full flex items-center justify-center text-organic-green/30 group-hover:text-organic-green transition-colors">
                                      <ArrowRight size={24} />
                                   </div>
                                </div>
                            </motion.div>
                        ))
                    ) : null}
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
            <div className="bg-white dark:bg-dark-surface rounded-[3.5rem] p-10 border border-organic-green/10 dark:border-white/10 shadow-xl space-y-10">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-organic-dark dark:text-white tracking-tighter uppercase">{i18n.language === 'en' ? 'Change Location' : 'অবস্থান পরিবর্তন'}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-organic-dark/30 dark:text-white/30">Get alerts for any district</p>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-4">
                        <select 
                          value={district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="organic-input py-5 text-lg appearance-none cursor-pointer bg-white dark:bg-dark-bg dark:text-white dark:border-dark-border transition-colors"
                        >
                          <option value="" disabled className="dark:bg-dark-bg">{i18n.language === 'en' ? 'Select District' : 'জেলা নির্বাচন করুন'}</option>
                          {BANGLADESH_DISTRICTS.map(d => (
                            <option key={d.en} value={d.en} className="dark:bg-dark-bg">{i18n.language === 'en' ? d.en : d.bn}</option>
                          ))}
                        </select>

                        {district && (
                          <select 
                            value={upazila}
                            onChange={(e) => handleUpazilaChange(e.target.value)}
                            className="organic-input py-5 text-lg appearance-none cursor-pointer bg-white dark:bg-dark-bg dark:text-white dark:border-dark-border transition-colors"
                          >
                            <option value="" className="dark:bg-dark-bg">{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন করুন'}</option>
                            {(DISTRICT_UPAZILAS[district] || []).map(u => (
                              <option key={u.en} value={u.en} className="dark:bg-dark-bg">{i18n.language === 'en' ? u.en : u.bn}</option>
                            ))}
                          </select>
                        )}
                    </div>
                    <button 
                        onClick={() => fetchWeather(upazila ? `${upazila}, ${district}` : district)}
                        disabled={loading}
                        className="organic-btn w-full bg-organic-dark dark:bg-white text-white dark:text-organic-dark shadow-xl hover:bg-black dark:hover:bg-gray-200 flex items-center justify-center gap-3 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                        <span className="text-lg uppercase tracking-widest">{i18n.language === 'en' ? 'Refresh' : 'আপডেট'}</span>
                    </button>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-3">
                   {['Dhaka', 'Rajshahi', 'Sylhet', 'Khulna'].map(loc => (
                       <button 
                         key={loc}
                         onClick={() => { handleDistrictChange(loc); }}
                         className="px-4 py-3 bg-organic-light dark:bg-dark-bg rounded-2xl text-[10px] font-black uppercase tracking-widest text-organic-dark/60 dark:text-gray-400 hover:bg-organic-green hover:text-white dark:hover:bg-organic-green transition-all"
                       >
                         {loc}
                       </button>
                   ))}
                </div>
            </div>

            <div className="bg-organic-green rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                 <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">{i18n.language === 'en' ? 'Farmer Guide' : 'কৃষক নির্দেশিকা'}</h3>
                    <p className="text-green-50/70 font-medium leading-relaxed italic">
                        {i18n.language === 'en' 
                            ? 'Monitor cloud cover closely. High humidity during the night can promote fungal growth in livestock bedding.' 
                            : 'মেঘলা আকাশের প্রতি সজাগ থাকুন। রাতে অতিরিক্ত আর্দ্রতা গবাদি পশুর বিছানায় ছত্রাক জন্মাতে উৎসাহিত করতে পারে।'}
                    </p>
                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}

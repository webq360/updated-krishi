import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, BookOpen, Phone, ExternalLink, ChevronRight, Info, ShieldCheck, FileText, Users, MapPin, X, Navigation } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY as string) || (typeof process !== 'undefined' && (process.env as any)?.GOOGLE_MAPS_PLATFORM_KEY) || '';

const DEFAULT_OFFICES = [
  {
    id: 'dae-dhaka',
    displayName: 'Department of Agricultural Extension (DAE)',
    location: { lat: 23.7544, lng: 90.3934 },
    formattedAddress: 'Khamarbari, Farmgate, Dhaka 1215',
    type: 'Agriculture'
  },
  {
    id: 'dls-dhaka',
    displayName: 'Department of Livestock Services (DLS)',
    location: { lat: 23.7507, lng: 90.3920 },
    formattedAddress: 'Krishi Khamar Sarak, Farmgate, Dhaka',
    type: 'Livestock'
  },
  {
    id: 'dof-dhaka',
    displayName: 'Department of Fisheries (DoF)',
    location: { lat: 23.7317, lng: 90.4132 },
    formattedAddress: 'Matshya Bhaban, Ramna, Dhaka',
    type: 'Fisheries'
  },
  {
    id: 'dae-chattogram',
    displayName: 'District Agriculture Office, Chattogram',
    location: { lat: 22.3569, lng: 91.7832 },
    formattedAddress: 'Common area, Chattogram',
    type: 'Agriculture'
  },
  {
    id: 'dls-rajshahi',
    displayName: 'Divisional Livestock Office, Rajshahi',
    location: { lat: 24.3745, lng: 88.6042 },
    formattedAddress: 'Regional office, Rajshahi',
    type: 'Livestock'
  }
];

function LocalOfficeMap({ onClose }: { onClose: () => void }) {
  const { i18n } = useTranslation();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [offices, setOffices] = useState<any[]>(DEFAULT_OFFICES);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          if (map) map.setCenter(loc);
        },
        () => {
          // Default to Dhaka if blocked
          setUserLocation({ lat: 23.8103, lng: 90.4125 });
        }
      );
    }
  }, [map]);

  useEffect(() => {
    if (!placesLib || !userLocation || !map) return;

    setLoading(true);
    const searchTerms = [
      'Upazila Agriculture Office',
      'Department of Livestock Services',
      'Department of Fisheries'
    ];

    const findOffices = async () => {
      const allResults: any[] = [];
      for (const term of searchTerms) {
        const request = {
          textQuery: `${term} Bangladesh`,
          locationBias: userLocation,
          fields: ['displayName', 'location', 'formattedAddress', 'id', 'types'],
          maxResultCount: 5
        };
        
        try {
          // Note: Using searchByText as per GMC guidelines for "Local Discovery"
          const { places } = await placesLib.Place.searchByText(request);
          if (places) allResults.push(...places);
        } catch (err) {
          console.error(`Search failed for ${term}`, err);
        }
      }
      
      // Filter unique results by ID
      const resultsMap = new window.Map([...DEFAULT_OFFICES, ...allResults].map(p => [p.id, p]));
      const uniqueResults = Array.from(resultsMap.values()) as any[];
      setOffices(uniqueResults);
      setLoading(false);

      if (uniqueResults.length > 0 && map) {
        const bounds = new google.maps.LatLngBounds();
        uniqueResults.forEach(p => {
          if (p.location) bounds.extend(p.location as google.maps.LatLngLiteral);
        });
        bounds.extend(userLocation);
        map.fitBounds(bounds);
      }
    };

    findOffices();
  }, [placesLib, userLocation, map]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl h-[80vh] bg-white dark:bg-dark-surface rounded-[3rem] overflow-hidden shadow-full flex flex-col"
      >
        <div className="p-6 border-b border-[#E0E8E0] dark:border-white/10 flex items-center justify-between bg-white dark:bg-dark-surface z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F5E9] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-400 rounded-xl flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-black text-[#1B301B] dark:text-white uppercase tracking-tight">
                {i18n.language === 'en' ? 'Nearby Agriculture Offices' : 'নিকটস্থ কৃষি অফিসসমূহ'}
              </h3>
              <p className="text-[10px] font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest">
                Showing DLS, Fisheries & Agriculture locations
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0F5F0] dark:hover:bg-white/10 rounded-full transition-all text-[#1B301B] dark:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow relative">
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-[#2E7D32] uppercase tracking-widest">Finding Offices...</p>
              </div>
            </div>
          )}
          
          <Map
            defaultCenter={{ lat: 23.8103, lng: 90.4125 }}
            defaultZoom={11}
            mapId="LOCAL_OFFICES_MAP"
            style={{ width: '100%', height: '100%' }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse" title="Your Location" />
              </AdvancedMarker>
            )}

            {offices.map(office => (
              <AdvancedMarker 
                key={office.id} 
                position={office.location}
              >
                <Pin background="#2E7D32" glyphColor="#fff" borderColor="#1B301B" />
              </AdvancedMarker>
            ))}
          </Map>

          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:w-80 space-y-2 max-h-48 overflow-y-auto no-scrollbar pointer-events-none">
            {offices.slice(0, 3).map(office => (
              <motion.div 
                key={office.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 pointer-events-auto"
              >
                <h4 className="text-xs font-black text-[#1B301B] dark:text-white truncate">{office.displayName}</h4>
                <p className="text-[10px] text-[#556B55] dark:text-gray-400 line-clamp-1 mt-1">{office.formattedAddress}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function GovtSchemes() {
  const { t, i18n } = useTranslation();
  const [showMap, setShowMap] = useState(false);

  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  const schemes = [
    {
      id: 1,
      title: i18n.language === 'en' ? 'Agricultural Input Assistance' : 'কৃষি উপকরণ সহায়তা কার্ড',
      desc: i18n.language === 'en' 
        ? 'Get subsidies on seeds, fertilizers, and electricity for irrigation through the Krishi Card.' 
        : 'কৃষি কার্ডের মাধ্যমে বীজ, সার এবং সেচের বিদ্যুতে ভর্তুকি পান।',
      link: 'https://dae.gov.bd',
      category: 'Subsidy'
    },
    {
      id: 2,
      title: i18n.language === 'en' ? 'Low Interest Agri-Loan' : 'স্বল্প সুদে কৃষি ঋণ',
      desc: i18n.language === 'en' 
        ? 'Special loan schemes for small and medium farmers at 4% interest rate for specific crops.' 
        : 'নির্দিষ্ট ফসলের জন্য ৪% সুদে ক্ষুদ্র ও মাঝারি কৃষকদের জন্য বিশেষ ঋণ সুবিধা।',
      link: 'https://bb.org.bd',
      category: 'Loan'
    },
    {
      id: 3,
      title: i18n.language === 'en' ? 'Crop Insurance' : 'শস্য বীমা সুবিধা',
      desc: i18n.language === 'en' 
        ? 'Protect your investment against natural disasters like floods and cyclones.' 
        : 'বন্যা এবং ঘূর্ণিঝড়ের মতো প্রাকৃতিক দুর্যোগে আপনার বিনিয়োগ সুরক্ষিত রাখুন।',
      link: 'https://sbc.gov.bd',
      category: 'Insurance'
    },
    {
      id: 4,
      title: i18n.language === 'en' ? 'Farm Mechanization' : 'কৃষি যান্ত্রিকীকরণ প্রকল্প',
      desc: i18n.language === 'en' 
        ? 'Up to 50-70% subsidy on purchasing tractors, harvesters, and other machinery.' 
        : 'ট্রাক্টর, হারভেস্টার এবং অন্যান্য যন্ত্রপাতি ক্রয়ে ৫০-৭০% পর্যন্ত ভর্তুকি।',
      link: 'https://dae.gov.bd',
      category: 'Machinery'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1541872703-74c5e443d1f0" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Landmark size={18} />
              {t('govt_schemes')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'GOVT' : 'সরকারি'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words">{i18n.language === 'en' ? 'SCHEMES' : 'অনুদান'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6">
              {i18n.language === 'en' 
                ? 'Stay updated with the latest government subsidies, loans, and agricultural support programs.' 
                : 'সরকারের সর্বশেষ কৃষি ভর্তুকি, ঋণ এবং সহায়তা কর্মসূচি সম্পর্কে আপডেট থাকুন।'}
            </p>
          </div>
        </div>
        <ShieldCheck className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-[#1B301B] dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <FileText className="text-[#4CAF50]" size={24} />
            {i18n.language === 'en' ? 'Active Support Programs' : 'চলমান সহায়তা কর্মসূচি'}
          </h2>
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 gap-4"
          >
            {schemes.map((scheme) => (
              <motion.div
                key={scheme.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                whileHover={{ x: 10, backgroundColor: 'rgba(76, 175, 80, 0.05)' }}
                className="bg-white dark:bg-dark-surface rounded-3xl p-6 border border-[#E0E8E0] dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#F0F5F0] dark:bg-dark-bg flex items-center justify-center text-[#4CAF50] shrink-0 group-hover:bg-[#4CAF50] group-hover:text-white transition-all">
                  <Landmark size={32} />
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#E8F5E9] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {scheme.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1B301B] dark:text-white">{scheme.title}</h3>
                  <p className="text-[#556B55] dark:text-gray-400 text-sm leading-relaxed">{scheme.desc}</p>
                </div>
                <a 
                  href={scheme.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#F9FBF9] dark:bg-dark-bg text-[#4CAF50] rounded-xl hover:bg-[#43A047] hover:text-white transition-all border border-[#E0E8E0] dark:border-white/10"
                >
                  <ExternalLink size={20} />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 border border-[#E0E8E0] dark:border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-[#1B301B] dark:text-white mb-6 flex items-center gap-2">
              <Phone className="text-[#4CAF50]" size={20} />
              {i18n.language === 'en' ? 'Emergency Contacts' : 'জরুরি যোগাযোগ'}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#F9FBF9] dark:bg-dark-bg rounded-2xl border border-[#E0E8E0] dark:border-white/10 text-center">
                <p className="text-[10px] font-bold text-[#8BA88B] dark:text-gray-500 uppercase mb-1">Agriculture Hotline</p>
                <p className="text-xl font-black text-[#1B301B] dark:text-white">16123</p>
                <p className="text-xs text-[#556B55] dark:text-gray-400 mt-1">Free call from any mobile</p>
              </div>
              <div className="p-4 bg-[#F9FBF9] dark:bg-dark-bg rounded-2xl border border-[#E0E8E0] dark:border-white/10 text-center">
                <p className="text-[10px] font-bold text-[#8BA88B] dark:text-gray-500 uppercase mb-1">DAE Office</p>
                <p className="text-lg font-bold text-[#1B301B] dark:text-white">02-9140850</p>
                <p className="text-xs text-[#556B55] dark:text-gray-400 mt-1">Khamarbari, Dhaka</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1B301B] rounded-[2.5rem] p-8 text-white shadow-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-green-400" />
              {i18n.language === 'en' ? 'Required Documents' : 'প্রয়োজনীয় কাগজপত্র'}
            </h3>
            <ul className="space-y-3">
              {[
                'National ID Card (NID)',
                'Krishi Card / Farmer ID',
                'Land Ownership Document',
                'Bank Account Details',
                'Passport Size Photo'
              ].map((doc, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-green-50/80">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 border border-[#E0E8E0] dark:border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-[#4CAF50]" size={24} />
              <h3 className="text-xl font-bold text-[#1B301B] dark:text-white uppercase tracking-tight leading-none">Local Office</h3>
            </div>
            <p className="text-sm text-[#556B55] dark:text-gray-400 leading-relaxed mb-6">
              Find your nearest Upazila Agriculture Office for personalized assistance and physical verification.
            </p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMap(true)}
              className="w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold hover:bg-[#43A047] transition-all flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              {i18n.language === 'en' ? 'Locate Office' : 'নিকটস্থ অফিস খুঁজুন'}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMap && (
          <APIProvider apiKey={API_KEY} version="weekly">
            {!hasValidKey ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-dark-surface p-10 rounded-[3rem] max-w-md text-center space-y-6">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <MapPin size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-[#1B301B] dark:text-white uppercase tracking-tight leading-none">Maps API Key Required</h2>
                  <p className="text-sm text-[#556B55] dark:text-gray-400 leading-relaxed">
                    To use the office locator, please add your <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> in Settings → Secrets.
                  </p>
                  <button onClick={() => setShowMap(false)} className="w-full py-3 bg-gray-100 dark:bg-dark-bg text-[#1B301B] dark:text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <LocalOfficeMap onClose={() => setShowMap(false)} />
            )}
          </APIProvider>
        )}
      </AnimatePresence>
    </div>
  );
}

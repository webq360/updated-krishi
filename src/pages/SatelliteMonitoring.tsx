import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, MapPin, Search, Info, AlertTriangle, 
  Droplets, Thermometer, Sun, Wind, Leaf, 
  Sparkles, Layers, Cpu, Database, Navigation2, 
  LocateFixed, Target, Crosshair
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { cn } from '../lib/utils';
import { BANGLADESH_DISTRICTS, DISTRICT_UPAZILAS } from '../constants/districts';

const SATELLITE_COORDINATES = [
  { id: 'LANDSAT-9', pos: [23.8103, 90.4125] as [number, number], speed: 0.00018, direction: [1, 1], label: 'Landsat 9', type: 'Optical' },
  { id: 'SENTINEL-2A', pos: [24.3636, 88.6241] as [number, number], speed: 0.00022, direction: [-1, 0.5], label: 'Sentinel-2A', type: 'Multispectral' },
  { id: 'SENTINEL-1B', pos: [22.3752, 91.8433] as [number, number], speed: 0.00015, direction: [0.3, -1], label: 'Sentinel-1B', type: 'SAR' },
  { id: 'TERRA-MODIS', pos: [25.7439, 89.2752] as [number, number], speed: 0.00012, direction: [-0.5, -1], label: 'MODIS Terra', type: 'Infrared' },
  { id: 'AQUA-MODIS', pos: [22.7010, 90.3535] as [number, number], speed: 0.00014, direction: [1, -0.2], label: 'MODIS Aqua', type: 'Thermal' },
  { id: 'COPERNICUS-3', pos: [24.8949, 91.8687] as [number, number], speed: 0.00025, direction: [-0.8, 0.8], label: 'Copernicus-S3', type: 'Vegetation' },
  { id: 'NOAA-20', pos: [23.0, 89.0] as [number, number], speed: 0.00020, direction: [1, 0.2], label: 'NOAA-20', type: 'Weather' },
  { id: 'GOES-16', pos: [26.0, 92.0] as [number, number], speed: 0.00010, direction: [-0.1, -1], label: 'GOES-16', type: 'Atmospheric' },
  { id: 'METEOSAT', pos: [21.0, 91.0] as [number, number], speed: 0.00018, direction: [0.5, 0.5], label: 'Meteosat-11', type: 'Optical' },
  { id: 'SENTINEL-5P', pos: [25.0, 90.0] as [number, number], speed: 0.00030, direction: [-1, -1], label: 'Sentinel-5P', type: 'Pollution' },
];

export default function SatelliteMonitoring() {
  const { i18n, t } = useTranslation();
  const [coords, setCoords] = useState<{lat: number, lng: number}>({ lat: 23.6850, lng: 90.3563 }); // Default center of BD
  const [selectedLocation, setSelectedLocation] = useState<string>('Dhaka Central');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'terrain' | 'street'>('satellite');
  const [satPos, setSatPos] = useState(SATELLITE_COORDINATES);

  // Animate satellites
  useEffect(() => {
    const interval = setInterval(() => {
      setSatPos(prev => prev.map(s => {
        let nLat = s.pos[0] + s.speed * s.direction[0];
        let nLng = s.pos[1] + s.speed * s.direction[1];
        
        // Wrap around BD boundaries approx
        if (nLat > 27) nLat = 20;
        if (nLat < 20) nLat = 27;
        if (nLng > 93) nLng = 88;
        if (nLng < 88) nLng = 93;
        
        return { ...s, pos: [nLat, nLng] as [number, number] };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const layers = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=f669a844ef1d48c9918076646545163', // Requires API key but generic tiles usually work
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const districts = [
    { name: 'Dhaka', bn: 'ঢাকা', lat: 23.8103, lng: 90.4125 },
    { name: 'Chattogram', bn: 'চট্টগ্রাম', lat: 22.3569, lng: 91.7832 },
    { name: 'Rajshahi', bn: 'রাজশাহী', lat: 24.3745, lng: 88.6042 },
    { name: 'Sylhet', bn: 'সিলেট', lat: 24.8949, lng: 91.8687 },
    { name: 'Khulna', bn: 'খুলনা', lat: 22.8456, lng: 89.5403 },
    { name: 'Barishal', bn: 'বরিশাল', lat: 22.7010, lng: 90.3535 },
    { name: 'Rangpur', bn: 'রংপুর', lat: 25.7439, lng: 89.2752 },
    { name: 'Mymensingh', bn: 'ময়মনসিংহ', lat: 24.7471, lng: 90.4203 },
    { name: 'Bogura', bn: 'বগুড়া', lat: 24.8481, lng: 89.3730 },
    { name: 'Satkhira', bn: 'সাতক্ষীরা', lat: 22.7135, lng: 89.0725 },
    { name: 'Dinajpur', bn: 'দিনাজপুর', lat: 25.6217, lng: 88.6354 },
    { name: 'Cumilla', bn: 'কুমিল্লা', lat: 23.4607, lng: 91.1809 },
  ];

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    setSelectedUpazila('');
    const d = districts.find(x => x.name === districtName);
    if (d) {
      setCoords({ lat: d.lat, lng: d.lng });
      setSelectedLocation(i18n.language === 'en' ? d.name : d.bn);
      runAnalysis(d.lat, d.lng);
    }
  };

  const handleUpazilaChange = (upazilaName: string) => {
    setSelectedUpazila(upazilaName);
    const d = districts.find(x => x.name === selectedDistrict);
    if (d) {
      // Move center precisely for upazila simulation
      const offsetLat = (Math.random() - 0.5) * 0.08;
      const offsetLng = (Math.random() - 0.5) * 0.08;
      const newLat = d.lat + offsetLat;
      const newLng = d.lng + offsetLng;
      setCoords({ lat: newLat, lng: newLng });
      setSelectedLocation(`${i18n.language === 'en' ? selectedDistrict : districts.find(x => x.name === selectedDistrict)?.bn} - ${upazilaName}`);
      runAnalysis(newLat, newLng);
    }
  };

  const runAnalysis = useCallback((lat: number, lng: number) => {
    setLoading(true);
    setCoords({ lat, lng });
    
    setTimeout(() => {
      const seed = lat + lng;
      const pseudoRand = (s: number) => Math.abs(Math.sin(s) * 10000) % 1;

      setAnalysis({
        moisture: Math.floor(pseudoRand(seed * 1) * 40) + 30,
        nitrogen: Math.floor(pseudoRand(seed * 2) * 50) + 20,
        temp: Math.floor(pseudoRand(seed * 3) * 15) + 20,
        health: Math.floor(pseudoRand(seed * 4) * 20) + 75,
        recommendation: i18n.language === 'en' 
          ? `Analysis for coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) indicates soil moisture is at ${Math.floor(pseudoRand(seed * 1) * 40) + 30}%. Vegetation index (NDVI) is 0.74, showing strong biomass. Recommend N-P-K boost for upcoming growth phase.`
          : `স্থানাঙ্ক (${lat.toFixed(4)}, ${lng.toFixed(4)}) এর বিশ্লেষণে দেখা গেছে মাটির আর্দ্রতা ${Math.floor(pseudoRand(seed * 1) * 40) + 30}%। ভেজিটেশন ইনডেক্স (NDVI) ০.৭৪, যা মাঠের ভাল বৃদ্ধি নির্দেশ করছে। পরবর্তী পর্যায়ের জন্য এন-পি-কে সার বৃদ্ধিতে সহায়তা করবে।`
      });
      setLoading(false);
    }, 1200);
  }, [i18n.language]);

  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setCoords({ lat, lng });
        setSelectedLocation(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        runAnalysis(lat, lng);
      },
    });
    
    useEffect(() => {
      map.flyTo([coords.lat, coords.lng], 14, {
        animate: true,
        duration: 2.0,
        easeLinearity: 0.25
      });
    }, [coords, map]);
    
    return null;
  }

  useEffect(() => {
    runAnalysis(coords.lat, coords.lng);
  }, []);

  return (
    <div className="space-y-10 pb-20">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-30">
          <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/90 via-transparent to-organic-dark/90" />
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Layers size={18} />
              {i18n.language === 'en' ? 'LIVE SATELLITE INTEL' : 'লাইভ স্যাটেলাইট ইন্টেল'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'SKY-EYE' : 'মহাকাশ'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words">{i18n.language === 'en' ? 'MONITORING' : 'পর্যবেক্ষণ'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {i18n.language === 'en' 
                ? 'Deep-scanning your fields using multispectral satellite data for unmatched precision.' 
                : 'অতুলনীয় নিখুঁত পর্যবেক্ষণের জন্য মাল্টিস্পেকট্রাল স্যাটেলাইট ডেটা ব্যবহার করে আপনার কৃষি খামার গভীরভাবে পর্যবেক্ষণ করুন।'}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-organic-dark to-transparent pointer-events-none" />
        <Cpu className="absolute -bottom-10 -right-10 w-96 h-96 text-white/5" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] border-4 border-organic-dark/5 overflow-hidden shadow-2xl aspect-[16/10] relative group z-0">
            {/* Real Interactive Map View */}
            <MapContainer 
              center={[coords.lat, coords.lng]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; ESRI & contributors'
                url={layers[mapLayer]}
              />
              <MapEvents />
              <Marker position={[coords.lat, coords.lng]}>
                <Popup>
                  <p className="font-black text-organic-dark uppercase text-xs">Scanning Core</p>
                  <p className="text-[10px] text-organic-dark/60">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
                </Popup>
              </Marker>

              {satPos.map(sat => (
                <Marker 
                  key={sat.id} 
                  position={sat.pos}
                  icon={L.divIcon({
                    className: 'satellite-marker',
                    html: `<div class="relative group">
                            <div class="absolute -inset-4 bg-organic-green/40 blur-xl rounded-full scale-150 animate-[pulse_1.5s_infinite] opacity-30"></div>
                            <div class="absolute -inset-2 bg-organic-green/60 blur-lg rounded-full scale-110 animate-[pulse_2s_infinite] opacity-50"></div>
                            <div class="relative bg-black border border-white/20 p-1.5 rounded-lg text-white shadow-2xl flex items-center gap-2 scale-75 whitespace-nowrap group-hover:scale-100 transition-transform">
                              <svg class="animate-[spin_10s_linear_infinite]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 8l-8 5-8-5V6l8 5 8-5v2z"/><path d="M2 12l10 5 10-5"/><path d="M12 22V12"/>
                              </svg>
                              <div class="flex flex-col">
                                <span class="text-[8px] font-black uppercase tracking-widest">${sat.label}</span>
                                <span class="text-[6px] font-bold text-green-400 uppercase tracking-tighter tabular-nums">${(Math.random() * 100).toFixed(1)} Mb/s</span>
                              </div>
                            </div>
                           </div>`,
                    iconSize: [100, 40],
                    iconAnchor: [50, 20]
                  })}
                >
                  <Popup>
                    <div className="p-2 space-y-1">
                      <p className="font-black text-[10px] uppercase text-organic-green tracking-widest">{sat.id}</p>
                      <p className="text-xs font-bold leading-tight">{sat.type} Instrument Array</p>
                      <div className="flex gap-2 pt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[8px] font-bold">LIVE</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[8px] font-bold">STABLE</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map UI Overlays */}
            <div className="absolute top-8 left-8 z-20 space-y-4 max-w-[80%]">
              <div className="flex flex-wrap gap-3">
                <div className="flex bg-white/90 backdrop-blur-xl p-1 rounded-2xl shadow-2xl border border-white">
                  {(['satellite', 'terrain', 'street'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setMapLayer(l)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        mapLayer === l ? "bg-organic-dark text-white shadow-lg" : "text-organic-dark/40 hover:bg-gray-100"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <select 
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white shadow-2xl outline-none"
                    value={selectedDistrict}
                  >
                    <option value="" disabled>{i18n.language === 'en' ? 'Select District' : 'জেলা'}</option>
                    {districts.map(d => (
                      <option key={d.name} value={d.name}>{i18n.language === 'en' ? d.name : d.bn}</option>
                    ))}
                  </select>

                  {selectedDistrict && (
                    <select 
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      className="px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white shadow-2xl outline-none animate-in fade-in slide-in-from-left-4"
                      value={selectedUpazila}
                    >
                      <option value="" disabled>{i18n.language === 'en' ? 'Select Upazila' : 'উপজেলা'}</option>
                      {(DISTRICT_UPAZILAS[selectedDistrict] || []).map(u => (
                        <option key={u.en} value={u.en}>{i18n.language === 'en' ? u.en : u.bn}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="p-5 bg-organic-dark/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl inline-flex flex-col gap-1 text-white">
                 <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-green-400">
                    <Crosshair size={14} />
                    <span>Real-time Telemetry</span>
                 </div>
                 <p className="text-lg font-mono font-bold tracking-tight tabular-nums">
                    {coords.lat.toFixed(6)} N, {coords.lng.toFixed(6)} E
                 </p>
              </div>
            </div>

            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
               <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        setCoords({ lat: latitude, lng: longitude });
                        setSelectedLocation('Live GPS');
                        runAnalysis(latitude, longitude);
                      });
                    }
                  }}
                  className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-organic-dark hover:bg-organic-green hover:text-white transition-all shadow-2xl active:scale-90"
                  title="My Location"
               >
                  <LocateFixed size={24} />
               </button>
               <button 
                  className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-organic-dark hover:bg-organic-green hover:text-white transition-all shadow-2xl active:scale-90"
                  title="Satellite Toggle"
               >
                  <Sun size={24} />
               </button>
            </div>

            <div className="absolute bottom-8 inset-x-8 z-20 flex justify-between items-end">
               <div className="bg-organic-dark/80 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl border border-white/10 flex flex-col gap-4 max-w-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400">
                      <Target size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Active Scan Area</p>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedLocation}</p>
                    </div>
                  </div>
               </div>

               <div className="flex gap-4">
                <div className="bg-white p-4 px-6 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border border-white">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase text-organic-dark tracking-tighter">Healthy Vegetation</span>
                </div>
                <div className="bg-white p-4 px-6 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border border-white">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase text-organic-dark tracking-tighter">Scress Zones</span>
                </div>
               </div>
            </div>
            
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-organic-dark/70 backdrop-blur-xl z-[30] flex flex-col items-center justify-center text-white gap-8"
                >
                  <div className="relative">
                    <Cpu size={100} className="text-green-400 opacity-20" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-t-4 border-green-400 rounded-full"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-black uppercase tracking-tighter">Syncing Satellites</p>
                    <p className="text-green-400 font-bold uppercase text-[10px] tracking-[0.4em] animate-pulse">Requesting Multispectral Tiles...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-organic-light shadow-sm text-center space-y-2">
              <Droplets className="mx-auto text-blue-500" size={32} />
              <p className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest">Moisture</p>
              <p className="text-2xl font-black text-organic-dark">{analysis?.moisture || '--'}%</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-organic-light shadow-sm text-center space-y-2">
              <Sparkles className="mx-auto text-amber-500" size={32} />
              <p className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest">Nitrogen</p>
              <p className="text-2xl font-black text-organic-dark">{analysis?.nitrogen || '--'}%</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-organic-light shadow-sm text-center space-y-2">
              <Thermometer className="mx-auto text-red-500" size={32} />
              <p className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest">Temperature</p>
              <p className="text-2xl font-black text-organic-dark">{analysis?.temp || '--'}°C</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-organic-light shadow-sm text-center space-y-2">
              <Leaf className="mx-auto text-green-500" size={32} />
              <p className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest">Crop Health</p>
              <p className="text-2xl font-black text-organic-dark">{analysis?.health || '--'}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-organic-dark rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Info size={120} />
            </div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
              <AlertTriangle className="text-amber-400" />
              {i18n.language === 'en' ? 'AI Insights' : 'এআই অন্তর্দৃষ্টি'}
            </h3>
            <div className="space-y-6 relative z-10">
              <p className="text-lg font-medium leading-relaxed text-green-50/80">
                {analysis?.recommendation || (i18n.language === 'en' ? 'Waiting for data...' : 'তথ্যের জন্য অপেক্ষা করা হচ্ছে...')}
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-black uppercase">
                  <span>Vegetation Index (NDVI)</span>
                  <span className="text-green-400">0.72 (Excellent)</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 w-[72%]" />
                </div>
              </div>
              <button 
                onClick={() => runAnalysis(coords.lat, coords.lng)}
                className="w-full py-5 bg-organic-green text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform"
              >
                {i18n.language === 'en' ? 'Refresh Scan' : 'পুনরায় স্ক্যান করুন'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-organic-light shadow-sm">
            <h3 className="text-xl font-black text-organic-dark mb-6"> {i18n.language === 'en' ? 'Satellite Schedule' : 'স্যাটেলাইট তফশিল'}</h3>
            <div className="space-y-6">
              {[
                { time: '09:20 AM', mission: 'Sentinel-2A', status: 'Completed' },
                { time: '12:45 PM', mission: 'Landsat 8', status: 'Scheduled' },
                { time: '04:15 PM', mission: 'Sentinel-2B', status: 'Pending' },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-organic-light rounded-xl flex items-center justify-center text-organic-green font-bold text-[10px] group-hover:bg-organic-green group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-black text-organic-dark uppercase">{task.mission}</p>
                    <p className="text-[10px] font-bold text-organic-dark/40 uppercase tracking-widest">{task.time} • {task.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

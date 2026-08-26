import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, MapPin, Phone, ExternalLink, Filter, 
  Warehouse, Tractor, Briefcase, UserCircle, 
  Navigation, Crosshair, ChevronRight, Info, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, query, onSnapshot, where, getDocs } from '../lib/db';
import { useTranslation } from 'react-i18next';
import { BANGLADESH_DISTRICTS } from '../constants/districts';

// Simple helper to get approximate coordinates for districts
const getDistrictCoords = (districtName: string): [number, number] => {
  const district = BANGLADESH_DISTRICTS.find(d => 
    d.en.toLowerCase() === districtName.toLowerCase() || 
    d.bn === districtName
  );
  if (district) {
    // These are placeholders, a real app might need a proper mapping
    const coords: Record<string, [number, number]> = {
      'Dhaka': [23.8103, 90.4125],
      'Bogura': [24.8481, 89.3730],
      'Rajshahi': [24.3745, 88.6042],
      'Barishal': [22.7010, 90.3535],
      'Chattogram': [22.3569, 91.7832],
      'Comilla': [23.4607, 91.1809],
      'Dinajpur': [25.6217, 88.6354],
      'Gazipur': [24.0023, 90.4264],
      'Jessore': [23.1664, 89.2081],
      'Mymensingh': [24.7471, 90.4203],
      'Rangpur': [25.7439, 89.2752],
      'Sirajganj': [24.4534, 89.7047],
      'Sylhet': [24.8949, 91.8687],
      'Pabna': [24.0063, 89.2493],
      'Natore': [24.4102, 88.9831],
      'Munshiganj': [23.5422, 90.5305],
      'Tangail': [24.2513, 89.9167],
    };
    return coords[district.en] || [23.8103, 90.4125];
  }
  return [23.8103 + (Math.random() - 0.5) * 0.5, 90.4125 + (Math.random() - 0.5) * 0.5]; // Slightly randomized Dhaka
};

// Fix for Leaflet default icon issues in React
function useLeafletIconFix() {
  useEffect(() => {
    try {
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      if (L.Marker && L.Marker.prototype && L.Marker.prototype.options) {
        L.Marker.prototype.options.icon = DefaultIcon;
      }
    } catch (e) {
      console.error("Leaflet icon error:", e);
    }
  }, []);
}

interface Resource {
  id: string;
  name: string;
  name_en?: string;
  name_bn?: string;
  type: 'storage' | 'rental' | 'dealer' | 'agent' | 'cold-storage' | 'machinery-rental' | 'authorized-dealer';
  address: string;
  address_en?: string;
  address_bn?: string;
  district: string;
  district_en?: string;
  district_bn?: string;
  upazila?: string;
  upazila_en?: string;
  upazila_bn?: string;
  details?: string;
  details_en?: string;
  details_bn?: string;
  phone: string;
  lat: number;
  lng: number;
  latitude?: number; // fallback
  longitude?: number; // fallback
}

const TYPE_CONFIG = {
  'cold-storage': { icon: Warehouse, color: 'text-blue-500', bg: 'bg-blue-50', label_en: 'Cold Storage', label_bn: 'হিমাগার' },
  'machinery-rental': { icon: Tractor, color: 'text-amber-500', bg: 'bg-amber-50', label_en: 'Machinery Rental', label_bn: 'মেশিনারি রেন্টাল' },
  'authorized-dealer': { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50', label_en: 'Authorized Dealer', label_bn: 'অনুমোদিত ডিলার' },
  agent: { icon: UserCircle, color: 'text-purple-500', bg: 'bg-purple-50', label_en: 'Support Agent', label_bn: 'সাপোর্ট এজেন্ট' },
  // Fallbacks for legacy or extra types
  storage: { icon: Warehouse, color: 'text-blue-500', bg: 'bg-blue-50', label_en: 'Storage', label_bn: 'স্টোরেজ' },
  rental: { icon: Tractor, color: 'text-amber-500', bg: 'bg-amber-50', label_en: 'Rental', label_bn: 'রেন্টাল' },
  dealer: { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50', label_en: 'Dealer', label_bn: 'ডিলার' },
};

const getResourceConfig = (type: string) => {
  return TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG['authorized-dealer'];
};

export default function ResourceMap() {
  useLeafletIconFix();
  const { t, i18n } = useTranslation();
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [center, setCenter] = useState<[number, number]>([23.8103, 90.4125]); // Dhaka default
  const [zoom, setZoom] = useState(7);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const collectionsCfg = [
      { name: 'mapResources', type: 'authorized-dealer' },
      { name: 'coldStorage', type: 'cold-storage' },
      { name: 'rentMachines', type: 'machinery-rental' },
      { name: 'agentApplications', type: 'agent', filterApproved: true }
    ];

    const allData: Record<string, Resource[]> = {};

    collectionsCfg.forEach(cfg => {
      let q: any = collection(db, cfg.name);
      
      // For agent applications, regular users should only see approved ones
      if (cfg.filterApproved) {
        q = query(q, where('status', '==', 'approved'));
      }

      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const item = doc.data();
          if (cfg.filterApproved && item.status !== 'approved') return null;

          const district = item.district || 'Dhaka';
          const [dLat, dLng] = getDistrictCoords(district);

          return {
            id: doc.id,
            name: item.name || item.machineName || item.shopName || item.applicantName || 'Resource',
            name_en: item.name_en || item.name || item.machineName || item.shopName,
            name_bn: item.name_bn || item.name || item.machineName || item.shopName,
            type: cfg.type as any,
            address: item.address || item.location || item.shopAddress || '',
            district: district,
            upazila: item.upazila || '',
            phone: item.phone || item.contact || 'N/A',
            lat: item.lat || item.latitude || dLat,
            lng: item.lng || item.longitude || dLng,
            details: item.details || item.description || ''
          };
        }).filter(Boolean) as Resource[];

        allData[cfg.name] = data;
        
        // Merge all data
        const merged = Object.values(allData).flat();
        setResources(merged);
      }, (error) => {
        console.error(`Error loading ${cfg.name}:`, error);
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(fn => fn());
  }, []);

  useEffect(() => {
    // Force leaflet to recalculate its container size
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredResources = resources.filter(r => {
    const isBn = i18n.language === 'bn';
    const name = isBn ? (r.name_bn || r.name) : (r.name_en || r.name);
    const districtAddress = `${r.district} ${r.upazila} ${r.address}`.toLowerCase();
    
    const matchesType = activeType === 'all' || r.type === activeType;
    const matchesSearch = (name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         districtAddress.includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleFlyTo = (resource: Resource) => {
    const rLat = resource.lat || resource.latitude || 23.8103;
    const rLng = resource.lng || resource.longitude || 90.4125;
    setCenter([rLat, rLng]);
    setZoom(14);
    setSelectedResource(resource);
  };

  const isBn = i18n.language === 'bn';

  return (
    <div className="flex flex-col md:flex-row bg-white dark:bg-dark-bg rounded-[2rem] overflow-hidden border border-gray-100 dark:border-dark-border h-[calc(100vh-180px)] font-sans shadow-2xl">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[380px] h-[40%] md:h-full bg-white dark:bg-dark-surface border-t md:border-t-0 md:border-r border-[#E8EEE8] dark:border-dark-border flex flex-col z-20 order-2 md:order-1 flex-shrink-0">
        <div className="p-4 md:p-6 space-y-3 md:space-y-6 flex-shrink-0">
          <div className="space-y-1">
            <h1 className="text-[10vw] sm:text-4xl font-black text-organic-dark dark:text-gray-100 uppercase tracking-tight leading-[1.1]">{t('resource_map')}</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">
               {isBn ? 'আপনার কাছের কৃষি সম্পদ খুঁজুন' : 'Find agricultural resources near you'}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder={isBn ? 'নাম বা জেলা দিয়ে খুঁজুন...' : 'Search by name or district...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="organic-input pl-12 h-12 text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <FilterTab 
              label={isBn ? 'সব' : 'All'} 
              active={activeType === 'all'} 
              onClick={() => setActiveType('all')} 
            />
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <FilterTab 
                key={key}
                label={isBn ? cfg.label_bn : cfg.label_en} 
                active={activeType === key} 
                onClick={() => setActiveType(key)} 
              />
            ))}
          </div>
        </div>

        {/* Resource List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3 no-scrollbar content-scroll">
          {filteredResources.map((resource: Resource) => (
            <motion.div
              layout
              key={resource.id}
              onClick={() => handleFlyTo(resource)}
              className={`p-4 rounded-[24px] border-2 transition-all cursor-pointer group ${
                selectedResource?.id === resource.id 
                  ? 'border-organic-green bg-organic-green/5 shadow-inner' 
                  : 'border-transparent hover:border-gray-200 dark:hover:border-dark-border bg-gray-50 dark:bg-dark-bg/30'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${getResourceConfig(resource.type).bg} ${getResourceConfig(resource.type).color}`}>
                  {React.createElement(getResourceConfig(resource.type).icon, { size: 24 })}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-organic-dark dark:text-gray-100 group-hover:text-organic-green transition-colors line-clamp-1 uppercase tracking-tight">
                    {isBn ? (resource.name_bn || resource.name) : (resource.name_en || resource.name)}
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <MapPin size={12} />
                      <span>{isBn ? (resource.district_bn || resource.district) : (resource.district_en || resource.district)}</span>
                    </div>
                    {resource.upazila && (
                      <span className="text-[10px] text-organic-green font-black uppercase tracking-widest ml-4 opacity-70">
                         {resource.upazila}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                     <a href={`tel:${resource.phone}`} className="text-xs font-bold flex items-center gap-1 text-organic-green hover:underline" onClick={(e) => e.stopPropagation()}>
                        <Phone size={12} /> {resource.phone}
                     </a>
                     <button className="text-[10px] font-black uppercase text-gray-400 group-hover:text-organic-dark dark:group-hover:text-white flex items-center gap-1">
                        {isBn ? 'ম্যাপে দেখুন' : 'View On Map'} <ChevronRight size={10} />
                     </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredResources.length === 0 && (
             <div className="text-center py-20 px-10">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Crosshair className="text-gray-200" size={40} />
                </div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-loose">
                   {isBn ? 'এই এলাকায় বা এই ক্যাটাগরিতে কিছু পাওয়া যায়নি' : 'No resources found for this search or category.'}
                </p>
             </div>
          )}
        </div>
      </div>

      {/* Map Implementation */}
      <div className="flex-1 h-[60%] md:h-full relative border-l border-white/5 shadow-2xl overflow-hidden order-1 md:order-2">
        <MapContainer 
          center={center} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={center} zoom={zoom} />
          {filteredResources.map((resource: Resource) => {
            const rLat = resource.lat;
            const rLng = resource.lng;
            if (rLat === undefined || rLng === undefined) return null;
            
            return (
             <Marker 
               key={resource.id} 
               position={[rLat, rLng]}
               eventHandlers={{
                 click: () => setSelectedResource(resource)
               }}
             >
               <Popup className="custom-popup" offset={[0, -10]}>
                 <div className="p-2 space-y-3 min-w-[220px]">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${getResourceConfig(resource.type).bg} ${getResourceConfig(resource.type).color}`}>
                          {React.createElement(getResourceConfig(resource.type).icon, { size: 20 })}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">
                              {isBn ? getResourceConfig(resource.type).label_bn : getResourceConfig(resource.type).label_en}
                           </p>
                           <h4 className="font-black text-organic-dark leading-tight uppercase tracking-tighter truncate">
                             {isBn ? (resource.name_bn || resource.name) : (resource.name_en || resource.name)}
                           </h4>
                           {(resource.district || resource.upazila) && (
                             <p className="text-[9px] font-black text-organic-green uppercase tracking-widest mt-1 opacity-80">
                               {resource.district} {resource.upazila && `/ ${resource.upazila}`}
                             </p>
                           )}
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 py-2 border-y border-gray-100">
                       <p className="text-[11px] text-gray-500 font-bold flex items-start gap-2">
                          <MapPin size={12} className="shrink-0 text-gray-400" /> 
                          <span>{isBn ? (resource.address_bn || resource.address) : (resource.address_en || resource.address)}</span>
                       </p>
                       <a href={`tel:${resource.phone}`} className="text-[11px] text-organic-dark font-black flex items-center gap-2 hover:text-organic-green bg-gray-50 p-2 rounded-lg transition-colors">
                          <Phone size={12} className="text-organic-green" /> {resource.phone}
                       </a>
                    </div>

                    {(isBn ? resource.details_bn : resource.details_en) ? (
                        <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic leading-relaxed">
                           {isBn ? resource.details_bn : resource.details_en}
                        </p>
                    ) : resource.details && (
                        <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic leading-relaxed">
                           {resource.details}
                        </p>
                    )}

                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${rLat},${rLng}`)}
                      className="w-full py-3 bg-organic-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                       <Navigation size={14} /> {isBn ? 'দিকনির্দেশনা' : 'Get Directions'}
                    </button>
                 </div>
               </Popup>
             </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Map Controls */}
        <div className="absolute top-6 right-6 z-[1000] space-y-4">
            <div className="flex flex-col gap-2 p-1 bg-white dark:bg-dark-surface rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
               <MapActionButton icon={<Crosshair size={20} />} onClick={() => {
                  if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(pos => {
                       setCenter([pos.coords.latitude, pos.coords.longitude]);
                       setZoom(13);
                    }, (err) => {
                       alert(isBn ? "লোকেশন অ্যাক্সেস পাওয়া যায়নি" : "Location access denied");
                    });
                  }
               }} />
               <MapActionButton icon={<Layers size={20} />} onClick={() => {}} />
               <MapActionButton icon={<Info size={20} />} onClick={() => {}} />
            </div>
            
            <div className="p-4 bg-white/90 dark:bg-dark-surface/90 backdrop-blur rounded-[2rem] shadow-2xl border border-white/20 max-w-[200px] hidden sm:block">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{isBn ? 'ম্যাপ নির্দেশনা' : 'Map Legend'}</p>
               <div className="space-y-3">
                  {Object.entries(TYPE_CONFIG).slice(0, 4).map(([key, cfg]) => (
                     <div key={key} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                           <cfg.icon size={12} />
                        </div>
                        <span className="text-[10px] font-black text-organic-dark dark:text-gray-100 uppercase tracking-tight">{isBn ? cfg.label_bn : cfg.label_en}</span>
                     </div>
                  ))}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 2.5, easeLinearity: 0.25 });
  }, [center, zoom, map]);
  return null;
}

function FilterTab({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 active:scale-95 ${
        active 
          ? 'bg-organic-green text-white border-organic-green shadow-lg shadow-organic-green/20' 
          : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border text-gray-500 hover:border-organic-green/30'
      }`}
    >
      {label}
    </button>
  );
}

function MapActionButton({ icon, onClick }: any) {
  return (
    <button 
       onClick={onClick}
       className="w-12 h-12 flex items-center justify-center text-organic-dark dark:text-white hover:bg-organic-light dark:hover:bg-dark-bg transition-all active:scale-90"
    >
       {icon}
    </button>
  );
}

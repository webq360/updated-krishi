import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, OperationType, handleFirestoreError } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { safeLocalStorage } from '../lib/storage';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Wheat, 
  Bird, 
  Fish, 
  ShoppingBag, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Users,
  Activity,
  Shield,
  Phone,
  MapPin,
  Mail,
  Loader2,
  Database,
  TrendingUp,
  Calendar,
  MessageSquare,
  Landmark,
  GraduationCap,
  FileDown,
  FileSpreadsheet,
  Globe,
  RefreshCw,
  History as HistoryIcon,
  CreditCard,
  Send,
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { BANGLADESH_DISTRICTS } from '../constants/districts';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { UserItem, ListItem, Form } from './AdminSubcomponents';

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(() => safeLocalStorage.getItem('isAdmin') === 'true');
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => safeLocalStorage.getItem('adminEmail') === 'admin@absfeed.com');
  const [isManager, setIsManager] = useState(() => safeLocalStorage.getItem('isManager') === 'true');
  const [activeTab, setActiveTab] = useState<string>('online');
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  
  const [species, setSpecies] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [cropCalendar, setCropCalendar] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [protections, setProtections] = useState<any[]>([]);
  const [protectionUpdates, setProtectionUpdates] = useState<any[]>([]);
  const [ponaOrders, setPonaOrders] = useState<any[]>([]);
  const [trainingApps, setTrainingApps] = useState<any[]>([]);
  const [exportApps, setExportApps] = useState<any[]>([]);
  const [userMarketPrices, setUserMarketPrices] = useState<any[]>([]);
  const [coldStorages, setColdStorages] = useState<any[]>([]);
  const [rentMachines, setRentMachines] = useState<any[]>([]);
  const [cardApplications, setCardApplications] = useState<any[]>([]);
  const [agentApps, setAgentApps] = useState<any[]>([]);
  const [pestWarnings, setPestWarnings] = useState<any[]>([]);
  const [seedBank, setSeedBank] = useState<any[]>([]);
  const [livestockHealth, setLivestockHealth] = useState<any[]>([]);
  const [fishWaterTests, setFishWaterTests] = useState<any[]>([]);
  const [soilTests, setSoilTests] = useState<any[]>([]);
  const [mapResources, setMapResources] = useState<any[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'disbursed'>('all');
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<any>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<any>(null);
  const [protectionStatusFilter, setProtectionStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'claimed'>('all');
  const [selectedProtectionDetails, setSelectedProtectionDetails] = useState<any>(null);
  const [protectionUpdateCropFilter, setProtectionUpdateCropFilter] = useState<string>('all');
  const [selectedProtectionUpdate, setSelectedProtectionUpdate] = useState<any>(null);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const isBn = i18n.language !== 'en';

  const categories = [
    {
      id: 'overview',
      label: isBn ? 'ওভারভিউ (সারসংক্ষেপ)' : 'Overview',
      icon: Activity,
      tabs: ['online', 'problems', 'stories']
    },
    {
      id: 'users',
      label: isBn ? 'ইউজার ম্যানেজমেন্ট' : 'User Management',
      icon: Users,
      tabs: ['users', 'settings']
    },
    {
      id: 'applications',
      label: isBn ? 'আবেদনসমূহ' : 'Applications',
      icon: Landmark,
      tabs: ['loans', 'loan-payments', 'protections', 'protection-updates', 'pona', 'training', 'exports', 'cards', 'agents']
    },
    {
      id: 'services',
      label: isBn ? 'সেবা ব্যবস্থাপনা' : 'Services Management',
      icon: Database,
      tabs: ['cold-storage', 'rent-machines', 'pest-warnings', 'seed-bank', 'soil-test', 'livestock-health', 'fish-water-test', 'map-resources', 'knowledge-base', 'video-tutorials', 'system-push']
    },
    {
      id: 'content',
      label: isBn ? 'কন্টেন্ট এডিট' : 'Content Edit',
      icon: Edit2,
      tabs: ['species', 'diseases', 'products', 'market', 'user-market', 'calendar', 'marketplace', 'forum']
    }
  ];

  const getTabLabel = (tab: string) => {
    switch(tab) {
      case 'species': return isBn ? 'গবাদিপশু ও ফসল গাইড' : 'Species & Crops';
      case 'diseases': return isBn ? 'রোগ ও প্রতিকার' : 'Diseases & Remedies';
      case 'products': return isBn ? 'কোম্পানি প্রোডাক্টস' : 'ABS Products';
      case 'market': return isBn ? 'অ্যাডমিন বাজার দর' : 'Admin Market Prices';
      case 'user-market': return isBn ? 'কৃষকের বাজার দর' : 'User Market Prices';
      case 'calendar': return isBn ? 'ফসল ক্যালেন্ডার' : 'Crop Calendar';
      case 'marketplace': return isBn ? 'কৃষক বাজার (বিজ্ঞাপন)' : 'Marketplace Ads';
      case 'forum': return isBn ? 'কমিউনিটি ফোরাম' : 'Community Forum';
      case 'users': return isBn ? 'ইউজার তালিকা' : 'User Accounts';
      case 'online': return isBn ? 'লাইভ অনলাইন মনিটর' : 'Live Monitor';
      case 'stories': return isBn ? 'সাফল্যের গল্প' : 'Success Stories';
      case 'problems': return isBn ? 'কৃষক সমস্যা লগ' : 'Problem Logs';
      case 'loans': return isBn ? 'বন্ধু ঋণ আবেদন' : 'Loan Applications';
      case 'loan-payments': return isBn ? 'ঋণের কিস্তি জমা' : 'Loan Installments';
      case 'protections': return isBn ? 'সুরক্ষা বীমা আবেদন' : 'Suraksha Protection Apps';
      case 'protection-updates': return isBn ? 'বীমা ক্লেইম আপডেট' : 'Protection Updates';
      case 'pona': return isBn ? 'পোনা ও চারা অর্ডার' : 'Pona & Seedling Orders';
      case 'training': return isBn ? 'কৃষি প্রশিক্ষণ আবেদন' : 'Training Applications';
      case 'exports': return isBn ? 'রপ্তানি আবেদন' : 'Export Applications';
      case 'cards': return isBn ? 'কিষাণ ডিজিটাল কার্ড' : 'Bondhu Digital Cards';
      case 'agents': return isBn ? 'এজেন্ট আবেদন ও অনুমোদন' : 'Agent Applications';
      case 'cold-storage': return isBn ? 'কোল্ড স্টোরেজ' : 'Cold Storage';
      case 'rent-machines': return isBn ? 'ভাড়ায় কৃষি যন্ত্র' : 'Rent Machinery';
      case 'pest-warnings': return isBn ? 'পোকামাকড় সতর্কতা' : 'Pest Warnings';
      case 'seed-bank': return isBn ? 'ঐতিহ্যবাহী বীজ ব্যাংক' : 'Seed Bank';
      case 'soil-test': return isBn ? 'মাটি পরীক্ষা সেবা' : 'Soil Health Tests';
      case 'livestock-health': return isBn ? 'প্রাণী স্বাস্থ্য সেবা' : 'Livestock Health';
      case 'fish-water-test': return isBn ? 'পুকুরের পানি পরীক্ষা' : 'Fish Water Tests';
      case 'map-resources': return isBn ? 'রিসোর্স ম্যাপ ও ডিলার' : 'Resource Map';
      case 'knowledge-base': return isBn ? 'কৃষি তথ্য ভাণ্ডার' : 'Knowledge Base';
      case 'video-tutorials': return isBn ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorials';
      case 'system-push': return isBn ? 'গ্লোবাল পুশ নোটিফিকেশন' : 'Push Notifications';
      case 'settings': return isBn ? 'অ্যাডমিন রোল ও পারমিশন' : 'Role & Admin Settings';
      default: return tab;
    }
  };

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if (val.en || val.bn) return val.bn || val.en;
      if (Array.isArray(val)) return val.join(', ');
      return JSON.stringify(val);
    }
    return String(val);
  };

  const exportToPDF = () => {
    const data = getActiveTabData();
    if (!data || data.length === 0) {
      alert(i18n.language === 'en' ? 'No data available to export.' : 'এক্সপোর্ট করার মতো কোনো তথ্য নেই।');
      return;
    }

    try {
      const doc = new jsPDF() as any;
      const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'imageUrl' && k !== 'createdAt' && k !== 'password');
      const rows = data.map(item => headers.map(h => formatCellValue(item[h])));

      doc.text(`${getTabLabel(activeTab)} Report`, 14, 15);
      doc.autoTable({
        head: [headers.map(h => h.toUpperCase())],
        body: rows,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      doc.save(`${activeTab}_report.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF.");
    }
  };

  const exportToExcel = () => {
    const data = getActiveTabData();
    if (!data || data.length === 0) {
      alert(i18n.language === 'en' ? 'No data available to export.' : 'এক্সপোর্ট করার মতো কোনো তথ্য নেই।');
      return;
    }
    
    try {
      const cleanData = data.map(({ id, imageUrl, createdAt, password, ...rest }) => {
        const row: any = {};
        for (const [k, v] of Object.entries(rest)) {
          row[k] = formatCellValue(v);
        }
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(cleanData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${activeTab}_report.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel.");
    }
  };

  const filterData = (data: any[]) => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => {
      const name = (item.name || item.userName || item.applicantName || item.farmerName || item.title || item.seedName || '').toLowerCase();
      const phone = (item.phone || item.contact || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const id = (item.loanId || item.protectionId || item.id || '').toLowerCase();
      const nid = (item.nidNumber || '').toLowerCase();
      
      return name.includes(q) || phone.includes(q) || email.includes(q) || id.includes(q) || nid.includes(q);
    });
  };

  const getActiveTabData = () => {
    switch(activeTab) {
      case 'species': return species;
      case 'diseases': return diseases;
      case 'products': return products;
      case 'market': return marketPrices;
      case 'user-market': return userMarketPrices;
      case 'calendar': return cropCalendar;
      case 'marketplace': return marketplace;
      case 'forum': return forumPosts;
      case 'users': return users;
      case 'stories': return stories;
      case 'problems': return problems;
      case 'loans': return loans;
      case 'loan-payments': return loanPayments;
      case 'protections': return protections;
      case 'protection-updates': return protectionUpdates;
      case 'pona': return ponaOrders;
      case 'training': return trainingApps;
      case 'exports': return exportApps;
      case 'cards': return cardApplications;
      case 'agents': return agentApps;
      case 'cold-storage': return coldStorages;
      case 'rent-machines': return rentMachines;
      case 'pest-warnings': return pestWarnings;
      case 'seed-bank': return seedBank;
      case 'livestock-health': return livestockHealth;
      case 'fish-water-test': return fishWaterTests;
      case 'soil-test': return soilTests;
      case 'map-resources': return mapResources;
      case 'knowledge-base': return knowledgeBase;
      case 'video-tutorials': return videos;
      case 'system-push': return notifications;
      default: return [];
    }
  };

  const seedData = async () => {
    setIsSeeding(true);
    const initialSpecies = [
      // Livestock (গবাদি পশু)
      { 
        name: i18n.language === 'en' ? 'Holstein Friesian Cow' : 'হলস্টাইন ফ্রিজিয়ান গরু', 
        category: 'livestock', 
        subCategory: 'Cattle (গরু)',
        description: i18n.language === 'en' ? 'Renowned dairy cattle breed originating from Friesland.' : 'উচ্চ দুগ্ধ উৎপাদনকারী গাভীর উন্নত জাত।', 
        farmingMethod: i18n.language === 'en' 
          ? '1. Select healthy calves.\n2. Provide well-ventilated housing.\n3. Balanced nutrition (70% roughage, 30% concentrate).'
          : '১. সুস্থ বাছুর নির্বাচন।\n২. আলো-বাতাসপূর্ণ বাসস্থান।\n৩. সুষম খাদ্য ব্যবস্থাপনা (৭০% ঘাস, ৩০% দানাদার)।', 
        stockingDensity: '50-60 sq.ft per cow', 
        biosecurity: 'Regular FMD vaccination every 6 months.', 
        imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=800' 
      },
      { 
        name: i18n.language === 'en' ? 'Black Bengal Goat' : 'ব্লাক বেঙ্গল ছাগল', 
        category: 'livestock', 
        subCategory: 'Goat (ছাগল)',
        description: i18n.language === 'en' ? 'Native breed of Bangladesh, known for high quality meat.' : 'মাংস ও চামড়ার জন্য বিশ্বসেরা স্থানীয় জাত।', 
        farmingMethod: i18n.language === 'en'
          ? '1. Intensive or semi-intensive rearing.\n2. Vaccination against PPR is mandatory.'
          : '১. নিবিড় বা আধা-নিবিড় পালন।\n২. পিপিআর টিকাদান বাধ্যতামূলক।', 
        stockingDensity: '12-15 sq.ft per goat', 
        biosecurity: 'Keep shed floor dry and clean.', 
        imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=800' 
      },
      // Poultry (পোল্ট্রি)
      { 
        name: i18n.language === 'en' ? 'Cobb 500 Broiler' : 'কব ৫০০ ব্রয়লার', 
        category: 'poultry', 
        subCategory: 'Broiler (ব্রয়লার)',
        description: i18n.language === 'en' ? 'Fast-growing meat bird for commercial production.' : 'বাণিজ্যিক মাংস উৎপাদনের জন্য দ্রুত বর্ধনশীল জাত।', 
        farmingMethod: 'All-in all-out system. High protein diet. 30-35 day cycle.', 
        stockingDensity: '1.2 sq.ft per bird', 
        biosecurity: 'Strict entry restriction. Footbath mandatory.', 
        imageUrl: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&q=80&w=800' 
      },
      { 
        name: i18n.language === 'en' ? 'Peking Duck' : 'পিকিং হাঁস', 
        category: 'poultry', 
        subCategory: 'Duck (হাঁস)',
        description: i18n.language === 'en' ? 'Rapidly growing meat-type duck.' : 'দ্রুত বর্ধনশীল মাংস উৎপাদনকারী হাঁস।', 
        farmingMethod: 'Open pond or backyard system. High humidity environment.', 
        stockingDensity: '4-5 sq.ft per duck', 
        biosecurity: 'Duck plague vaccination.', 
        imageUrl: 'https://images.unsplash.com/photo-1555854816-6aa07bc54f24?auto=format&fit=crop&q=80&w=800' 
      },
      // Fisheries (মৎস্য)
      { 
        name: i18n.language === 'en' ? 'Rohu (Rui)' : 'রুই মাছ', 
        category: 'fisheries', 
        subCategory: 'Carp (কার্প)',
        description: i18n.language === 'en' ? 'Standard freshwater fish for polyculture.' : 'মিশ্র চাষের জন্য আদর্শ মিষ্টি পানির মাছ।', 
        farmingMethod: 'Polyculture with Catla and Mrigal. Supplement feed 3% of body weight.', 
        stockingDensity: '30-40 fish per decimal', 
        biosecurity: 'Pond liming (1kg/decimal) and netting.', 
        imageUrl: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=800' 
      },
      { 
        name: i18n.language === 'en' ? 'Monosex Tilapia' : 'মনোসেক্স তেলাপিয়া', 
        category: 'fisheries', 
        subCategory: 'Tilapia (তেলাপিয়া)',
        description: i18n.language === 'en' ? 'Fast growing and disease resistant.' : 'দ্রুত বর্ধনশীল ও রোগ প্রতিরোধ ক্ষমতা সম্পন্ন।', 
        farmingMethod: 'Intensive rearing. Floating pellets (30% protein). Aeration needed.', 
        stockingDensity: '150-200 fish per decimal', 
        biosecurity: 'Regular water quality check (pH, DO).', 
        imageUrl: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&q=80&w=800' 
      },
      // Vegetables / Crops (শাকসবজি)
      { 
        name: i18n.language === 'en' ? 'BRRI Dhan 28' : 'ব্রি ধান ২৮', 
        category: 'vegetables', 
        subCategory: 'Rice (ধান)',
        description: i18n.language === 'en' ? 'High-yielding Boro rice variety.' : 'উচ্চফলনশীল বোরো ধানের জাত।', 
        farmingMethod: 'Wait for soil saturation. Use AWD (Alternate Wetting and Drying) method.', 
        stockingDensity: '25cm line to line spacing', 
        biosecurity: 'Manage Leaf Roller and Stem Borer.', 
        imageUrl: 'https://images.unsplash.com/photo-1536633396567-6dc4a5b67a6e?auto=format&fit=crop&q=80&w=800' 
      },
      { 
        name: i18n.language === 'en' ? 'Red Spinach' : 'লাল শাক', 
        category: 'vegetables', 
        subCategory: 'Red Spinach (লাল শাক)',
        description: i18n.language === 'en' ? 'Iron-rich fast growing vegetable.' : 'আয়রণ সমৃদ্ধ দ্রুত বর্ধনশীল শাক।', 
        farmingMethod: 'Sow in well-drained soil. Harvesting starts from 25 days.', 
        stockingDensity: 'Broadcast sowing (100g seeds/decimal)', 
        biosecurity: 'Protect from caterpillars.', 
        imageUrl: 'https://images.unsplash.com/photo-1594282486512-409ba1990494?auto=format&fit=crop&q=80&w=800' 
      }
    ];

    const initialDiseases = [
      { 
        title: 'FMD (খুরারোগ)', 
        speciesId: 'Cow', 
        description: 'Highly contagious viral disease.', 
        symptoms: 'Fever, blisters in mouth and on feet, excessive salivation.', 
        treatment: 'No specific medicine. Wash sores with potassium solution. Antibiotics for secondary infection.' 
      },
      { 
        title: 'Ranikhet (রানীক্ষেত)', 
        speciesId: 'Poultry', 
        description: 'Fatal poultry disease.', 
        symptoms: 'Greenish diarrhea, twisted neck, respiratory distress.', 
        treatment: 'Prevention through BCRDV and RDV vaccination is key.' 
      }
    ];

    const initialProducts = [
      { name: 'ABS FEED Premium Cattle Feed', category: 'Livestock', description: 'Complete nutrition for dairy cows.', benefits: 'Increases milk fat and volume. Improved digestion.', imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=800', orderLink: '#' },
      { name: 'ABS FEED Aqua Pro Floating', category: 'Fisheries', description: 'High protein fish feed.', benefits: 'Faster growth, cleaner water, better FCR.', imageUrl: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&q=80&w=800', orderLink: '#' }
    ];

    const initialMarketPrices = [
      { name: 'Miniket Rice', price: '68-72', marketPrice: '70', unit: 'kg', change: 'up', trend: '+1.5%', district: 'Dhaka', category: 'Crops' },
      { name: 'Broiler Chicken', price: '190-210', marketPrice: '195', unit: 'kg', change: 'down', trend: '-2.1%', district: 'Narsingdi', category: 'Poultry' },
      { name: 'Rui Fish (1kg+)', price: '320-380', marketPrice: '350', unit: 'kg', change: 'stable', trend: '0%', district: 'Mymensingh', category: 'Fish' }
    ];

    const initialCropCalendar = [
      { 
        name: i18n.language === 'en' ? 'Boro Rice' : 'বোরো ধান',
        season: i18n.language === 'en' ? 'November - May' : 'নভেম্বর - মে', 
        stage: i18n.language === 'en' ? 'Grain Filling' : 'দানাদার অবস্থা', 
        tasks: [
          i18n.language === 'en' ? 'Maintain 2-3cm water level' : '২-৩ সেমি পানি ধরে রাখুন',
          i18n.language === 'en' ? 'Apply urea at panicle initiation' : 'থোড় আসার সময় ইউরিয়া প্রয়োগ করুন',
          i18n.language === 'en' ? 'Manage stem borer if needed' : 'মাজরা পোকা দমন করুন'
        ],
        color: 'bg-emerald-500',
        guide: {
          en: "Boro rice requires constant irrigation. Keep the soil saturated but not over-flooded.",
          bn: "বোরো ধানের জন্য নিয়মিত সেচ প্রয়োজন। জমি সবসময় ভেজা রাখুন কিন্তু জলাবদ্ধ করবেন না।"
        }
      },
      { 
        name: i18n.language === 'en' ? 'Potato' : 'আলু', 
        season: i18n.language === 'en' ? 'November - February' : 'নভেম্বর - ফেব্রুয়ারি', 
        stage: i18n.language === 'en' ? 'Tuber Formation' : 'টিউবার গঠন', 
        tasks: [
          i18n.language === 'en' ? 'Earthing up twice' : 'দুইবার মাটি আলগা করে উচিয়ে দিন',
          i18n.language === 'en' ? 'Check for Late Blight' : 'নাবি ধসা রোগের জন্য পর্যবেক্ষণ করুন',
          i18n.language === 'en' ? 'Potassium application' : 'পটাশ সার প্রয়োগ'
        ],
        color: 'bg-[#8D6E63]',
        guide: {
          en: "Potato is high value cash crop. Late blight is the biggest threat in foggy weather.",
          bn: "আলু একটি মূল্যবান অর্থকরী ফসল। কুয়াশাচ্ছন্ন আবহাওয়ায় নাবি ধসা রোগের ঝুঁকি থাকে।"
        }
      },
      { 
        name: i18n.language === 'en' ? 'Jute' : 'পাট', 
        season: i18n.language === 'en' ? 'March - August' : 'মার্চ - আগস্ট', 
        stage: i18n.language === 'en' ? 'Fiber Activation' : 'আঁশ গঠন', 
        tasks: [
          i18n.language === 'en' ? 'Thinning the rows' : 'সারি পাতলা করা',
          i18n.language === 'en' ? 'Top dressing of Urea' : 'ইউরিয়া উপরি প্রয়োগ',
          i18n.language === 'en' ? 'Monitor for Hairy Caterpillar' : 'বিছা পোকা দমন'
        ],
        color: 'bg-green-600',
        guide: {
          en: "Jute fiber quality depends on retting process. Ensure clear water for retting.",
          bn: "পাটের আঁশের মান জাগ দেয়ার ওপর নির্ভর করে। পরিষ্কার পানিতে জাগ দিন।"
        }
      },
      { 
        name: i18n.language === 'en' ? 'Mango' : 'আম', 
        season: i18n.language === 'en' ? 'January - July' : 'জানুয়ারি - জুলাই', 
        stage: i18n.language === 'en' ? 'Fruit Maturing' : 'ফল পরিপক্বতা', 
        tasks: [
          i18n.language === 'en' ? 'Fruit bagging' : 'ফ্রুট ব্যাগিং',
          i18n.language === 'en' ? 'Manage Hopper infestation' : 'হপার পোকা দমন',
          i18n.language === 'en' ? 'Irrigation in dry spell' : 'শুকনো সময় সেচ প্রদান'
        ],
        color: 'bg-orange-500',
        guide: {
          en: "Protect mangoes from heat wave. Use bagging to avoid chemical use in fruits.",
          bn: "আমকে অতিরিক্ত তাপ থেকে রক্ষা করুন। বিষমুক্ত ফল পেতে ব্যাগিং পদ্ধতি ব্যবহার করুন।"
        }
      }
    ];

    const initialColdStorages = [
      { name: 'Munshiganj Central Cold Storage', district: 'Munshiganj', location: 'Mukterpur', phone: '01711000111', capacity: '5000 Tons', availableSpace: '1200 Tons', createdAt: serverTimestamp() },
      { name: 'Rajshahi Aman Cold Storage', district: 'Rajshahi', location: 'Paba', phone: '01711000222', capacity: '3000 Tons', availableSpace: '500 Tons', createdAt: serverTimestamp() },
      { name: 'Bogra Himagar Ltd', district: 'Bogra', location: 'Sherpur', phone: '01711000333', capacity: '4500 Tons', availableSpace: '2000 Tons', createdAt: serverTimestamp() },
      { name: 'Comilla Farmers Cold Storage', district: 'Comilla', location: 'Chandina', phone: '01711000444', capacity: '4000 Tons', availableSpace: '800 Tons', createdAt: serverTimestamp() },
      { name: 'Rangpur Potato Storage', district: 'Rangpur', location: 'Mithapukur', phone: '01711000555', capacity: '6000 Tons', availableSpace: '1500 Tons', createdAt: serverTimestamp() },
      { name: 'Dinajpur Agro Storage', district: 'Dinajpur', location: 'Sadar', phone: '01711000666', capacity: '3500 Tons', availableSpace: '1000 Tons', createdAt: serverTimestamp() },
      { name: 'Pabna Onion Storage', district: 'Pabna', location: 'Ishwardi', phone: '01711000777', capacity: '2500 Tons', availableSpace: '300 Tons', createdAt: serverTimestamp() },
      { name: 'Jessore Vegetable Cold Storage', district: 'Jessore', location: 'Monirampur', phone: '01711000888', capacity: '4000 Tons', availableSpace: '1200 Tons', createdAt: serverTimestamp() },
      { name: 'Natore Seed Storage', district: 'Natore', location: 'Sadar', phone: '01711000999', capacity: '2000 Tons', availableSpace: '600 Tons', createdAt: serverTimestamp() },
      { name: 'Mymensingh Fish Storage', district: 'Mymensingh', location: 'Trishal', phone: '01711000000', capacity: '3000 Tons', availableSpace: '400 Tons', createdAt: serverTimestamp() }
    ];

    const initialPestWarnings = [
      { title: 'Late Blight of Potato (আলুর মড়ক)', area: 'North Bengal', severity: 'high', description: 'Potato late blight is spreading due to foggy weather. Avoid excessive Urea fertilizer as it increases susceptibility. Use Mancozeb based fungicides.', createdAt: serverTimestamp() },
      { title: 'Rice Blast Warning (ধানের ব্লাস্ট)', area: 'Mymensingh', severity: 'medium', description: 'Rice blast detected in some fields. Maintain proper water level and avoid high nitrogen fertilizer application at this stage.', createdAt: serverTimestamp() },
      { title: 'Fertilizer Management (সার ব্যবস্থাপনা)', area: 'All over Bangladesh', severity: 'low', description: 'Using excessive Urea and DAP without organic fertilizer reduces soil health. Always use balanced doses of N-P-K.', createdAt: serverTimestamp() },
      { title: 'Fall Armyworm Alert (ভুট্টার পোকা)', area: 'Chuadanga, Jhenaidah', severity: 'high', description: 'Fall Armyworm infestation reported in maize fields. Monitor fields daily and use recommended bio-pesticides.', createdAt: serverTimestamp() },
      { title: 'Mango Hopper Warning (আমের হপার পোকা)', area: 'Rajshahi, Chapainawabganj', severity: 'medium', description: 'Mango hopper attack possible during flowering. Spray recommended insecticides before full bloom.', createdAt: serverTimestamp() },
      { title: 'Boro Rice Stem Borer (মাজরা পোকা)', area: 'Sylhet Division', severity: 'medium', description: 'Stem borer infestation seen in Boro rice. Use light traps and perching method for natural control.', createdAt: serverTimestamp() }
    ];

    const initialStories = [
      {
        userName: 'আরিফ হোসেন',
        content: 'আলহামদুলিল্লাহ, এবছর এবিএস ফীড (ABS FEED) ব্যবহার করে আমার খামারের গরুর স্বাস্থ্য অনেক ভালো হয়েছে। দুধের উৎপাদনও বেড়েছে প্রায় ২০%।',
        likesCount: 5,
        commentsCount: 2,
        createdAt: serverTimestamp(),
        imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=800'
      }
    ];

    const initialKnowledgeBase = [
      {
        order: 1,
        title_en: 'Modern Rice Cultivation Techniques',
        title_bn: 'আধুনিক ধান চাষ পদ্ধতি',
        category: 'Agriculture',
        content_en: 'To get higher yield, use AWD method for irrigation. Ensure balanced use of Nitrogen, Phosphate and Potassium fertilizers. Use parching method for natural pest control.',
        content_bn: 'অধিক ফলনের জন্য এ ডব্লিউ ডি পদ্ধতিতে সেচ দিন। নাইট্রোজেন, ফসফেট ও পটাশ সারের সুষম ব্যবহার নিশ্চিত করুন। প্রাকৃতিক পোকা দমনের জন্য পার্চিং পদ্ধতি ব্যবহার করুন।',
        imageUrl: 'https://picsum.photos/seed/rice/800/600'
      },
      {
        order: 2,
        title_en: 'High Yielding Poultry Management',
        title_bn: 'উচ্চফলনশীল পোল্ট্রি ব্যবস্থাপনা',
        category: 'Poultry',
        content_en: 'Maintain strict biosecurity to prevent diseases. Early vaccination is mandatory for Ranikhet and Gumboro diseases. Provide clean drinking water at all times.',
        content_bn: 'রোগ প্রতিরোধে কঠোর বায়োসিকিউরিটি বজায় রাখুন। রানীক্ষেত এবং গামবোরো রোগের জন্য আগাম টিকাদান বাধ্যতামূলক। সবসময় পরিষ্কার পানীয় জল নিশ্চিত করুন।',
        imageUrl: 'https://picsum.photos/seed/poultry/800/600'
      },
      {
        order: 3,
        title_en: 'Carp Polyculture Guide',
        title_bn: 'কার্প মিশ্র চাষ নির্দেশিকা',
        category: 'Fisheries',
        content_en: 'Mixing Rui, Catla and Mrigal increases pond productivity. Maintain water pH between 7.5 to 8.5 for optimal growth.',
        content_bn: 'রুই, কাতলা ও মৃগেল মাছের মিশ্র চাষ পুকুরের উৎপাদনশীলতা বৃদ্ধি করে। ভালো বৃদ্ধির জন্য পানির পিএইচ ৭.৫ থেকে ৮.৫ এর মধ্যে রাখুন।',
        imageUrl: 'https://picsum.photos/seed/fish/800/600'
      },
      {
        order: 4,
        title_en: 'Livestock Fattening Guide',
        title_bn: 'গবাদি পশু মোটাতাজাকরণ নির্দেশিকা',
        category: 'Livestock',
        content_en: 'Balanced diet and regular health checkups are key to successful livestock farming. Use urea molasses straw for better results.',
        content_bn: 'সফল গবাদি পশু পালনের জন্য সুষম খাদ্য এবং নিয়মিত স্বাস্থ্য পরীক্ষা জরুরি। ভালো ফলাফলের জন্য ইউরিয়া গুড় খড় ব্যবহার করুন।',
        imageUrl: 'https://picsum.photos/seed/cow/800/600'
      },
      {
        order: 5,
        title_en: 'Pest Management in Vegetables',
        title_bn: 'শাকসবজিতে বালাই ব্যবস্থাপনা',
        category: 'Pest Control',
        content_en: 'Identify common pests early. Use organic pesticides and pheromone traps to minimize crop damage.',
        content_bn: 'সাধারণ বালাইগুলো আগে থেকেই শনাক্ত করুন। ফসলের ক্ষতি কমাতে জৈব বালাইনাশক এবং ফেরোমোন ট্র্যাপ ব্যবহার করুন।',
        imageUrl: 'https://picsum.photos/seed/pest/800/600'
      },
      {
        order: 6,
        title_en: 'Organic Fertilizer Preparation',
        title_bn: 'জৈব সার প্রস্তুতকরণ',
        category: 'Agriculture',
        content_en: 'Composting is an excellent way to turn farm waste into nutrient-rich soil. Use cow dung, straw, and kitchen waste.',
        content_bn: 'খামারের বর্জ্যকে পুষ্টিসমৃদ্ধ মাটিতে পরিণত করার জন্য কম্পোস্টিং একটি চমৎকার উপায়। গোবর, খড় এবং রান্নাঘরের বর্জ্য ব্যবহার করুন।',
        imageUrl: 'https://picsum.photos/seed/compost/800/600'
      },
      {
        order: 7,
        title_en: 'Winter Vegetable Care',
        title_bn: 'শীতকালীন সবজির যত্ন',
        category: 'Agriculture',
        content_en: 'Mulching helps retain soil moisture during winter. Early morning irrigation is best for winter crops.',
        content_bn: 'শীতকালে মালচিং মাটির আর্দ্রতা বজায় রাখতে সাহায্য করে। শীতকালীন ফসলের জন্য ভোরে সেচ দেওয়া সবচেয়ে ভালো।',
        imageUrl: 'https://picsum.photos/seed/winter/800/600'
      }
    ];

    const initialMarketplace = [
      { name: 'Fresh Organic Tomatoes', price: '40', unit: 'kg', category: 'Vegetables', contact: '01700000000', district: 'Rajshahi', description: 'Grown without pesticides.' },
      { name: 'Native Variety Rice Seed', price: '120', unit: 'kg', category: 'Crops', contact: '01711111111', district: 'Bogura', description: 'High germination rate.' }
    ];

    const initialForumPosts = [
      { title: 'Best fertilizer for Boro rice?', category: 'Crops', content: 'What is the recommended NPK ratio for BRRI 28?', authorName: 'Arif' },
      { title: 'Looking for a seed drill machine', category: 'General', content: 'Where can I rent a seed drill in Jessore?', authorName: 'Kashem' }
    ];

    const initialSeedBank = [
      { seedName_en: 'Kalijira Rice', seedName_bn: 'কালিজিরা চাল', variety_en: 'Native', variety_bn: 'দেশি', district_en: 'Dinajpur', district_bn: 'দিনাজপুর', contact: '01722222222', type: 'offer' }
    ];

    const initialLoans = [
      { applicantName: 'Mominul Islam', phone: '01733333333', amount: '50000', purpose: 'Dairy expansion', status: 'pending' }
    ];

    const initialProtections = [
      { name: 'Salim Ahmed', phone: '01744444444', cropType: 'Rice', totalValue: '100000', status: 'pending' }
    ];

    const initialAgentApps = [
      { name: 'Jamal Uddin', phone: '01755555555', shopName: 'Jamal Krishi Bhandar', address: 'Gazipur', status: 'pending' }
    ];

    const initialLivestockHealth = [
      { ownerName: 'Abul Mansur', phone: '01712345678', animalType: 'Cattle', symptoms: 'Fever and low appetite', status: 'pending' }
    ];

    const initialFishWaterTests = [
      { ownerName: 'Kabir Hasan', phone: '01787654321', parameters: ['ph', 'ammonia', 'oxygen'], status: 'pending' }
    ];

    const initialVideos = [
      {
        title: 'Modern Rice Cultivation Techniques in Bangladesh',
        titleBn: 'বাংলাদেশে আধুনিক ধান চাষ পদ্ধতি ও কৌশল',
        thumbnail: 'https://images.unsplash.com/photo-1536633396567-6dc4a5b67a6e?auto=format&fit=crop&q=80&w=800',
        duration: '12:45',
        views: '25K',
        category: 'Crops',
        categoryBn: 'ফসল',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        channel: 'Krishi Bondhu Official',
        publishedAt: '2 days ago',
        publishedAtBn: '২ দিন আগে'
      },
      {
        title: 'High Yield Poultry Farming Full Guide 2024',
        titleBn: 'উন্নত জাতের মুরগি পালন ও খামার পরিচালনা নির্দেশিকা',
        thumbnail: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800',
        duration: '15:20',
        views: '18K',
        category: 'Poultry',
        categoryBn: 'হাঁস-মুরগি',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        channel: 'ABS Feed Industries',
        publishedAt: '1 week ago',
        publishedAtBn: '১ সপ্তাহ আগে'
      }
    ];

    if (!auth.currentUser) {
      alert("Please wait for authentication to initialize.");
      setIsSeeding(false);
      return;
    }

    const uid = auth.currentUser.uid;

    try {
      // Add Marketplace
      for (const p of initialMarketplace) {
        await addDoc(collection(db, 'marketplace'), {
          ...p,
          sellerId: uid,
          sellerName: 'Farmer Admin',
          createdAt: serverTimestamp()
        });
      }

      // Add Forum Posts
      for (const post of initialForumPosts) {
        await addDoc(collection(db, 'forumPosts'), {
          ...post,
          authorId: uid,
          createdAt: serverTimestamp()
        });
      }

      // Add Stories
      for (const story of initialStories) {
        await addDoc(collection(db, 'stories'), {
          ...story,
          userId: uid
        });
      }

      // Add Livestock Health Requests
      for (const req of initialLivestockHealth) {
        await addDoc(collection(db, 'livestockHealthRequests'), {
          ...req,
          userId: uid,
          createdAt: serverTimestamp()
        });
      }

      // Add Fish Water Test Requests
      for (const req of initialFishWaterTests) {
        await addDoc(collection(db, 'fishWaterTestRequests'), {
          ...req,
          userId: uid,
          createdAt: serverTimestamp()
        });
      }

      // Add Species and store their IDs
      const speciesIds: Record<string, string> = {};
      for (const s of initialSpecies) {
        const docRef = await addDoc(collection(db, 'species'), s);
        // Map the name (or part of it) to the ID
        const key = s.name.split(' ')[0]; // e.g., 'Cow'
        speciesIds[key] = docRef.id;
      }
      
      // Add Diseases with correct speciesId
      for (const d of initialDiseases) {
        const linkedId = speciesIds[d.speciesId];
        if (linkedId) {
          await addDoc(collection(db, 'diseases'), { ...d, speciesId: linkedId });
        }
      }

      // Add Products
      for (const p of initialProducts) {
        await addDoc(collection(db, 'products'), p);
      }

      // Add Market Prices
      for (const m of initialMarketPrices) {
        await addDoc(collection(db, 'marketPrices'), m);
      }

      // Add Crop Calendar
      for (const c of initialCropCalendar) {
        await addDoc(collection(db, 'cropCalendar'), c);
      }

      // Add Cold Storages
      for (const cs of initialColdStorages) {
        await addDoc(collection(db, 'coldStorage'), cs);
      }

      // Add Pest Warnings
      for (const pw of initialPestWarnings) {
        await addDoc(collection(db, 'pestWarnings'), pw);
      }

      // Add Seed Bank
      for (const s of initialSeedBank) {
        await addDoc(collection(db, 'seedBank'), {
          ...s,
          userId: uid,
          userName: 'Farmer Admin',
          createdAt: serverTimestamp()
        });
      }

      // Add Loan Apps
      for (const l of initialLoans) {
        await addDoc(collection(db, 'loanApplications'), { ...l, userId: uid, createdAt: serverTimestamp() });
      }

      // Add Protection Apps
      for (const p of initialProtections) {
        await addDoc(collection(db, 'protectionApplications'), { ...p, userId: uid, createdAt: serverTimestamp() });
      }

      // Add Agent Apps
      for (const a of initialAgentApps) {
        await addDoc(collection(db, 'agentApplications'), { ...a, userId: uid, createdAt: serverTimestamp() });
      }

      // Add Knowledge Base
      for (const article of initialKnowledgeBase) {
        await addDoc(collection(db, 'knowledgeBase'), {
          ...article,
          active: true,
          createdAt: serverTimestamp()
        });
      }

      // Add Videos
      for (const video of initialVideos) {
        await addDoc(collection(db, 'videos'), {
          ...video,
          createdAt: serverTimestamp()
        });
      }
      
      alert("Comprehensive farming database seeded successfully!");
    } catch (err) {
      console.error("Seed error", err);
      alert("Error seeding data. Check console.");
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    let storageAdmin = safeLocalStorage.getItem('isAdmin') === 'true';
    let storageManager = safeLocalStorage.getItem('isManager') === 'true';
    
    if (storageAdmin || storageManager) {
      setIsAdmin(storageAdmin);
      setIsManager(storageManager);
      if (storageManager && !storageAdmin) {
        setActiveTab('users');
      }
    } else if (!isAdmin && !isManager) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin && !isManager) return;

    const unsubSpecies = onSnapshot(collection(db, 'species'), (s) => setSpecies(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'species'));
    const unsubDiseases = onSnapshot(collection(db, 'diseases'), (s) => setDiseases(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'diseases'));
    const unsubProducts = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
    const unsubMarket = onSnapshot(collection(db, 'marketPrices'), (s) => setMarketPrices(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'marketPrices'));
    const unsubCalendar = onSnapshot(collection(db, 'cropCalendar'), (s) => setCropCalendar(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'cropCalendar'));

    // 1. Listen to users collection
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => {
      const firestoreUsers = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(prev => {
        const map = new Map();
        (firestoreUsers || []).forEach(u => map.set(u.id, u));
        (prev || []).forEach(u => { if (!map.has(u.id)) map.set(u.id, u); });
        return Array.from(map.values());
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // 2. Fetch all registered users from MongoDB
    const fetchMongoUsers = async () => {
      try {
        const token = safeLocalStorage.getItem('authToken');
        const res = await fetch('/api/admin/users', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          const mongoUsers = await res.json();
          if (Array.isArray(mongoUsers) && mongoUsers.length > 0) {
            setUsers(prev => {
              const map = new Map();
              (prev || []).forEach(u => map.set(u.id || u._id, u));
              mongoUsers.forEach((u: any) => map.set(u._id || u.id, { id: u._id || u.id, ...u }));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.warn('Fetch MongoDB users error:', err);
      }
    };
    fetchMongoUsers();
    const userSyncInterval = setInterval(fetchMongoUsers, 20000);

    // 3. Online Users Tracker & Listener
    const syncOnline = async () => {
      try {
        const res = await fetch('/api/data/onlineUsers?limit=100');
        if (res.ok) {
          const list = await res.json();
          const now = Date.now();
          const active = (list || []).filter((u: any) => {
            const time = typeof u.lastSeen === 'number' ? u.lastSeen : (u.lastSeen?.toMillis ? u.lastSeen.toMillis() : new Date(u.lastSeen || u.updatedAt || 0).getTime());
            return time > (now - 300000); // within 5 minutes
          });
          setOnlineUsers(active);
        }
      } catch {}
    };
    syncOnline();
    const onlineInterval = setInterval(syncOnline, 10000);

    const unsubOnline = onSnapshot(collection(db, 'onlineUsers'), (s) => {
      const now = Date.now();
      const online = s.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => {
          const time = typeof u.lastSeen === 'number' ? u.lastSeen : (u.lastSeen?.toMillis ? u.lastSeen.toMillis() : new Date(u.lastSeen || u.updatedAt || 0).getTime());
          return time > (now - 300000);
        });
      if (online.length > 0) {
        setOnlineUsers(online);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'onlineUsers'));

    // 4. Admin Heartbeat
    let adminClientId = safeLocalStorage.getItem('presence_client_id') || 'admin_' + Math.random().toString(36).substring(2, 9);
    safeLocalStorage.setItem('presence_client_id', adminClientId);
    const sendAdminHeartbeat = async () => {
      try {
        await fetch(`/api/data/onlineUsers/${adminClientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: adminClientId,
            name: isBn ? 'সিস্টেম অ্যাডমিন (প্যানেল)' : 'System Admin (Panel)',
            role: 'admin',
            lastSeen: Date.now(),
            lastSeenDate: new Date().toISOString(),
          }),
        });
      } catch {}
    };
    sendAdminHeartbeat();
    const adminHeartbeatInterval = setInterval(sendAdminHeartbeat, 30000);

    const unsubStories = onSnapshot(collection(db, 'stories'), (s) => setStories(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'stories'));
    const unsubProblems = onSnapshot(collection(db, 'problemLogs'), (s) => setProblems(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'problemLogs'));
    const unsubMarketplace = onSnapshot(collection(db, 'marketplace'), (s) => setMarketplace(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'marketplace'));
    const unsubForum = onSnapshot(collection(db, 'forumPosts'), (s) => setForumPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'forumPosts'));
    const unsubLoans = onSnapshot(collection(db, 'loanApplications'), (s) => setLoans(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'loanApplications'));
    const unsubLoanPayments = onSnapshot(collection(db, 'loanPayments'), (s) => setLoanPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'loanPayments'));
    const unsubProtections = onSnapshot(collection(db, 'protectionApplications'), (s) => setProtections(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'protectionApplications'));
    const unsubProtectionUpdates = onSnapshot(collection(db, 'protectionUpdates'), (s) => setProtectionUpdates(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'protectionUpdates'));
    const unsubPona = onSnapshot(collection(db, 'ponaOrders'), (s) => setPonaOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'ponaOrders'));
    const unsubTraining = onSnapshot(collection(db, 'trainingApplications'), (s) => setTrainingApps(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'trainingApplications'));
    const unsubExports = onSnapshot(collection(db, 'exportApplications'), (s) => setExportApps(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'exportApplications'));
    const unsubUserMarket = onSnapshot(collection(db, 'userMarketPrices'), (s) => setUserMarketPrices(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'userMarketPrices'));
    const unsubColdStorage = onSnapshot(collection(db, 'coldStorage'), (s) => setColdStorages(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'coldStorage'));
    const unsubRentMachines = onSnapshot(collection(db, 'rentMachines'), (s) => setRentMachines(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'rentMachines'));
    const unsubCardApps = onSnapshot(collection(db, 'cardApplications'), (s) => setCardApplications(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'cardApplications'));
    const unsubPestWarnings = onSnapshot(collection(db, 'pestWarnings'), (s) => setPestWarnings(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'pestWarnings'));
    const unsubSeedBank = onSnapshot(collection(db, 'seedBank'), (s) => setSeedBank(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'seedBank'));
    const unsubLivestockHealth = onSnapshot(collection(db, 'livestockHealthRequests'), (s) => setLivestockHealth(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'livestockHealthRequests'));
    const unsubFishWaterTest = onSnapshot(collection(db, 'fishWaterTestRequests'), (s) => setFishWaterTests(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'fishWaterTestRequests'));
    const unsubSoilTests = onSnapshot(collection(db, 'soilTestRequests'), (s) => setSoilTests(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'soilTestRequests'));
    const unsubMap = onSnapshot(collection(db, 'mapResources'), (s) => setMapResources(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'mapResources'));
    const unsubKnowledge = onSnapshot(collection(db, 'knowledgeBase'), (s) => setKnowledgeBase(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'knowledgeBase'));
    const unsubVideos = onSnapshot(collection(db, 'videos'), (s) => setVideos(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'videos'));
    const unsubAgentApps = onSnapshot(collection(db, 'agentApplications'), (s) => setAgentApps(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'agentApplications'));
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (s) => setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    return () => {
      unsubSpecies();
      unsubDiseases();
      unsubProducts();
      unsubMarket();
      unsubCalendar();
      unsubUsers();
      unsubOnline();
      unsubStories();
      unsubProblems();
      unsubMarketplace();
      unsubForum();
      unsubLoans();
      unsubLoanPayments();
      unsubProtections();
      unsubProtectionUpdates();
      unsubPona();
      unsubTraining();
      unsubExports();
      unsubUserMarket();
      unsubColdStorage();
      unsubRentMachines();
      unsubCardApps();
      unsubPestWarnings();
      unsubSeedBank();
      unsubLivestockHealth();
      unsubFishWaterTest();
      unsubSoilTests();
      unsubMap();
      unsubKnowledge();
      unsubVideos();
      unsubAgentApps();
      unsubNotifs();
      clearInterval(userSyncInterval);
      clearInterval(onlineInterval);
      clearInterval(adminHeartbeatInterval);
    };
  }, [isAdmin, isManager, isBn]);

  const handleSave = async (data: any) => {
    try {
      const collectionName = activeTab === 'market' ? 'marketPrices' : 
                            activeTab === 'user-market' ? 'userMarketPrices' :
                            activeTab === 'calendar' ? 'cropCalendar' : 
                            activeTab === 'problems' ? 'problemLogs' : 
                            activeTab === 'forum' ? 'forumPosts' : 
                            activeTab === 'loans' ? 'loanApplications' :
                            activeTab === 'protections' ? 'protectionApplications' :
                            activeTab === 'pona' ? 'ponaOrders' :
                            activeTab === 'exports' ? 'exportApplications' :
                            activeTab === 'training' ? 'trainingApplications' : 
                            activeTab === 'cold-storage' ? 'coldStorage' :
                            activeTab === 'rent-machines' ? 'rentMachines' :
                            activeTab === 'pest-warnings' ? 'pestWarnings' :
                            activeTab === 'seed-bank' ? 'seedBank' :
                            activeTab === 'map-resources' ? 'mapResources' :
                            activeTab === 'knowledge-base' ? 'knowledgeBase' :
                            activeTab === 'video-tutorials' ? 'videos' :
                            activeTab === 'stories' ? 'stories' :
                            activeTab === 'agents' ? 'agentApplications' :
                            activeTab === 'loan-payments' ? 'loanPayments' :
                            activeTab === 'protection-updates' ? 'protectionUpdates' :
                            activeTab === 'settings' ? 'users' :
                            activeTab === 'cards' ? 'cardApplications' : activeTab;
      
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), data);
      } else {
        const user = auth.currentUser;
        const uid = user?.id || user?.uid || user?._id;
        const finalData = { ...data };
        
        // Inject userId for collections that require it
        if (uid && [
          'stories', 'problemLogs', 'marketplace', 'forumPosts', 
          'userMarketPrices', 'exportApplications', 'loanApplications', 
          'protectionApplications', 'ponaOrders', 'trainingApplications',
          'agentApplications', 'cardApplications', 'seedBank', 'farmingLedger',
          'farmJournal'
        ].includes(collectionName)) {
          if (!finalData.userId && !finalData.sellerId && !finalData.authorId) {
            finalData.userId = uid;
          }
          // Some collections use specific ID fields
          if (collectionName === 'marketplace' && !finalData.sellerId) finalData.sellerId = uid;
          if (collectionName === 'forumPosts' && !finalData.authorId) finalData.authorId = uid;
        }

        await addDoc(collection(db, collectionName), {
          ...finalData,
          createdAt: serverTimestamp()
        });

        // Trigger notifications for critical alerts
        if (collectionName === 'pestWarnings') {
          await addDoc(collection(db, 'notifications'), {
            title: 'পোকামাকড় আক্রমণ সতর্কতা! (Pest Alert)',
            body: `${data.title} - ${data.area}`,
            type: 'warning',
            userId: 'all',
            read: false,
            createdAt: serverTimestamp()
          });
        } else if (collectionName === 'system-push') {
          await addDoc(collection(db, 'notifications'), {
            title: data.title,
            body: data.body,
            type: data.type || 'info',
            userId: 'all',
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
      setEditingItem(null);
      setIsAdding(false);
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save. Check permissions.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure?")) {
      try {
        const collectionName = activeTab === 'market' ? 'marketPrices' : 
                              activeTab === 'user-market' ? 'userMarketPrices' :
                              activeTab === 'calendar' ? 'cropCalendar' : 
                              activeTab === 'problems' ? 'problemLogs' : 
                              activeTab === 'loans' ? 'loanApplications' :
                              activeTab === 'protections' ? 'protectionApplications' :
                              activeTab === 'pona' ? 'ponaOrders' :
                              activeTab === 'exports' ? 'exportApplications' :
                              activeTab === 'training' ? 'trainingApplications' : 
                              activeTab === 'cold-storage' ? 'coldStorage' :
                              activeTab === 'rent-machines' ? 'rentMachines' :
                              activeTab === 'pest-warnings' ? 'pestWarnings' :
                              activeTab === 'seed-bank' ? 'seedBank' :
                              activeTab === 'map-resources' ? 'mapResources' :
                              activeTab === 'knowledge-base' ? 'knowledgeBase' :
                              activeTab === 'agents' ? 'agentApplications' :
                              activeTab === 'loan-payments' ? 'loanPayments' :
                              activeTab === 'protection-updates' ? 'protectionUpdates' :
                              activeTab === 'stories' ? 'stories' :
                              activeTab === 'settings' ? 'users' :
                              activeTab === 'cards' ? 'cardApplications' : activeTab;
        await deleteDoc(doc(db, collectionName, id));
      } catch (err) {
        console.error("Delete error", err);
        alert("Failed to delete.");
      }
    }
  };

  if (!(isAdmin || isManager)) return null;

  return (
    <div className="min-h-[80vh] flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-72 shrink-0 space-y-6">
        <div className="bg-white rounded-[2rem] border border-[#E0E8E0] p-4 shadow-sm">
          <div className="p-4 mb-4">
            <h1 className="text-2xl font-black text-[#1B301B] uppercase tracking-tight">
              {isBn ? 'অ্যাডমিন' : 'Admin'} <span className="text-[#4CAF50]">{isBn ? 'হাব' : 'Hub'}</span>
            </h1>
            <p className="text-xs text-[#8BA88B] font-bold uppercase tracking-widest mt-1">
              {isBn ? 'ম্যানেজমেন্ট কনসোল' : 'Management Console'}
            </p>
          </div>
          
          <nav className="space-y-2">
            {categories.filter(cat => {
              if (isManager && !isAdmin) {
                return cat.id !== 'content';
              }
              return true;
            }).map((cat) => (
              <div key={cat.id} className="space-y-1">
                <button
                  onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all",
                    activeCategory === cat.id ? "bg-[#4CAF50] text-white shadow-lg shadow-green-900/20" : "text-[#556B55] hover:bg-[#F0F5F0]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <cat.icon size={20} />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronRight size={16} className={cn("transition-transform", activeCategory === cat.id && "rotate-90")} />
                </button>
                
                <AnimatePresence>
                  {activeCategory === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-4 space-y-1"
                    >
                      {cat.tabs.filter(tab => {
                        if (isManager && !isAdmin) {
                          return tab !== 'settings';
                        }
                        return true;
                      }).map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab);
                            setEditingItem(null);
                            setIsAdding(false);
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-xl text-sm font-bold transition-all",
                            activeTab === tab ? "text-[#4CAF50] bg-[#F0F5F0]" : "text-[#8BA88B] hover:text-[#556B55]"
                          )}
                        >
                          {getTabLabel(tab)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-[#E0E8E0]">
            <button
              onClick={seedData}
              disabled={isSeeding}
              className="w-full flex items-center justify-center gap-2 p-4 bg-[#F0F5F0] text-[#2E7D32] rounded-2xl font-bold hover:bg-[#E8F5E9] transition-all text-sm disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
              {isBn ? 'ডাটাবেস সীড করুন' : t('admin_seed')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between text-left gap-4 bg-white p-8 rounded-[3rem] border border-[#E0E8E0] shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1B301B] uppercase tracking-tight leading-none">{getTabLabel(activeTab)}</h2>
            <p className="text-[#556B55] font-medium text-xs sm:text-sm">
              {isBn ? `${getTabLabel(activeTab)} সম্পর্কিত তথ্য ও সিস্টেম ব্যবস্থাপনা।` : `Manage your ${getTabLabel(activeTab)} data and system settings.`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Language Toggle */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 px-4 py-2 bg-[#F0F5F0] hover:bg-[#E8F5E9] text-[#1B301B] border border-[#E0E8E0] rounded-full text-xs font-black transition-all shadow-sm"
              title="Change Language"
            >
              <Globe size={14} className="text-[#4CAF50]" />
              <span>{i18n.language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            <div className="px-4 py-2 bg-green-50 rounded-full border border-green-100 text-[10px] font-black uppercase tracking-[0.2em] text-[#2E7D32] flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {isBn ? 'কেজিএফ লাইভ মনিটর' : 'KGF Live Monitor'}
            </div>
          </div>
        </header>

      {activeTab === 'online' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E0E8E0] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-[#556B55]">{isBn ? 'বর্তমানে অনলাইনে' : 'Currently Online'}</p>
              <h3 className="text-2xl font-bold">{onlineUsers.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#E0E8E0] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-[#556B55]">{isBn ? 'মোট নিবন্ধিত ইউজার' : 'Total Registered'}</p>
              <h3 className="text-2xl font-bold">{users.length}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E0E8E0] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E0E8E0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <h2 className="text-xl font-bold">{getTabLabel(activeTab)} {isBn ? 'তালিকা' : 'List'}</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Send size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8BA88B]" />
                <input
                  type="text"
                  placeholder={isBn ? "আইডি, ফোন বা নাম দিয়ে খুঁজুন..." : "Search by ID, Phone, Name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E0E8E0] rounded-xl text-sm focus:ring-2 focus:ring-[#4CAF50] outline-none w-48 sm:w-64 transition-all"
                />
              </div>
              <button 
                onClick={exportToPDF}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                title={isBn ? "পিডিএফ রিপোর্ট ডাউনলোড" : "Export to PDF"}
              >
                <FileDown size={18} />
              </button>
              <button 
                onClick={exportToExcel}
                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                title={isBn ? "এক্সেল রিপোর্ট ডাউনলোড" : "Export to Excel"}
              >
                <FileSpreadsheet size={18} />
              </button>
            </div>
          </div>
          {['species', 'diseases', 'products', 'market', 'calendar', 'marketplace', 'forum', 'loans', 'protections', 'pona', 'training', 'exports', 'user-market', 'cold-storage', 'rent-machines', 'pest-warnings', 'seed-bank', 'soil-test', 'livestock-health', 'fish-water-test', 'map-resources', 'knowledge-base', 'video-tutorials'].includes(activeTab) && (
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingItem(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4CAF50] text-white rounded-xl font-bold hover:bg-[#43A047] transition-all text-sm shrink-0 shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              {isBn ? 'নতুন যোগ করুন' : t('add_new')}
            </button>
          )}
        </div>

        <div className="divide-y divide-[#E0E8E0]">
          <AnimatePresence>
            {(isAdding || editingItem) && ['species', 'diseases', 'products', 'market', 'calendar', 'marketplace', 'forum', 'loans', 'protections', 'pona', 'training', 'exports', 'user-market', 'cold-storage', 'rent-machines', 'pest-warnings', 'seed-bank', 'soil-test', 'livestock-health', 'fish-water-test', 'map-resources', 'knowledge-base', 'video-tutorials', 'settings'].includes(activeTab) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#F9FBF9]"
              >
                <div className="p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-[#1B301B] uppercase tracking-tight">
                        {editingItem ? 'Edit' : 'Add New'} {getTabLabel(activeTab)}
                      </h3>
                      <button 
                        onClick={() => {
                          setIsAdding(false);
                          setEditingItem(null);
                        }}
                        className="p-2 hover:bg-[#E0E8E0] rounded-full transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <Form 
                      type={activeTab} 
                      initialData={editingItem} 
                      onSave={handleSave} 
                      onCancel={() => {
                        setIsAdding(false);
                        setEditingItem(null);
                      }}
                      speciesList={species}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="divide-y divide-[#E0E8E0]">
            {activeTab === 'species' && filterData(species).map(s => <ListItem key={s.id} item={s} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'diseases' && filterData(diseases).map(d => <ListItem key={d.id} item={d} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'products' && filterData(products).map(p => <ListItem key={p.id} item={p} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'market' && filterData(marketPrices).map(m => <ListItem key={m.id} item={m} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'calendar' && filterData(cropCalendar).map(c => <ListItem key={c.id} item={c} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'user-market' && filterData(userMarketPrices).map(m => <ListItem key={m.id} item={m} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'marketplace' && filterData(marketplace).map(m => <ListItem key={m.id} item={m} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'forum' && filterData(forumPosts).map(f => <ListItem key={f.id} item={f} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'cold-storage' && filterData(coldStorages).map(s => <ListItem key={s.id} item={s} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'rent-machines' && filterData(rentMachines).map(m => <ListItem key={m.id} item={m} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'pest-warnings' && filterData(pestWarnings).map(p => <ListItem key={p.id} item={p} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'seed-bank' && filterData(seedBank).map(s => <ListItem key={s.id} item={s} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'soil-test' && filterData(soilTests).map(s => <ListItem key={s.id} item={s} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'livestock-health' && filterData(livestockHealth).map(l => <ListItem key={l.id} item={l} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'fish-water-test' && filterData(fishWaterTests).map(f => <ListItem key={f.id} item={f} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'map-resources' && filterData(mapResources).map(m => <ListItem key={m.id} item={m} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'knowledge-base' && filterData(knowledgeBase).map(k => <ListItem key={k.id} item={k} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'video-tutorials' && filterData(videos).map(v => <ListItem key={v.id} item={v} onEdit={setEditingItem} onDelete={handleDelete} isAdmin={isAdmin || isManager} />)}
            {activeTab === 'agents' && filterData(agentApps).map(a => (
              <div key={a.id} className="p-6 hover:bg-[#F9FBF9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-[#4CAF50]" />
                    <h4 className="font-bold text-lg">{a.name} {a.agentId && <span className="text-[#4CAF50] ml-2">[{a.agentId}]</span>}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      a.status === 'approved' ? "bg-green-100 text-green-700" : a.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    )}>{a.status || 'pending'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[#556B55]">
                    <p><strong>Shop:</strong> {a.shopName}</p>
                    <p><strong>Type:</strong> {a.agentType}</p>
                    <p><strong>Phone:</strong> {a.phone}</p>
                    <p><strong>Location:</strong> {a.upazila}, {a.address}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && <button onClick={() => setEditingItem(a)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors"><Edit2 size={18} /></button>}
                  {isAdmin && a.status !== 'approved' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Agent ID" 
                          id={`manual-id-${a.id}`}
                          defaultValue={a.agentId || `KB-${Math.floor(1000 + Math.random() * 9999)}`}
                          className="px-2 py-1 border rounded text-xs w-24"
                        />
                        <input 
                          type="password" 
                          placeholder="Password" 
                          id={`password-${a.id}`}
                          className="px-2 py-1 border rounded text-xs w-24"
                        />
                      </div>
                      <button onClick={async () => {
                        const manualId = (document.getElementById(`manual-id-${a.id}`) as HTMLInputElement)?.value;
                        const password = (document.getElementById(`password-${a.id}`) as HTMLInputElement)?.value;
                        
                        if (!password) {
                          alert("Please provide a password for the agent.");
                          return;
                        }

                        const agentId = (manualId || `KB-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
                        
                        try {
                          // 1. Update application status
                          await updateDoc(doc(db, 'agentApplications', a.id), { 
                            status: 'approved',
                            agentId: agentId,
                            approvalDate: serverTimestamp()
                          });

                          // 2. Create/Update login credentials in 'agents' collection
                          const { setDoc } = await import('../lib/db');
                          await setDoc(doc(db, 'agents', a.userId || a.id), {
                            ...a,
                            agentId: agentId,
                            password: password,
                            status: 'active',
                            updatedAt: serverTimestamp()
                          });

                          alert(`Agent approved with ID: ${agentId}`);
                        } catch (err) {
                          handleFirestoreError(err, OperationType.WRITE, 'agents/agentApplications');
                        }
                      }} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all uppercase tracking-wider">Finalize Approval</button>
                    </div>
                  )}
                  {isAdmin && <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>}
                </div>
              </div>
            ))}
            {activeTab === 'cards' && filterData(cardApplications).map(a => (
              <div key={a.id} className="p-6 hover:bg-[#F9FBF9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-[#4CAF50]" />
                    <h4 className="font-bold text-lg">{a.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      a.status === 'approved' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>{a.status || 'pending'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[#556B55]">
                    <p><strong>Father:</strong> {a.fatherName}</p>
                    <p><strong>NID:</strong> {a.nidNumber}</p>
                    <p><strong>Phone:</strong> {a.phone}</p>
                    <p><strong>Card Type:</strong> {a.cardType}</p>
                    <p><strong>Referred By:</strong> {a.referredByAgentName ? `${a.referredByAgentName} [${a.referredByAgentId}]` : 'None'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && <button onClick={() => setEditingItem(a)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors"><Edit2 size={18} /></button>}
                  {isAdmin && a.status !== 'approved' && (
                    <button onClick={() => updateDoc(doc(db, 'cardApplications', a.id), { status: 'approved' })} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">Approve</button>
                  )}
                  {isAdmin && <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>}
                </div>
              </div>
            ))}

            {activeTab === 'online' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1B301B]">
                    {isBn ? 'লাইভ সক্রিয় ইউজার তালিকা' : 'Active Online Users Live'} ({onlineUsers.length})
                  </h3>
                  <span className="flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {isBn ? 'রিয়েল-টাইম উপস্থিতি' : 'Real-time Activity'}
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-[#E0E8E0] overflow-hidden shadow-sm">
                  <div className="p-4 bg-[#F9FBF9] border-b border-[#E0E8E0] grid grid-cols-4 font-bold text-xs text-[#556B55] uppercase tracking-wider">
                    <span>{isBn ? 'ইউজার / ব্রাউজার' : 'User / Device'}</span>
                    <span>{isBn ? 'রোল' : 'Role'}</span>
                    <span>{isBn ? 'সর্বশেষ উপস্থিতি' : 'Last Seen'}</span>
                    <span className="text-right">{isBn ? 'স্ট্যাটাস' : 'Status'}</span>
                  </div>
                  <div className="divide-y divide-[#E0E8E0]">
                    {onlineUsers.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#556B55]">
                        {isBn ? 'বর্তমানে কোনো সক্রিয় ইউজার নেই' : 'No active online users right now'}
                      </div>
                    ) : (
                      filterData(onlineUsers).map((u: any) => (
                        <div key={u.id} className="p-4 grid grid-cols-4 items-center text-sm hover:bg-[#F9FBF9] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-black flex items-center justify-center text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-[#1B301B]">{u.name || 'Active User'}</p>
                              {u.phone && <p className="text-[11px] text-[#8BA88B]">{u.phone}</p>}
                            </div>
                          </div>
                          <div>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                              u.role === 'admin' ? "bg-purple-100 text-purple-700 border border-purple-200" :
                              u.role === 'agent' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                              "bg-blue-50 text-blue-700 border border-blue-100"
                            )}>
                              {u.role || 'user'}
                            </span>
                          </div>
                          <div className="text-xs text-[#556B55]">
                            {u.lastSeenDate ? new Date(u.lastSeenDate).toLocaleTimeString() : (isBn ? 'সক্রিয়' : 'Active now')}
                          </div>
                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                              {isBn ? 'অনলাইন' : 'Online'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && filterData(users).map(u => <UserItem key={u.id} user={u} onUpdateRole={(role: string) => updateDoc(doc(db, 'users', u.id), { role })} isAdmin={isAdmin} />)}
            
            {activeTab === 'settings' && isAdmin && (
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-[#1B301B] uppercase tracking-tight">Admin & Rule Management</h3>
                    <p className="text-sm text-[#556B55]">Create and manage system administrators</p>
                  </div>
                  {isSuperAdmin && (
                    <button 
                      onClick={() => {
                        setEditingItem(null);
                        setIsAdding(true);
                        setActiveTab('settings');
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-organic-dark text-white rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <Plus size={20} />
                      Add New Admin
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-[#E0E8E0] overflow-hidden shadow-sm">
                  <div className="p-4 bg-[#F9FBF9] border-b border-[#E0E8E0] grid grid-cols-4 font-bold text-sm text-[#556B55]">
                    <span>Name</span>
                    <span>Credentials</span>
                    <span>Role</span>
                    <span className="text-right">Actions</span>
                  </div>
                  <div className="divide-y divide-[#E0E8E0]">
                    {filterData(users.filter(u => u.role === 'admin' || u.role === 'manager')).map(u => (
                      <div key={u.id} className="p-4 grid grid-cols-4 items-center text-sm hover:bg-[#F9FBF9] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-organic-green/10 rounded-full flex items-center justify-center text-organic-green font-black">
                            {u.name?.charAt(0) || 'A'}
                          </div>
                          <span className="font-bold">{u.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#8BA88B] truncate pr-4">{u.email || u.phone}</span>
                          {u.password && (
                            <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-black tracking-widest mt-0.5">
                              <Lock size={8} /> {u.password}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            u.role === 'admin' ? "bg-purple-100 text-purple-600 shadow-sm" : 
                            "bg-blue-100 text-blue-600 shadow-sm"
                          )}>
                            {u.role}
                          </span>
                        </div>
                        <div className="flex justify-end gap-2">
                          {isSuperAdmin ? (
                            <>
                              <button 
                                onClick={() => setEditingItem(u)}
                                className="p-2 text-organic-green hover:bg-organic-green/10 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(u.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-gray-300">Protected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-[#E0E8E0]">
                  <h3 className="text-xl font-bold mb-4">All User Access</h3>
                  <div className="bg-white rounded-3xl border border-[#E0E8E0] overflow-hidden shadow-sm">
                    <div className="p-4 bg-[#F9FBF9] border-b border-[#E0E8E0] grid grid-cols-4 font-bold text-sm text-[#556B55]">
                      <span>User</span>
                      <span>Identifier</span>
                      <span>Current Access</span>
                      <span className="text-right">Update Role</span>
                    </div>
                    <div className="divide-y divide-[#E0E8E0]">
                      {filterData(users.filter(u => u.role !== 'admin' && u.role !== 'manager')).map(u => (
                        <div key={u.id} className="p-4 grid grid-cols-4 items-center text-sm hover:bg-[#F9FBF9] transition-colors">
                          <span className="font-bold">{u.name}</span>
                          <span className="text-[#8BA88B]">{u.email || u.phone}</span>
                          <span className="text-gray-400 capitalize">{u.role || 'user'}</span>
                          <div className="flex justify-end pr-1">
                            {isSuperAdmin ? (
                              <select 
                                value={u.role || 'user'} 
                                onChange={(e) => updateDoc(doc(db, 'users', u.id), { role: e.target.value })}
                                className="px-3 py-1.5 bg-[#FDFCFB] border border-[#E0E8E0] rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-organic-green transition-all"
                              >
                                <option value="user">Standard User</option>
                                <option value="manager">Manager Access</option>
                                <option value="admin">Admin Root</option>
                              </select>
                            ) : (
                              <span className="text-[10px] uppercase font-bold text-gray-300">View Only</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'stories' && filterData(stories).map(story => (
              <div key={story.id} className="p-6 hover:bg-[#F9FBF9] transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">{story.userName}</h4>
                      <span className="text-xs text-[#8BA88B]">
                        {story.createdAt?.toDate ? story.createdAt.toDate().toLocaleString() : (story.createdAt ? new Date(story.createdAt).toLocaleString() : 'Just now')}
                      </span>
                    </div>
                    <p className="text-[#556B55]">{story.content}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingItem(story)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(story.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {activeTab === 'problems' && filterData(problems).map(problem => (
              <div key={problem.id} className="p-6 hover:bg-[#F9FBF9] transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-[#4CAF50]" />
                      <h4 className="font-bold text-lg">Problem Log</h4>
                      <span className="text-xs text-[#8BA88B]">
                        {problem.timestamp?.toDate ? problem.timestamp.toDate().toLocaleString() : (problem.timestamp ? new Date(problem.timestamp).toLocaleString() : (problem.createdAt ? new Date(problem.createdAt).toLocaleString() : 'Recent'))}
                      </span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">Problem</p>
                      <p className="text-[#1B301B]">{problem.problem}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-xs font-bold text-[#4CAF50] uppercase mb-1">AI Solution</p>
                      <p className="text-[#1B301B]">{problem.solution}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingItem(problem)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(problem.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {activeTab === 'loans' && (
              <div className="p-6 space-y-6">
                {/* Loan KPI Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">{isBn ? 'মোট আবেদন' : 'Total Applications'}</p>
                    <h3 className="text-2xl font-black text-green-900 mt-1">{loans.length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{isBn ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Approvals'}</p>
                    <h3 className="text-2xl font-black text-amber-900 mt-1">{loans.filter(l => !l.status || l.status === 'pending').length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{isBn ? 'মোট আবেদনকৃত অর্থ' : 'Requested Total'}</p>
                    <h3 className="text-xl font-black text-blue-900 mt-1">৳{loans.reduce((acc, l) => acc + (parseFloat(l.amount) || 0), 0).toLocaleString()}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">{isBn ? 'মোট অনুমোদিত অর্থ' : 'Approved Total'}</p>
                    <h3 className="text-xl font-black text-purple-900 mt-1">৳{loans.filter(l => l.status === 'approved' || l.status === 'disbursed').reduce((acc, l) => acc + (parseFloat(l.approvedAmount || l.amount) || 0), 0).toLocaleString()}</h3>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'all', label: isBn ? 'সকল আবেদন' : 'All Loans', count: loans.length },
                      { key: 'pending', label: isBn ? 'অপেক্ষমাণ' : 'Pending', count: loans.filter(l => !l.status || l.status === 'pending').length },
                      { key: 'approved', label: isBn ? 'অনুমোদিত' : 'Approved', count: loans.filter(l => l.status === 'approved').length },
                      { key: 'disbursed', label: isBn ? 'বিতরণকৃত' : 'Disbursed', count: loans.filter(l => l.status === 'disbursed').length },
                      { key: 'rejected', label: isBn ? 'বাতিল' : 'Rejected', count: loans.filter(l => l.status === 'rejected').length },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setLoanStatusFilter(f.key as any)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                          loanStatusFilter === f.key 
                            ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-md shadow-green-900/20"
                            : "bg-white text-[#556B55] border-[#E0E8E0] hover:bg-[#F0F5F0]"
                        )}
                      >
                        <span>{f.label}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                          loanStatusFilter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                        )}>{f.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loans List */}
                <div className="space-y-4">
                  {filterData(loans)
                    .filter(loan => {
                      if (loanStatusFilter === 'all') return true;
                      return (loan.status || 'pending').toLowerCase() === loanStatusFilter;
                    })
                    .map(loan => (
                      <div key={loan.id} className="p-6 bg-white rounded-2xl border border-[#E0E8E0] hover:border-[#4CAF50] transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                              <Landmark size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-[#1B301B]">{loan.name || loan.userName}</h4>
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  loan.status === 'approved' ? "bg-green-100 text-green-700 border border-green-200" :
                                  loan.status === 'disbursed' ? "bg-purple-100 text-purple-700 border border-purple-200" :
                                  loan.status === 'rejected' ? "bg-red-100 text-red-700 border border-red-200" :
                                  "bg-amber-100 text-amber-800 border border-amber-200"
                                )}>
                                  {loan.status || 'pending'}
                                </span>
                              </div>
                              <p className="text-xs text-[#8BA88B] font-mono mt-0.5">
                                ID: <span className="font-bold text-[#1B301B]">{loan.loanId || loan.id}</span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs text-[#556B55] bg-[#F9FBF9] p-3 rounded-xl border border-[#E0E8E0]">
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'আবেদনকৃত ঋণ:' : 'Requested:'}</span>
                              <strong className="text-sm text-[#1B301B]">৳{(parseFloat(loan.amount) || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'অনুমোদিত পরিমাণ:' : 'Approved:'}</span>
                              <strong className="text-sm text-green-700">৳{(parseFloat(loan.approvedAmount || loan.amount) || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'ফোন নম্বর:' : 'Phone:'}</span>
                              <span className="font-bold text-[#1B301B]">{loan.phone}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'খামার খাত:' : 'Farming Sector:'}</span>
                              <span className="font-bold text-[#1B301B]">{loan.farmingType || loan.cropType || 'Agriculture'}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'এলাকা:' : 'Location:'}</span>
                              <span>{loan.upazila ? `${loan.upazila}, ` : ''}{loan.district || 'Bangladesh'}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'মেয়াদ:' : 'Duration:'}</span>
                              <span>{loan.duration || '12'} Months</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[#8BA88B] block">{isBn ? 'রেফারেল এজেন্ট:' : 'Referred By:'}</span>
                              <span className="font-semibold text-emerald-800">{loan.referredByAgentName ? `${loan.referredByAgentName} (${loan.referredByAgentId})` : 'Direct Application'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedLoanDetails(loan)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                            >
                              <Info size={14} />
                              {isBn ? 'বিস্তারিত' : 'Details'}
                            </button>

                            {isAdmin && (
                              <button 
                                onClick={() => {
                                  setEditingItem({ 
                                    loanId: loan.loanId || loan.id, 
                                    agentId: loan.referredByAgentId || null,
                                    userName: loan.name || loan.userName,
                                    date: new Date().toISOString().split('T')[0], 
                                    amount: '' 
                                  });
                                  setActiveTab('loan-payments');
                                  setIsAdding(true);
                                }} 
                                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1"
                                title={isBn ? "কিস্তি জমা এন্ট্রি" : "Add Installment Entry"}
                              >
                                <Plus size={14} />
                                {isBn ? 'কিস্তি' : 'Entry'}
                              </button>
                            )}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              {loan.status !== 'approved' && loan.status !== 'disbursed' && (
                                <button 
                                  onClick={async () => {
                                    const approvedAmt = prompt(isBn ? 'অনুমোদিত ঋণের পরিমাণ লিখুন (টাকা):' : 'Enter Approved Loan Amount (TK):', loan.amount);
                                    if (approvedAmt) {
                                      await updateDoc(doc(db, 'loanApplications', loan.id), { 
                                        status: 'approved', 
                                        approvedAmount: approvedAmt,
                                        approvalDate: serverTimestamp() 
                                      });
                                      await addDoc(collection(db, 'notifications'), {
                                        userId: loan.userId || '',
                                        title: 'বন্ধু কৃষি ঋণ অনুমোদিত হয়েছে',
                                        message: `আপনার ৳${approvedAmt} টাকার ঋণ আবেদন (${loan.loanId || loan.id}) সফলভাবে অনুমোদিত হয়েছে।`,
                                        type: 'loan',
                                        createdAt: serverTimestamp()
                                      });
                                    }
                                  }} 
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <CheckCircle2 size={14} />
                                  {isBn ? 'অনুমোদন' : 'Approve'}
                                </button>
                              )}

                              {loan.status === 'approved' && (
                                <button 
                                  onClick={() => updateDoc(doc(db, 'loanApplications', loan.id), { status: 'disbursed', disbursedDate: serverTimestamp() })}
                                  className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all"
                                >
                                  {isBn ? 'বিতরণ সম্পন্ন' : 'Mark Disbursed'}
                                </button>
                              )}

                              {loan.status !== 'rejected' && (
                                <button 
                                  onClick={async () => {
                                    if (confirm(isBn ? 'আপনি কি এই আবেদনটি বাতিল করতে চান?' : 'Are you sure you want to reject this loan?')) {
                                      await updateDoc(doc(db, 'loanApplications', loan.id), { status: 'rejected' });
                                    }
                                  }} 
                                  className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                                >
                                  {isBn ? 'বাতিল' : 'Reject'}
                                </button>
                              )}

                              <button onClick={() => setEditingItem(loan)} className="p-1.5 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(loan.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {filterData(loans).filter(l => loanStatusFilter === 'all' || (l.status || 'pending').toLowerCase() === loanStatusFilter).length === 0 && (
                    <div className="p-12 text-center text-[#556B55] bg-white rounded-2xl border border-dashed border-[#E0E8E0]">
                      <Landmark size={36} className="mx-auto text-[#8BA88B] mb-2 opacity-50" />
                      <p className="font-bold">{isBn ? 'এই ক্যাটাগরিতে কোনো ঋণ আবেদন নেই' : 'No loan applications found in this filter'}</p>
                    </div>
                  )}
                </div>

                {/* Selected Loan Details Modal */}
                {selectedLoanDetails && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-[#E0E8E0]"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#E0E8E0]">
                        <div>
                          <h3 className="text-xl font-black text-[#1B301B]">
                            {isBn ? 'বন্ধু ঋণ আবেদন বিস্তারিত' : 'Loan Application Details'}
                          </h3>
                          <p className="text-xs text-[#8BA88B]">Loan ID: <span className="font-mono font-bold text-[#1B301B]">{selectedLoanDetails.loanId || selectedLoanDetails.id}</span></p>
                        </div>
                        <button onClick={() => setSelectedLoanDetails(null)} className="p-2 hover:bg-[#F0F5F0] rounded-full transition-colors">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-[#F9FBF9] p-4 rounded-2xl space-y-2 border border-[#E0E8E0]">
                          <h4 className="font-bold text-[#1B301B] flex items-center gap-1.5"><Users size={16} className="text-[#4CAF50]" /> {isBn ? 'আবেদনকারীর তথ্য' : 'Applicant Info'}</h4>
                          <p><strong>{isBn ? 'নাম:' : 'Name:'}</strong> {selectedLoanDetails.name || selectedLoanDetails.userName}</p>
                          <p><strong>{isBn ? 'পিতা/স্বামীর নাম:' : 'Father/Husband:'}</strong> {selectedLoanDetails.fatherName || 'N/A'}</p>
                          <p><strong>{isBn ? 'ফোন:' : 'Phone:'}</strong> {selectedLoanDetails.phone}</p>
                          <p><strong>{isBn ? 'জাতীয় পরিচয়পত্র:' : 'NID:'}</strong> {selectedLoanDetails.nidNumber || 'N/A'}</p>
                          <p><strong>{isBn ? 'জেলা ও উপজেলা:' : 'Address:'}</strong> {selectedLoanDetails.upazila ? `${selectedLoanDetails.upazila}, ` : ''}{selectedLoanDetails.district || 'N/A'}</p>
                        </div>

                        <div className="bg-[#F9FBF9] p-4 rounded-2xl space-y-2 border border-[#E0E8E0]">
                          <h4 className="font-bold text-[#1B301B] flex items-center gap-1.5"><Landmark size={16} className="text-[#4CAF50]" /> {isBn ? 'ঋণ ও খামার বিবরণ' : 'Loan & Farming Details'}</h4>
                          <p><strong>{isBn ? 'আবেদনকৃত ঋণ:' : 'Requested Amount:'}</strong> ৳{(parseFloat(selectedLoanDetails.amount) || 0).toLocaleString()}</p>
                          <p><strong>{isBn ? 'অনুমোদিত ঋণ:' : 'Approved Amount:'}</strong> ৳{(parseFloat(selectedLoanDetails.approvedAmount || selectedLoanDetails.amount) || 0).toLocaleString()}</p>
                          <p><strong>{isBn ? 'খামারের ধরন:' : 'Farming Sector:'}</strong> {selectedLoanDetails.farmingType || selectedLoanDetails.cropType || 'Agriculture'}</p>
                          <p><strong>{isBn ? 'জমির পরিমাণ:' : 'Land Size:'}</strong> {selectedLoanDetails.landSize || 'N/A'}</p>
                          <p><strong>{isBn ? 'মেয়াদ:' : 'Duration:'}</strong> {selectedLoanDetails.duration || '12'} Months</p>
                        </div>

                        <div className="bg-[#F9FBF9] p-4 rounded-2xl space-y-2 border border-[#E0E8E0]">
                          <h4 className="font-bold text-[#1B301B] flex items-center gap-1.5"><CreditCard size={16} className="text-[#4CAF50]" /> {isBn ? 'ব্যাংক / মোবাইল ব্যাংকিং' : 'Banking / Payment'}</h4>
                          <p><strong>{isBn ? 'ব্যাংক/পদ্ধতি:' : 'Bank/Method:'}</strong> {selectedLoanDetails.bankName || 'N/A'}</p>
                          <p><strong>{isBn ? 'হিসাব/মোবাইল নং:' : 'Account/Mobile:'}</strong> {selectedLoanDetails.accountNumber || 'N/A'}</p>
                          <p><strong>{isBn ? 'শাখা:' : 'Branch:'}</strong> {selectedLoanDetails.branchName || 'N/A'}</p>
                        </div>

                        <div className="bg-[#F9FBF9] p-4 rounded-2xl space-y-2 border border-[#E0E8E0]">
                          <h4 className="font-bold text-[#1B301B] flex items-center gap-1.5"><Shield size={16} className="text-[#4CAF50]" /> {isBn ? 'জামিনদার ও রেফারেল' : 'Guarantor & Referral'}</h4>
                          <p><strong>{isBn ? 'জামিনদারের নাম:' : 'Guarantor:'}</strong> {selectedLoanDetails.guarantorName || 'N/A'}</p>
                          <p><strong>{isBn ? 'জামিনদারের ফোন:' : 'Phone:'}</strong> {selectedLoanDetails.guarantorPhone || 'N/A'}</p>
                          <p><strong>{isBn ? 'রেফারেল এজেন্ট:' : 'Agent Referral:'}</strong> {selectedLoanDetails.referredByAgentName ? `${selectedLoanDetails.referredByAgentName} (${selectedLoanDetails.referredByAgentId})` : 'Direct'}</p>
                        </div>
                      </div>

                      {/* NID Documents Preview */}
                      {(selectedLoanDetails.nidFront || selectedLoanDetails.nidBack) && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-sm text-[#1B301B]">{isBn ? 'সংযুক্ত এনআইডি কার্ড ডকুমেন্ট' : 'Attached NID Documents'}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedLoanDetails.nidFront && (
                              <div className="space-y-1">
                                <span className="text-xs text-[#8BA88B] font-bold">{isBn ? 'সামনের অংশ (Front Side)' : 'Front Side'}</span>
                                <a href={selectedLoanDetails.nidFront} target="_blank" rel="noreferrer">
                                  <img src={selectedLoanDetails.nidFront} alt="NID Front" className="w-full h-40 object-cover rounded-2xl border border-[#E0E8E0] hover:opacity-90" />
                                </a>
                              </div>
                            )}
                            {selectedLoanDetails.nidBack && (
                              <div className="space-y-1">
                                <span className="text-xs text-[#8BA88B] font-bold">{isBn ? 'পেছনের অংশ (Back Side)' : 'Back Side'}</span>
                                <a href={selectedLoanDetails.nidBack} target="_blank" rel="noreferrer">
                                  <img src={selectedLoanDetails.nidBack} alt="NID Back" className="w-full h-40 object-cover rounded-2xl border border-[#E0E8E0] hover:opacity-90" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4 border-t border-[#E0E8E0]">
                        <button
                          onClick={() => setSelectedLoanDetails(null)}
                          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-all"
                        >
                          {isBn ? 'বন্ধ করুন' : 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'loan-payments' && (
              <div className="p-6 space-y-6">
                {/* Installment KPI Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{isBn ? 'মোট আদায়কৃত অর্থ' : 'Total Collection'}</p>
                    <h3 className="text-2xl font-black text-emerald-900 mt-1">
                      ৳{loanPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{isBn ? 'মোট কিস্তি জমা সংখ্যা' : 'Total Slips'}</p>
                    <h3 className="text-2xl font-black text-blue-900 mt-1">{loanPayments.length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">{isBn ? 'গড় কিস্তির পরিমাণ' : 'Average Installment'}</p>
                    <h3 className="text-xl font-black text-purple-900 mt-1">
                      ৳{loanPayments.length > 0 ? Math.round(loanPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) / loanPayments.length).toLocaleString() : '0'}
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-2xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{isBn ? 'সর্বোচ্চ একক জমা' : 'Highest Installment'}</p>
                    <h3 className="text-xl font-black text-amber-900 mt-1">
                      ৳{Math.max(0, ...loanPayments.map(p => parseFloat(p.amount) || 0)).toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Filter Pills & Add Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'all', label: isBn ? 'সকল কিস্তি' : 'All Payments', count: loanPayments.length },
                      { key: 'Mobile Banking', label: isBn ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking', count: loanPayments.filter(p => (p.method || '').includes('Mobile')).length },
                      { key: 'Bank Transfer', label: isBn ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer', count: loanPayments.filter(p => (p.method || '').includes('Bank')).length },
                      { key: 'Agent Counter', label: isBn ? 'এজেন্ট কাউন্টার' : 'Agent Counter', count: loanPayments.filter(p => (p.method || '').includes('Agent')).length },
                      { key: 'Cash Payment', label: isBn ? 'নগদ গ্রহণ' : 'Cash', count: loanPayments.filter(p => (p.method || '').includes('Cash')).length },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setPaymentMethodFilter(f.key)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                          paymentMethodFilter === f.key 
                            ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-md shadow-green-900/20"
                            : "bg-white text-[#556B55] border-[#E0E8E0] hover:bg-[#F0F5F0]"
                        )}
                      >
                        <span>{f.label}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                          paymentMethodFilter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                        )}>{f.count}</span>
                      </button>
                    ))}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingItem({
                          date: new Date().toISOString().split('T')[0],
                          method: 'Mobile Banking',
                          amount: '',
                          loanId: '',
                          userName: ''
                        });
                        setIsAdding(true);
                      }}
                      className="px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-xs font-bold hover:bg-[#43A047] transition-all flex items-center gap-1.5 shadow-md shadow-green-900/20"
                    >
                      <Plus size={16} />
                      {isBn ? 'নতুন কিস্তি এন্ট্রি' : 'New Installment Entry'}
                    </button>
                  )}
                </div>

                {/* Installments List */}
                <div className="space-y-3">
                  {filterData(loanPayments)
                    .filter(pay => {
                      if (paymentMethodFilter === 'all') return true;
                      return (pay.method || '').toLowerCase().includes(paymentMethodFilter.toLowerCase());
                    })
                    .map(pay => (
                      <div key={pay.id} className="p-5 bg-white rounded-2xl border border-[#E0E8E0] hover:border-[#4CAF50] transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#4CAF50]">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-black">
                              <HistoryIcon size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-[#1B301B]">{pay.userName || pay.name || 'Farmer Borrower'}</h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {pay.installmentNo || 'কিস্তি জমা'}
                                </span>
                              </div>
                              <p className="text-xs text-[#8BA88B] font-mono mt-0.5">
                                Loan ID: <span className="font-bold text-[#1B301B]">{pay.loanId || 'N/A'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#556B55] bg-[#F9FBF9] p-3 rounded-xl border border-[#E0E8E0]">
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'পরিশোধিত অর্থ:' : 'Paid Amount:'}</span>
                              <strong className="text-base text-[#4CAF50]">৳{(parseFloat(pay.amount) || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'পেমেন্ট মাধ্যম:' : 'Method:'}</span>
                              <span className="font-bold text-[#1B301B]">{pay.method || 'Cash'}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'তারিখ:' : 'Payment Date:'}</span>
                              <span className="font-semibold text-[#1B301B]">{pay.date || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'ট্রানজেকশন/রিসিট:' : 'TrxID / Slip:'}</span>
                              <span className="font-mono text-emerald-800 font-bold">{pay.transactionId || 'CASH-REC'}</span>
                            </div>
                            {pay.collectorName && (
                              <div className="sm:col-span-2 text-xs">
                                <span className="text-[#8BA88B]">{isBn ? 'গ্রহীতা / ভেরিফাইড:' : 'Verified By:'}</span> <strong className="text-[#1B301B]">{pay.collectorName}</strong>
                              </div>
                            )}
                            {pay.note && (
                              <div className="sm:col-span-2 text-xs">
                                <span className="text-[#8BA88B]">{isBn ? 'মন্তব্য:' : 'Note:'}</span> <span className="text-[#1B301B]">{pay.note}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <button
                            onClick={() => setSelectedPaymentReceipt(pay)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                            title={isBn ? "মানি রিসিট দেখুন" : "View Money Receipt"}
                          >
                            <Info size={14} />
                            {isBn ? 'রিসিট' : 'Receipt'}
                          </button>

                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => setEditingItem(pay)} 
                                className="p-1.5 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors"
                                title="Edit Payment"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(pay.id)} 
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                  {filterData(loanPayments).filter(p => paymentMethodFilter === 'all' || (p.method || '').toLowerCase().includes(paymentMethodFilter.toLowerCase())).length === 0 && (
                    <div className="p-12 text-center text-[#556B55] bg-white rounded-2xl border border-dashed border-[#E0E8E0]">
                      <HistoryIcon size={36} className="mx-auto text-[#8BA88B] mb-2 opacity-50" />
                      <p className="font-bold">{isBn ? 'এই ফিল্টারে কোনো কিস্তি জমার তথ্য পাওয়া যায়নি' : 'No installment payment records found'}</p>
                    </div>
                  )}
                </div>

                {/* Printable Money Receipt Modal */}
                {selectedPaymentReceipt && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-[#E0E8E0]"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#E0E8E0]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-[#1B301B]">
                              {isBn ? 'কৃষি বন্ধু মানি রিসিট' : 'Krishi Bondhu Payment Slip'}
                            </h3>
                            <p className="text-[10px] text-[#8BA88B]">Official Money Receipt Voucher</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedPaymentReceipt(null)} className="p-1.5 hover:bg-[#F0F5F0] rounded-full transition-colors">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E0E8E0] space-y-3 text-xs">
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-[#8BA88B]">{isBn ? 'ঋণ আইডি:' : 'Loan ID:'}</span>
                          <span className="font-mono font-bold text-[#1B301B]">{selectedPaymentReceipt.loanId}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-[#8BA88B]">{isBn ? 'কৃষক / গ্রহীতার নাম:' : 'Borrower Name:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedPaymentReceipt.userName || selectedPaymentReceipt.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-[#8BA88B]">{isBn ? 'জমা কিস্তির পরিমাণ:' : 'Installment Paid:'}</span>
                          <span className="text-sm font-black text-[#4CAF50]">৳{(parseFloat(selectedPaymentReceipt.amount) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-[#8BA88B]">{isBn ? 'কিস্তি নম্বর:' : 'Installment No:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedPaymentReceipt.installmentNo || '১ম কিস্তি'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-[#8BA88B]">{isBn ? 'পরিশোধ মাধ্যম:' : 'Payment Method:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedPaymentReceipt.method}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-200">
                          <span className="text-[#8BA88B]">{isBn ? 'ট্রানজেকশন আইডি:' : 'Transaction ID:'}</span>
                          <span className="font-mono font-bold text-emerald-800">{selectedPaymentReceipt.transactionId || 'CASH-REC'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#8BA88B]">{isBn ? 'জমার তারিখ:' : 'Payment Date:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedPaymentReceipt.date}</span>
                        </div>
                      </div>

                      <div className="flex justify-between gap-3 pt-2">
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <FileDown size={14} />
                          {isBn ? 'প্রিন্ট / রিসিট ডাউনলোড' : 'Print Voucher'}
                        </button>
                        <button
                          onClick={() => setSelectedPaymentReceipt(null)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-all"
                        >
                          {isBn ? 'বন্ধ করুন' : 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'protections' && (
              <div className="p-6 space-y-6">
                {/* Suraksha Protection KPI Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{isBn ? 'মোট বীমা আবেদন' : 'Total Applications'}</p>
                    <h3 className="text-2xl font-black text-blue-900 mt-1">{protections.length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{isBn ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Approvals'}</p>
                    <h3 className="text-2xl font-black text-amber-900 mt-1">{protections.filter(p => !p.status || p.status === 'pending').length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{isBn ? 'মোট কভারেজ মূল্য' : 'Total Coverage Value'}</p>
                    <h3 className="text-xl font-black text-emerald-900 mt-1">৳{protections.reduce((acc, p) => acc + (parseFloat(p.totalValue) || 0), 0).toLocaleString()}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">{isBn ? 'মোট প্রিমিয়াম নির্ধারিত' : 'Total Premium'}</p>
                    <h3 className="text-xl font-black text-purple-900 mt-1">
                      ৳{protections.reduce((acc, p) => acc + (parseFloat(p.premium) || ((parseFloat(p.totalValue) || 0) * 0.05)), 0).toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'all', label: isBn ? 'সকল আবেদন' : 'All Protections', count: protections.length },
                      { key: 'pending', label: isBn ? 'অপেক্ষমাণ' : 'Pending', count: protections.filter(p => !p.status || p.status === 'pending').length },
                      { key: 'approved', label: isBn ? 'অনুমোদিত / সক্রিয়' : 'Approved / Active', count: protections.filter(p => p.status === 'approved').length },
                      { key: 'claimed', label: isBn ? 'ক্লেইমকৃত' : 'Claimed', count: protections.filter(p => p.status === 'claimed').length },
                      { key: 'rejected', label: isBn ? 'বাতিল' : 'Rejected', count: protections.filter(p => p.status === 'rejected').length },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setProtectionStatusFilter(f.key as any)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                          protectionStatusFilter === f.key 
                            ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-md shadow-green-900/20"
                            : "bg-white text-[#556B55] border-[#E0E8E0] hover:bg-[#F0F5F0]"
                        )}
                      >
                        <span>{f.label}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                          protectionStatusFilter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                        )}>{f.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Protections List */}
                <div className="space-y-4">
                  {filterData(protections)
                    .filter(p => {
                      if (protectionStatusFilter === 'all') return true;
                      return (p.status || 'pending').toLowerCase() === protectionStatusFilter;
                    })
                    .map(p => (
                      <div key={p.id} className="p-6 bg-white rounded-2xl border border-[#E0E8E0] hover:border-[#4CAF50] transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                              <Shield size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-[#1B301B]">{p.name || p.userName}</h4>
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  p.status === 'approved' ? "bg-green-100 text-green-700 border border-green-200" :
                                  p.status === 'claimed' ? "bg-purple-100 text-purple-700 border border-purple-200" :
                                  p.status === 'rejected' ? "bg-red-100 text-red-700 border border-red-200" :
                                  "bg-amber-100 text-amber-800 border border-amber-200"
                                )}>
                                  {p.status || 'pending'}
                                </span>
                              </div>
                              <p className="text-xs text-[#8BA88B] font-mono mt-0.5">
                                Protection ID: <span className="font-bold text-[#1B301B]">{p.protectionId || p.id}</span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs text-[#556B55] bg-[#F9FBF9] p-3 rounded-xl border border-[#E0E8E0]">
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'বীমা ফসল/খাত:' : 'Insured Crop:'}</span>
                              <strong className="text-sm text-[#1B301B]">{p.cropType || 'Crop'} {p.subType ? `(${p.subType})` : ''}</strong>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'বীমাকৃত মোট মূল্য:' : 'Total Value:'}</span>
                              <strong className="text-sm text-blue-700">৳{(parseFloat(p.totalValue) || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'প্রিমিয়াম (৫%):' : 'Premium:'}</span>
                              <strong className="text-sm text-emerald-700">৳{(parseFloat(p.premium) || ((parseFloat(p.totalValue) || 0) * 0.05)).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'ফোন নম্বর:' : 'Phone:'}</span>
                              <span className="font-bold text-[#1B301B]">{p.phone}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'এলাকা:' : 'Location:'}</span>
                              <span>{p.upazila ? `${p.upazila}, ` : ''}{p.district || 'Bangladesh'}</span>
                            </div>
                            <div>
                              <span className="text-[#8BA88B] block">{isBn ? 'জমির/খামারের আকার:' : 'Area/Quantity:'}</span>
                              <span>{p.landArea || p.quantity || 'N/A'}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[#8BA88B] block">{isBn ? 'রেফারেল এজেন্ট:' : 'Referred By:'}</span>
                              <span className="font-semibold text-emerald-800">{p.referredByAgentName ? `${p.referredByAgentName} (${p.referredByAgentId})` : 'Direct Application'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                          <button
                            onClick={() => setSelectedProtectionDetails(p)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                          >
                            <Info size={14} />
                            {isBn ? 'বিস্তারিত' : 'Details'}
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              {p.status !== 'approved' && p.status !== 'claimed' && (
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, 'protectionApplications', p.id), { 
                                      status: 'approved', 
                                      approvalDate: serverTimestamp() 
                                    });
                                    await addDoc(collection(db, 'notifications'), {
                                      userId: p.userId || '',
                                      title: 'সুরক্ষা বীমা আবেদন অনুমোদিত',
                                      message: `আপনার ${p.cropType} ফসলের সুরক্ষা বীমা আবেদন (${p.protectionId || p.id}) সফলভাবে অনুমোদিত হয়েছে।`,
                                      type: 'protection',
                                      createdAt: serverTimestamp()
                                    });
                                  }} 
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <CheckCircle2 size={14} />
                                  {isBn ? 'অনুমোদন' : 'Approve'}
                                </button>
                              )}

                              {p.status === 'approved' && (
                                <button 
                                  onClick={() => updateDoc(doc(db, 'protectionApplications', p.id), { status: 'claimed', claimDate: serverTimestamp() })}
                                  className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all"
                                >
                                  {isBn ? 'ক্লেইম মার্ক' : 'Mark Claimed'}
                                </button>
                              )}

                              {p.status !== 'rejected' && (
                                <button 
                                  onClick={async () => {
                                    if (confirm(isBn ? 'আপনি কি এই সুরক্ষা বীমা আবেদনটি বাতিল করতে চান?' : 'Are you sure you want to reject this protection application?')) {
                                      await updateDoc(doc(db, 'protectionApplications', p.id), { status: 'rejected' });
                                    }
                                  }} 
                                  className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                                >
                                  {isBn ? 'বাতিল' : 'Reject'}
                                </button>
                              )}

                              <button onClick={() => setEditingItem(p)} className="p-1.5 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {filterData(protections).filter(p => protectionStatusFilter === 'all' || (p.status || 'pending').toLowerCase() === protectionStatusFilter).length === 0 && (
                    <div className="p-12 text-center text-[#556B55] bg-white rounded-2xl border border-dashed border-[#E0E8E0]">
                      <Shield size={36} className="mx-auto text-[#8BA88B] mb-2 opacity-50" />
                      <p className="font-bold">{isBn ? 'এই ক্যাটাগরিতে কোনো সুরক্ষা বীমা আবেদন নেই' : 'No protection applications found in this filter'}</p>
                    </div>
                  )}
                </div>

                {/* Selected Protection Details Modal */}
                {selectedProtectionDetails && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-[#E0E8E0]"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#E0E8E0]">
                        <div>
                          <h3 className="text-xl font-black text-[#1B301B]">
                            {isBn ? 'সুরক্ষা বীমা আবেদন বিস্তারিত' : 'Suraksha Application Details'}
                          </h3>
                          <p className="text-xs text-[#8BA88B]">Protection ID: <span className="font-mono font-bold text-[#1B301B]">{selectedProtectionDetails.protectionId || selectedProtectionDetails.id}</span></p>
                        </div>
                        <button onClick={() => setSelectedProtectionDetails(null)} className="p-2 hover:bg-[#F0F5F0] rounded-full transition-colors">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-[#F9FBF9] p-4 rounded-2xl space-y-2 border border-[#E0E8E0]">
                          <h4 className="font-bold text-[#1B301B] flex items-center gap-1.5"><Users size={16} className="text-[#4CAF50]" /> {isBn ? 'কৃষক / আবেদনকারীর তথ্য' : 'Applicant Info'}</h4>
                          <p><strong>{isBn ? 'নাম:' : 'Name:'}</strong> {selectedProtectionDetails.name || selectedProtectionDetails.userName}</p>
                          <p><strong>{isBn ? 'পিতা/স্বামীর নাম:' : 'Father/Husband:'}</strong> {selectedProtectionDetails.fatherName || 'N/A'}</p>
                          <p><strong>{isBn ? 'ফোন:' : 'Phone:'}</strong> {selectedProtectionDetails.phone}</p>
                          <p><strong>{isBn ? 'জাতীয় পরিচয়পত্র:' : 'NID:'}</strong> {selectedProtectionDetails.nidNumber || 'N/A'}</p>
                          <p><strong>{isBn ? 'জেলা ও উপজেলা:' : 'Address:'}</strong> {selectedProtectionDetails.upazila ? `${selectedProtectionDetails.upazila}, ` : ''}{selectedProtectionDetails.district || 'N/A'}</p>
                        </div>

                        <div className="bg-[#F9FBF9] p-4 rounded-2xl space-y-2 border border-[#E0E8E0]">
                          <h4 className="font-bold text-[#1B301B] flex items-center gap-1.5"><Shield size={16} className="text-[#4CAF50]" /> {isBn ? 'বীমা ও ফসলের বিবরণ' : 'Insurance & Asset Details'}</h4>
                          <p><strong>{isBn ? 'ফসল / সম্পদ:' : 'Crop / Sector:'}</strong> {selectedProtectionDetails.cropType} {selectedProtectionDetails.subType ? `(${selectedProtectionDetails.subType})` : ''}</p>
                          <p><strong>{isBn ? 'জমির/খামারের আকার:' : 'Area/Quantity:'}</strong> {selectedProtectionDetails.landArea || selectedProtectionDetails.quantity || 'N/A'}</p>
                          <p><strong>{isBn ? 'বীমাকৃত মোট মূল্য:' : 'Total Value:'}</strong> ৳{(parseFloat(selectedProtectionDetails.totalValue) || 0).toLocaleString()}</p>
                          <p><strong>{isBn ? 'নির্ধারিত প্রিমিয়াম:' : 'Premium (5%):'}</strong> ৳{(parseFloat(selectedProtectionDetails.premium) || ((parseFloat(selectedProtectionDetails.totalValue) || 0) * 0.05)).toLocaleString()}</p>
                          <p><strong>{isBn ? 'রেফারেল এজেন্ট:' : 'Referred Agent:'}</strong> {selectedProtectionDetails.referredByAgentName ? `${selectedProtectionDetails.referredByAgentName} (${selectedProtectionDetails.referredByAgentId})` : 'Direct'}</p>
                        </div>
                      </div>

                      {/* NID Documents Preview */}
                      {(selectedProtectionDetails.nidFront || selectedProtectionDetails.nidBack) && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-sm text-[#1B301B]">{isBn ? 'সংযুক্ত এনআইডি কার্ড ডকুমেন্ট' : 'Attached NID Documents'}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedProtectionDetails.nidFront && (
                              <div className="space-y-1">
                                <span className="text-xs text-[#8BA88B] font-bold">{isBn ? 'সামনের অংশ (Front Side)' : 'Front Side'}</span>
                                <a href={selectedProtectionDetails.nidFront} target="_blank" rel="noreferrer">
                                  <img src={selectedProtectionDetails.nidFront} alt="NID Front" className="w-full h-40 object-cover rounded-2xl border border-[#E0E8E0] hover:opacity-90" />
                                </a>
                              </div>
                            )}
                            {selectedProtectionDetails.nidBack && (
                              <div className="space-y-1">
                                <span className="text-xs text-[#8BA88B] font-bold">{isBn ? 'পেছনের অংশ (Back Side)' : 'Back Side'}</span>
                                <a href={selectedProtectionDetails.nidBack} target="_blank" rel="noreferrer">
                                  <img src={selectedProtectionDetails.nidBack} alt="NID Back" className="w-full h-40 object-cover rounded-2xl border border-[#E0E8E0] hover:opacity-90" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4 border-t border-[#E0E8E0]">
                        <button
                          onClick={() => setSelectedProtectionDetails(null)}
                          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-all"
                        >
                          {isBn ? 'বন্ধ করুন' : 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'protection-updates' && (
              <div className="p-6 space-y-6">
                {/* KPI Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{isBn ? 'মোট মাঠ পরিদর্শন রিপোর্ট' : 'Total Field Logs'}</p>
                    <h3 className="text-2xl font-black text-emerald-900 mt-1">{protectionUpdates.length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{isBn ? 'এজেন্ট পরিদর্শন রিপোর্ট' : 'Agent Inspected'}</p>
                    <h3 className="text-2xl font-black text-blue-900 mt-1">{protectionUpdates.filter(u => !!u.agentId).length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">{isBn ? 'সরাসরি কৃষক আপডেট' : 'Farmer Direct'}</p>
                    <h3 className="text-2xl font-black text-purple-900 mt-1">{protectionUpdates.filter(u => !u.agentId).length}</h3>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-2xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{isBn ? 'সর্বশেষ পরিদর্শন' : 'Latest Update'}</p>
                    <h3 className="text-sm font-black text-amber-900 mt-2">
                      {protectionUpdates.length > 0 ? (protectionUpdates[0]?.date || 'Recently') : 'N/A'}
                    </h3>
                  </div>
                </div>

                {/* Filter Pills & Add Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'all', label: isBn ? 'সকল আপডেট' : 'All Updates', count: protectionUpdates.length },
                      { key: 'Rice', label: isBn ? 'ধান ফসল' : 'Rice', count: protectionUpdates.filter(u => (u.cropType || '').toLowerCase().includes('rice') || (u.cropType || '').includes('ধান')).length },
                      { key: 'Fish', label: isBn ? 'মাছ চাষ' : 'Fish', count: protectionUpdates.filter(u => (u.cropType || '').toLowerCase().includes('fish') || (u.cropType || '').includes('মাছ')).length },
                      { key: 'Poultry', label: isBn ? 'পোল্ট্রি খামার' : 'Poultry', count: protectionUpdates.filter(u => (u.cropType || '').toLowerCase().includes('poultry') || (u.cropType || '').includes('মুরগি')).length },
                      { key: 'Livestock', label: isBn ? 'গবাদিপশু' : 'Livestock', count: protectionUpdates.filter(u => (u.cropType || '').toLowerCase().includes('livestock') || (u.cropType || '').includes('পশু')).length },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setProtectionUpdateCropFilter(f.key)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                          protectionUpdateCropFilter === f.key 
                            ? "bg-[#4CAF50] text-white border-[#4CAF50] shadow-md shadow-green-900/20"
                            : "bg-white text-[#556B55] border-[#E0E8E0] hover:bg-[#F0F5F0]"
                        )}
                      >
                        <span>{f.label}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                          protectionUpdateCropFilter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                        )}>{f.count}</span>
                      </button>
                    ))}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingItem({
                          date: new Date().toISOString().split('T')[0],
                          cropType: 'Rice',
                          details: '',
                          protectionId: '',
                          userName: '',
                          updatePic: ''
                        });
                        setIsAdding(true);
                      }}
                      className="px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-xs font-bold hover:bg-[#43A047] transition-all flex items-center gap-1.5 shadow-md shadow-green-900/20"
                    >
                      <Plus size={16} />
                      {isBn ? 'নতুন মাঠ পরিদর্শন আপডেট' : 'Add Inspection Update'}
                    </button>
                  )}
                </div>

                {/* Updates List */}
                <div className="space-y-4">
                  {filterData(protectionUpdates)
                    .filter(upd => {
                      if (protectionUpdateCropFilter === 'all') return true;
                      return (upd.cropType || '').toLowerCase().includes(protectionUpdateCropFilter.toLowerCase());
                    })
                    .map(upd => (
                      <div key={upd.id} className="p-6 bg-white rounded-2xl border border-[#E0E8E0] hover:border-[#4CAF50] transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div 
                          onClick={() => setSelectedProtectionUpdate(upd)}
                          className="w-28 h-28 bg-gray-100 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-[#E0E8E0] cursor-pointer group relative"
                        >
                          <img src={upd.updatePic} alt="Crop Update" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Info size={20} />
                          </div>
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <RefreshCw size={18} className="text-[#4CAF50]" />
                            <h4 className="font-bold text-lg text-[#1B301B]">{upd.userName || 'Farmer'}</h4>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-200">
                              {upd.cropType || 'Crop'}
                            </span>
                            {upd.agentId && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                Agent: {upd.agentId}
                              </span>
                            )}
                            {upd.status && (
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                upd.status === 'verified' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {upd.status}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#556B55] bg-[#F9FBF9] p-3 rounded-xl border border-[#E0E8E0]">
                            <p><strong>Protection ID:</strong> <span className="font-mono font-bold text-[#1B301B]">{upd.protectionId || 'N/A'}</span></p>
                            <p><strong>{isBn ? 'তারিখ:' : 'Date:'}</strong> <span className="font-semibold text-[#1B301B]">{upd.date || 'N/A'}</span></p>
                            <p className="sm:col-span-2 text-sm text-[#1B301B] mt-1 pt-1 border-t border-gray-200">
                              <strong>{isBn ? 'মাঠের অবস্থা / রিপোর্ট:' : 'Condition Report:'}</strong> {upd.details}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex md:flex-col items-end gap-2 shrink-0 justify-end">
                          <button
                            onClick={() => setSelectedProtectionUpdate(upd)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                          >
                            <Info size={14} />
                            {isBn ? 'ছবি ও বিবরণ' : 'View'}
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              {upd.status !== 'verified' && (
                                <button
                                  onClick={() => updateDoc(doc(db, 'protectionUpdates', upd.id), { status: 'verified' })}
                                  className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-all"
                                >
                                  {isBn ? 'ভেরিফাই' : 'Verify'}
                                </button>
                              )}
                              <button onClick={() => setEditingItem(upd)} className="p-1.5 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(upd.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {filterData(protectionUpdates).filter(u => protectionUpdateCropFilter === 'all' || (u.cropType || '').toLowerCase().includes(protectionUpdateCropFilter.toLowerCase())).length === 0 && (
                    <div className="p-12 text-center text-[#556B55] bg-white rounded-2xl border border-dashed border-[#E0E8E0]">
                      <RefreshCw size={36} className="mx-auto text-[#8BA88B] mb-2 opacity-50" />
                      <p className="font-bold">{isBn ? 'এই ফিল্টারে কোনো মাঠ পরিদর্শন রিপোর্ট নেই' : 'No protection update logs found'}</p>
                    </div>
                  )}
                </div>

                {/* Selected Protection Update Zoom Modal */}
                {selectedProtectionUpdate && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-[#E0E8E0]"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E0]">
                        <div>
                          <h3 className="text-lg font-black text-[#1B301B]">
                            {isBn ? 'মাঠ পরিদর্শন ও ফসল রিপোর্ট' : 'Field Inspection & Photo Log'}
                          </h3>
                          <p className="text-xs text-[#8BA88B]">ID: <span className="font-mono font-bold text-[#1B301B]">{selectedProtectionUpdate.protectionId}</span></p>
                        </div>
                        <button onClick={() => setSelectedProtectionUpdate(null)} className="p-1.5 hover:bg-[#F0F5F0] rounded-full transition-colors">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="rounded-2xl overflow-hidden border border-[#E0E8E0] max-h-72 bg-black">
                        <img src={selectedProtectionUpdate.updatePic} alt="Field Zoom" className="w-full h-full object-contain" />
                      </div>

                      <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E0E8E0] space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#8BA88B]">{isBn ? 'কৃষক:' : 'Farmer:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedProtectionUpdate.userName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8BA88B]">{isBn ? 'ফসল / খাত:' : 'Crop:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedProtectionUpdate.cropType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8BA88B]">{isBn ? 'তারিখ:' : 'Inspection Date:'}</span>
                          <span className="font-bold text-[#1B301B]">{selectedProtectionUpdate.date}</span>
                        </div>
                        {selectedProtectionUpdate.agentId && (
                          <div className="flex justify-between">
                            <span className="text-[#8BA88B]">{isBn ? 'পরিদর্শনকারী এজেন্ট:' : 'Field Agent:'}</span>
                            <span className="font-bold text-blue-700">{selectedProtectionUpdate.agentId}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[#8BA88B] block mb-1">{isBn ? 'বিস্তারিত রিপোর্ট:' : 'Detailed Report:'}</span>
                          <p className="text-sm text-[#1B301B] bg-white p-3 rounded-xl border border-gray-200 leading-relaxed">
                            {selectedProtectionUpdate.details}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setSelectedProtectionUpdate(null)}
                          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-all"
                        >
                          {isBn ? 'বন্ধ করুন' : 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pona' && filterData(ponaOrders).map(o => (
              <div key={o.id} className="p-6 hover:bg-[#F9FBF9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-[#4CAF50]" />
                    <h4 className="font-bold text-lg">{o.userName}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      o.status === 'completed' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>{o.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[#556B55]">
                    <p><strong>Category:</strong> {o.category}</p>
                    <p><strong>Phone:</strong> {o.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && <button onClick={() => setEditingItem(o)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors"><Edit2 size={18} /></button>}
                  {isAdmin && <button onClick={() => updateDoc(doc(db, 'ponaOrders', o.id), { status: 'completed' })} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-all">Complete</button>}
                  {isAdmin && <button onClick={() => handleDelete(o.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>}
                </div>
              </div>
            ))}

            {activeTab === 'training' && filterData(trainingApps).map(a => (
              <div key={a.id} className="p-6 hover:bg-[#F9FBF9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-[#4CAF50]" />
                    <h4 className="font-bold text-lg">{a.userName}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      a.status === 'approved' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>{a.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[#556B55]">
                    <p><strong>Topic:</strong> {a.trainingType}</p>
                    <p><strong>Fee:</strong> {a.feeType}</p>
                    <p><strong>Phone:</strong> {a.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && <button onClick={() => setEditingItem(a)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors"><Edit2 size={18} /></button>}
                  {isAdmin && <button onClick={() => updateDoc(doc(db, 'trainingApplications', a.id), { status: 'approved' })} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">Approve</button>}
                  {isAdmin && <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>}
                </div>
              </div>
            ))}

            {activeTab === 'exports' && filterData(exportApps).map(a => (
              <div key={a.id} className="p-6 hover:bg-[#F9FBF9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-[#4CAF50]" />
                    <h4 className="font-bold text-lg">{a.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      a.status === 'approved' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>{a.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[#556B55]">
                    <p><strong>Product:</strong> {a.productName}</p>
                    <p><strong>District:</strong> {a.district}</p>
                    <p><strong>Phone:</strong> {a.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && <button onClick={() => setEditingItem(a)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors"><Edit2 size={18} /></button>}
                  {isAdmin && <button onClick={() => updateDoc(doc(db, 'exportApplications', a.id), { status: 'approved' })} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">Approve</button>}
                  {isAdmin && <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>}
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


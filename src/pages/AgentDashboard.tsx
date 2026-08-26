import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldCheck, CreditCard, ChevronRight, 
  MapPin, Phone, Calendar, Search, Filter,
  ArrowLeft, LogOut, Loader2, Image as ImageIcon,
  CheckCircle2, AlertCircle, Camera, Upload, Send,
  TrendingUp, Wallet, Award, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { 
  db, collection, query, where, getDocs, 
  updateDoc, doc, addDoc, serverTimestamp, 
  orderBy, onSnapshot 
} from '../lib/db';
import { safeLocalStorage } from '../lib/storage';
import { cn } from '../lib/utils';
import { format, startOfMonth, subMonths, isSameMonth } from 'date-fns';

export default function AgentDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [surakshaUpdates, setSurakshaUpdates] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedAppDetails, setSelectedAppDetails] = useState<any>(null);
  const [updateContent, setUpdateContent] = useState('');
  const [updateImage, setUpdateImage] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'installments' | 'suraksha_updates'>('referrals');

  // Stats
  const stats = {
    totalReferrals: applications.length,
    activeServices: applications.filter(a => ['Loan', 'Protection', 'Card', 'Cold Storage', 'Rent Machine', 'Training', 'Marketplace', 'Hatchery', 'Seed Bank', 'Export'].includes(a.type)).length,
    totalEarnings: installments.reduce((acc, curr) => acc + (parseFloat(curr.profit) || 0), 0),
    protectionPoints: applications.filter(a => a.type === 'Protection').length * 100 + surakshaUpdates.length * 50
  };

  const chartData = [
    { name: i18n.language === 'en' ? 'Loans' : 'ঋণ', value: applications.filter(a => a.type === 'Loan').length, color: '#f59e0b' },
    { name: i18n.language === 'en' ? 'Services' : 'সেবা', value: applications.filter(a => ['Cold Storage', 'Rent Machine', 'Training', 'Marketplace', 'Hatchery', 'Seed Bank', 'Export'].includes(a.type)).length, color: '#10b981' },
    { name: i18n.language === 'en' ? 'Finance' : 'আর্থিক', value: applications.filter(a => a.type === 'Card' || a.type === 'Protection').length, color: '#3b82f6' },
  ];

  useEffect(() => {
    try {
      const rawData = safeLocalStorage.getItem('agentData');
      if (!rawData) {
        navigate('/agent-login');
        return;
      }
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === 'object') {
        setAgent(parsed);
      } else {
        navigate('/agent-login');
      }
    } catch (e) {
      console.warn("Agent data parsing failed", e);
      safeLocalStorage.removeItem('agentData');
      navigate('/agent-login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!agent?.agentId) {
      setLoading(false);
      return;
    }

    const getTime = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (val instanceof Date) return val.getTime();
      if (typeof val === 'number') return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    // Fetch referred applications (Loans, Protections, Cards, and other service modules)
    const fetchApplications = () => {
      try {
        const collectionsList = [
          { name: 'loanApplications', agentKey: 'referredByAgentId', type: 'Loan' },
          { name: 'protectionApplications', agentKey: 'referredByAgentId', type: 'Protection' },
          { name: 'cardApplications', agentKey: 'referredByAgentId', type: 'Card' },
          { name: 'coldStorage', agentKey: 'agentId', type: 'Cold Storage' },
          { name: 'rentMachines', agentKey: 'agentId', type: 'Rent Machine' },
          { name: 'trainingApplications', agentKey: 'agentId', type: 'Training' },
          { name: 'marketplace', agentKey: 'agentId', type: 'Marketplace' },
          { name: 'ponaOrders', agentKey: 'agentId', type: 'Hatchery' },
          { name: 'seedBank', agentKey: 'agentId', type: 'Seed Bank' },
          { name: 'exportApplications', agentKey: 'agentId', type: 'Export' },
          { name: 'soilTestRequests', agentKey: 'agentId', type: 'Soil Test' },
          { name: 'livestockHealthRequests', agentKey: 'agentId', type: 'Livestock Health' },
          { name: 'fishWaterTestRequests', agentKey: 'agentId', type: 'Fish Water Test' }
        ];
        
        const unsubs: any[] = [];

        collectionsList.forEach(colInfo => {
          const q = query(collection(db, colInfo.name), where(colInfo.agentKey, '==', agent.agentId));
          const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ ...d.data(), id: d.id, type: colInfo.type }));
            setApplications(prev => {
              const others = prev.filter(a => a.type !== colInfo.type);
              return [...others, ...items].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
            });
          }, (error) => {
            console.error(`Firestore ${colInfo.name} listener error:`, error);
          });
          unsubs.push(unsub);
        });

        return () => unsubs.forEach(u => u());
      } catch (err) {
        console.error("Error setting up app listeners:", err);
      }
    };

    // Fetch installments (loanPayments)
    const fetchPayments = () => {
      if (!agent?.agentId) return;
      try {
        const q = query(
          collection(db, 'loanPayments'), 
          where('agentId', '==', agent.agentId)
        );
        const unsub = onSnapshot(q, (snap) => {
          setInstallments(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, (error) => {
          console.error("Firestore Payments listener error:", error);
        });
        return unsub;
      } catch (err) {
        console.error("Error setting up payment listener:", err);
      }
    };

    const unsubApps = fetchApplications();
    const unsubPayments = fetchPayments();
    
    // Fetch Suraksha Updates
    let unsubUpdates: any = null;
    if (agent?.agentId) {
      const q = query(
        collection(db, 'protectionUpdates'),
        where('agentId', '==', agent.agentId),
        orderBy('createdAt', 'desc')
      );
      unsubUpdates = onSnapshot(q, (snap) => {
        setSurakshaUpdates(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }, (error) => {
        console.error("Firestore Updates listener error:", error);
      });
    }

    setLoading(false);

    return () => {
      unsubApps?.();
      unsubPayments?.();
      unsubUpdates?.();
    };
  }, [agent]);

  const handleLogout = () => {
    safeLocalStorage.removeItem('agentData');
    navigate('/agent-login');
  };

  const handleUpdateSuraksha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !updateContent.trim()) return;

    setSubmittingUpdate(true);
    try {
      await addDoc(collection(db, 'protectionUpdates'), {
        protectionId: selectedApp.protectionId,
        applicationId: selectedApp.id,
        agentId: agent.agentId,
        userName: selectedApp.userName,
        details: updateContent,
        cropType: selectedApp.cropType,
        updatePic: updateImage || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=300',
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: serverTimestamp()
      });

      // Update application status if it was pending
      if (selectedApp.status === 'pending') {
        await updateDoc(doc(db, 'protectionApplications', selectedApp.id), {
          status: 'investigating'
        });
      }

      setUpdateContent('');
      setUpdateImage('');
      setSelectedApp(null);
      alert(i18n.language === 'en' ? 'Update posted successfully!' : 'আপডেট সফলভাবে পোস্ট করা হয়েছে!');
    } catch (err) {
      console.error("Error posting update:", err);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  if (loading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-organic-green" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4 mt-8">
      {/* Header */}
      <header className="bg-organic-dark rounded-[3.5rem] sm:rounded-[5rem] p-8 sm:p-16 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-organic-green/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center shadow-2xl shadow-organic-green/30 shrink-0"
          >
            <img src="/krishi_logo.png" className="w-full h-full object-contain" alt="Logo" />
          </motion.div>
          <div className="text-center sm:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="px-4 py-1 bg-organic-green text-[10px] font-black uppercase tracking-widest rounded-full">
                Professional Agent
              </span>
              <span className="px-4 py-1 bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">
                ID: #{agent.agentId}
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-none">{agent.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 opacity-60">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <MapPin size={12} className="text-organic-green" />
                {agent.district}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <Phone size={12} className="text-organic-green" />
                {agent.phone}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4 w-full sm:w-auto">
          <button 
            onClick={handleLogout}
            className="px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-3"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
          <div className="px-8 py-4 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center sm:items-start">
             <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Affiliated Business</p>
             <p className="text-xs font-black uppercase tracking-tighter text-organic-green">{agent.shopName || 'ABS Feed Dealer'}</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Referrals', value: stats.totalReferrals, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
          { label: 'Active Services', value: stats.activeServices, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/5' },
          { label: 'Total Dividends', value: `৳${stats.totalEarnings}`, icon: Wallet, color: 'text-organic-green', bg: 'bg-organic-green/5' },
          { label: 'Agent Points', value: stats.protectionPoints, icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/5' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white dark:bg-dark-surface p-6 rounded-[2.5rem] border border-organic-green/10 shadow-sm flex flex-col gap-3 group hover:border-organic-green transition-all"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-organic-dark/30 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-black text-organic-dark">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-dark-surface p-8 sm:p-12 rounded-[4rem] border border-organic-green/10 shadow-sm flex flex-col lg:flex-row gap-12 items-center">
        <div className="w-full lg:w-3/5 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 900, fill: '#666', transform: 'translate(0, 5)' }} 
              />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-organic-dark text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{payload[0].payload.name}</p>
                      <p className="text-xl font-black text-organic-green">{payload[0].value} Entries</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={50}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full lg:w-2/5 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-organic-green rounded-full shadow-lg shadow-organic-green/20" />
              <h3 className="text-3xl font-black text-organic-dark tracking-tighter uppercase">Service Analysis</h3>
            </div>
            <p className="text-sm text-organic-dark/50 font-medium leading-relaxed">Distribution of your referred farmers across our micro-financing, insurance, and smart banking services.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
             {chartData.map(item => (
                <div key={item.name} className="flex items-center justify-between p-5 bg-organic-light/30 rounded-3xl group border border-transparent hover:border-organic-green/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-base font-black text-organic-dark uppercase tracking-tighter">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-organic-dark">{item.value}</span>
                    <TrendingUp size={14} className="text-organic-green" />
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-organic-green/10 pb-6 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'referrals', label: t('referred_users'), icon: Users },
          { id: 'installments', label: t('installment_details'), icon: CreditCard },
          { id: 'suraksha_updates', label: t('protection_updates'), icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-3 px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap border-2",
              activeTab === tab.id 
                ? "bg-organic-green text-white border-organic-green shadow-2xl shadow-organic-green/20 scale-105 z-10" 
                : "text-organic-dark/40 border-transparent hover:bg-organic-light dark:hover:bg-dark-surface"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'referrals' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-organic-dark tracking-tighter uppercase">{t('referred_users')}</h2>
              <span className="px-4 py-1.5 bg-organic-light dark:bg-dark-surface rounded-full text-[10px] font-black text-organic-green uppercase tracking-widest">
                Total: {applications.length}
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="p-20 text-center bg-white dark:bg-dark-surface rounded-[3rem] border border-dashed border-organic-green/20">
                <Users size={48} className="mx-auto text-organic-green/20 mb-4" />
                <p className="text-lg font-black text-organic-dark/20 uppercase tracking-widest">No referrals found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {applications.map(app => (
                  <motion.div
                    key={app.id}
                    layoutId={app.id}
                    className="bg-white dark:bg-dark-surface p-8 rounded-[3rem] border border-organic-green/10 shadow-lg space-y-6 group hover:border-organic-green transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          app.type === 'Loan' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                          app.type === 'Card' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-green-50 text-green-600 border-green-100"
                        )}>
                          {app.type} Application
                        </span>
                        <h3 className="text-xl font-black text-organic-dark dark:text-gray-100">{app.userName || app.applicantName || app.name}</h3>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        app.status === 'pending' || !app.status ? "bg-gray-100 text-gray-500" :
                        app.status === 'approved' || app.status === 'resolved' || app.status === 'active' ? "bg-green-100 text-green-600" : 
                        app.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {app.status || 'Pending'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-organic-light/50 dark:bg-dark-bg/50 rounded-2xl space-y-1">
                        <span className="text-[8px] font-black text-organic-dark/20 uppercase tracking-widest">Contact Info</span>
                        <p className="text-[11px] font-bold text-organic-dark truncate">{app.phone || app.mobile || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-organic-light/50 dark:bg-dark-bg/50 rounded-2xl space-y-1">
                        <span className="text-[8px] font-black text-organic-dark/20 uppercase tracking-widest">Applied Date</span>
                        <p className="text-[11px] font-bold text-organic-dark">
                          {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'dd MMM yyyy') : 
                           app.createdAt ? format(new Date(app.createdAt), 'dd MMM yyyy') : '...'}
                        </p>
                      </div>
                      <div className="p-4 bg-organic-light/50 dark:bg-dark-bg/50 rounded-2xl space-y-1">
                        <span className="text-[8px] font-black text-organic-dark/20 uppercase tracking-widest">District</span>
                        <p className="text-[11px] font-bold text-organic-dark uppercase">{app.district || 'Any'}</p>
                      </div>
                      <div className="p-4 bg-organic-light/50 dark:bg-dark-bg/50 rounded-2xl space-y-1">
                        <span className="text-[8px] font-black text-organic-dark/20 uppercase tracking-widest">Reference ID</span>
                        <p className="text-[11px] font-bold text-organic-dark truncate">#{app.id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {app.type === 'Protection' && (
                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="flex-1 py-4 bg-organic-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-organic-green transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                        >
                          <Camera size={16} />
                          {t('update_suraksha')}
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedAppDetails(app)}
                        className="px-6 py-4 bg-organic-light dark:bg-dark-bg text-organic-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-organic-green hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronRight size={16} />
                        Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'installments' ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-organic-dark tracking-tighter uppercase">{t('installment_details')}</h2>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-dark-surface rounded-[3rem] border border-organic-green/10 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-organic-light dark:bg-dark-bg">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-organic-dark/40">Farmer Details</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-organic-dark/40">Installment (কিস্তি)</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-organic-dark/40">Due/Profit (বকেয়া/লাভ)</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-organic-dark/40">Payment Date</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-organic-dark/40">Next Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {installments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-xs font-bold text-organic-dark/20 uppercase tracking-widest">
                        No installment records found
                      </td>
                    </tr>
                  ) : (
                    installments.map(inst => (
                      <tr key={inst.id} className="hover:bg-organic-light/30 transition-colors">
                        <td className="px-8 py-6">
                            <p className="font-bold text-organic-dark">{inst.userName || inst.applicantName || 'Farmer'}</p>
                            <p className="text-[8px] text-organic-dark/40 font-black uppercase tracking-tighter">Loan ID: {inst.loanId}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-organic-green uppercase tracking-tight">Amount: ৳{inst.amount}</p>
                          <p className="text-[8px] text-organic-dark/40 font-black uppercase tracking-tighter">Total Loan: ৳{inst.totalLoan || '50,000'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-red-500">Due: ৳{inst.dueAmount || '0'}</p>
                          <p className="text-[10px] font-bold text-organic-green">Profit: ৳{inst.profit || (parseFloat(inst.amount) * 0.1 || 250)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-organic-dark">{inst.date}</p>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-1 inline-block",
                            inst.status === 'paid' ? "bg-green-100 text-green-600" :
                            inst.status === 'overdue' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {inst.status || 'Received'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="p-3 bg-organic-light/50 rounded-xl">
                            <p className="text-[8px] font-black text-organic-dark/40 uppercase tracking-widest leading-none mb-1">Due: Jun 2026</p>
                            <p className="text-xs font-black text-organic-dark">৳{inst.nextAmount || (parseFloat(inst.amount) || 2500)}</p>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {installments.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-dark-surface rounded-[2rem] border border-dashed border-organic-green/20">
                  <p className="text-xs font-bold text-organic-dark/20 uppercase tracking-widest">No installments</p>
                </div>
              ) : (
                installments.map(inst => (
                  <div key={inst.id} className="p-6 bg-white dark:bg-dark-surface rounded-[2.5rem] border border-organic-green/10 shadow-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-organic-dark text-lg leading-tight">{inst.userName || inst.applicantName}</p>
                        <p className="text-[10px] text-organic-dark/40 font-black uppercase tracking-widest">Loan: {inst.loanId}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                        inst.status === 'paid' ? "bg-green-100 text-green-600" :
                        inst.status === 'overdue' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {inst.status || 'Status'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-organic-light/30 rounded-2xl">
                        <p className="text-[8px] font-black text-organic-dark/40 uppercase tracking-widest mb-1">Installment</p>
                        <p className="font-black text-organic-green">৳{inst.amount}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-2xl">
                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Due Amount</p>
                        <p className="font-black text-red-500">৳{inst.dueAmount || '0'}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-2xl">
                        <p className="text-[8px] font-black text-amber-600/40 uppercase tracking-widest mb-1">Profit/Lav</p>
                        <p className="font-black text-amber-600">৳{inst.profit || (parseFloat(inst.amount) * 0.1 || 250)}</p>
                      </div>
                      <div className="p-3 bg-organic-dark/5 rounded-2xl">
                        <p className="text-[8px] font-black text-organic-dark/40 uppercase tracking-widest mb-1">Date</p>
                        <p className="font-bold text-organic-dark text-xs">{inst.date}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-organic-green/5 rounded-2xl border border-organic-green/10">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[8px] font-black text-organic-green uppercase tracking-widest leading-none mb-1">Next Month Expectation</p>
                          <p className="text-sm font-black text-organic-dark">৳{inst.nextAmount || (parseFloat(inst.amount) || 2500)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-organic-dark/20 uppercase tracking-widest mb-1">Target Date</p>
                          <p className="text-[10px] font-bold text-organic-dark">Jun 15, 2026</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-organic-dark tracking-tighter uppercase">{t('protection_updates')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surakshaUpdates.length === 0 ? (
                <div className="col-span-full p-20 text-center bg-white dark:bg-dark-surface rounded-[3rem] border border-dashed border-organic-green/20">
                  <ShieldCheck size={48} className="mx-auto text-organic-green/20 mb-4" />
                  <p className="text-lg font-black text-organic-dark/20 uppercase tracking-widest">No updates posted yet</p>
                </div>
              ) : (
                surakshaUpdates.map(update => (
                  <div key={update.id} className="bg-white dark:bg-dark-surface rounded-[2.5rem] border border-organic-green/10 shadow-lg overflow-hidden group hover:border-organic-green transition-all">
                    <div className="aspect-video relative overflow-hidden">
                      <img src={update.updatePic} alt="Crop Update" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-organic-dark/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                          {update.cropType}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-organic-green uppercase tracking-widest">{update.userName}</p>
                        <p className="text-[8px] font-bold text-organic-dark/40 uppercase">ID: {update.protectionId}</p>
                      </div>
                      <p className="text-sm font-medium text-organic-dark/70 line-clamp-3 leading-relaxed">
                        {update.details}
                      </p>
                      <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-organic-dark/30 uppercase tracking-widest">{update.date}</span>
                        <div className="w-8 h-8 bg-organic-light rounded-full flex items-center justify-center text-organic-green">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Suraksha Update Modal */}
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] bg-white dark:bg-dark-surface rounded-[4rem] shadow-2xl z-[110] overflow-hidden flex flex-col"
            >
              <div className="bg-organic-dark p-8 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('update_suraksha')}</h3>
                  <p className="text-[10px] font-bold text-organic-green uppercase tracking-widest">{selectedApp.userName}</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-red-500 transition-all"
                >
                  <LogOut className="rotate-180" size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateSuraksha} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">Progress Update (ছবি সহ বিস্তারিত)</label>
                    <textarea 
                      required
                      placeholder="Write update details here..."
                      value={updateContent}
                      onChange={(e) => setUpdateContent(e.target.value)}
                      className="organic-input min-h-[150px] pt-6"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">Image URL (Optional)</label>
                    <div className="relative group">
                      <Camera className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20" size={20} />
                      <input 
                        type="url"
                        placeholder="https://image-url..."
                        value={updateImage}
                        onChange={(e) => setUpdateImage(e.target.value)}
                        className="organic-input pl-14"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="flex-1 py-5 bg-gray-50 dark:bg-dark-bg text-organic-dark/40 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUpdate}
                    className="flex-[2] py-5 bg-organic-green text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-organic-dark transition-all shadow-xl shadow-organic-green/20 flex items-center justify-center gap-3"
                  >
                    {submittingUpdate ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Application Details Modal */}
      <AnimatePresence>
        {selectedAppDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppDetails(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[600px] bg-white dark:bg-dark-surface rounded-[4rem] shadow-2xl z-[130] overflow-hidden flex flex-col"
            >
              <div className="bg-organic-dark p-8 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Application Details</h3>
                  <p className="text-[10px] font-bold text-organic-green uppercase tracking-widest px-2 py-0.5 bg-white/10 rounded-full inline-block">
                    {selectedAppDetails.type}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedAppDetails(null)}
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-red-500 transition-all font-black"
                >
                  ✕
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] organic-scrollbar text-left">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-organic-dark/30 uppercase tracking-widest">Applicant Name</span>
                    <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.userName || selectedAppDetails.applicantName || selectedAppDetails.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-organic-dark/30 uppercase tracking-widest">Mobile Number</span>
                    <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.phone || selectedAppDetails.mobile}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-organic-dark/30 uppercase tracking-widest">Current Status</span>
                    <p className="text-sm font-black text-organic-green uppercase">{selectedAppDetails.status || 'Pending'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-organic-dark/30 uppercase tracking-widest">Applied Date</span>
                    <p className="text-sm font-bold text-organic-dark">
                      {selectedAppDetails.createdAt?.toDate ? format(selectedAppDetails.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : 
                       selectedAppDetails.createdAt ? format(new Date(selectedAppDetails.createdAt), 'dd MMM yyyy') : '...'}
                    </p>
                  </div>
                </div>

                {/* Sub-type specifics */}
                <div className="p-6 bg-organic-light/50 dark:bg-dark-bg/50 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest flex items-center gap-2">
                    <Filter size={12} />
                    Specific Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAppDetails.type === 'Loan' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Loan Amount</span>
                          <p className="text-sm font-bold text-organic-dark">৳{selectedAppDetails.amount}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Purpose</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.purpose || 'Agricultural'}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Protection' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Crop Type</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.cropType}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Village</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.village}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Cold Storage' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Product</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.productType}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Quantity</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.quantity} KG</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Rent Machine' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Machine</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.machineType}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Area</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.area} Bigha</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Training' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Course</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.courseName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Location</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.upazila}, {selectedAppDetails.district}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Hatchery' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Category</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.category}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Contact</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.phone}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Seed Bank' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Seed</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.seedName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Variety</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.variety}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Marketplace' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Item</span>
                          <p className="text-sm font-bold text-organic-dark truncate">{selectedAppDetails.title}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Price</span>
                          <p className="text-sm font-bold text-organic-dark">৳{selectedAppDetails.price}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Soil Test' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">District</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.district}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Upazila</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.upazila}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Hatchery' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Category</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.category}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Species</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.species}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Training' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Topic</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.trainingType}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Fee</span>
                          <p className="text-sm font-bold text-organic-dark uppercase">{selectedAppDetails.feeType}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Cold Storage' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Name</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.name}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Type</span>
                          <p className="text-sm font-bold text-organic-dark uppercase">{selectedAppDetails.adType || 'Free'}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Export' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Exporter</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.exporterName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Country</span>
                          <p className="text-sm font-bold text-organic-dark uppercase">{selectedAppDetails.destinationCountry}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Rent Machine' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Machine</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.machineName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Rate</span>
                          <p className="text-sm font-bold text-organic-dark uppercase">৳{selectedAppDetails.rate}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Livestock Health' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Owner</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.ownerName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Animal</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.animalType}</p>
                        </div>
                      </>
                    )}
                    {selectedAppDetails.type === 'Fish Water Test' && (
                      <>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Owner</span>
                          <p className="text-sm font-bold text-organic-dark">{selectedAppDetails.ownerName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-organic-dark/30 uppercase tracking-widest">Parameters</span>
                          <p className="text-[10px] font-bold text-organic-dark uppercase">{(selectedAppDetails.parameters || []).join(', ')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Details/Description */}
                {(selectedAppDetails.details || selectedAppDetails.description || selectedAppDetails.purpose || selectedAppDetails.symptoms) && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-organic-dark/30 uppercase tracking-widest">Additional Details</span>
                    <p className="text-sm text-organic-dark/70 leading-relaxed bg-organic-light/30 p-4 rounded-2xl border border-organic-green/5 italic">
                      " {selectedAppDetails.details || selectedAppDetails.description || selectedAppDetails.purpose || selectedAppDetails.symptoms} "
                    </p>
                  </div>
                )}

                {/* NID Documents */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12} />
                    Identity Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[8px] font-bold text-organic-dark/40 uppercase text-center">NID Front</p>
                      <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                        {selectedAppDetails.nidFront || selectedAppDetails.nidPic ? (
                          <img src={selectedAppDetails.nidFront || selectedAppDetails.nidPic} alt="NID Front" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={24} /></div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[8px] font-bold text-organic-dark/40 uppercase text-center">NID Back</p>
                      <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                        {selectedAppDetails.nidBack ? (
                          <img src={selectedAppDetails.nidBack} alt="NID Back" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={24} /></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                   <button 
                     onClick={() => setSelectedAppDetails(null)}
                     className="w-full py-5 bg-organic-dark text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-organic-green transition-all shadow-xl"
                   >
                     Close Details
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

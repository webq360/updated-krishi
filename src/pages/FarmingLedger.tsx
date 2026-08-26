import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Plus, Calendar, Tag, FileText, 
  Trash2, Filter, PieChart, ArrowUpRight, ArrowDownLeft,
  X, Check, AlertCircle, Bookmark, DollarSign, Calculator
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { 
  db, auth, collection, addDoc, query, where, onSnapshot, 
  deleteDoc, doc, serverTimestamp, orderBy 
} from '../lib/db';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Entry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  userId: string;
}

const CATEGORIES_EN = [
  'Seeds', 'Fertilizer', 'Labor', 'Equipment', 'Sales', 'Medicine', 'Transport', 'Others'
];

const CATEGORIES_BN = [
  'বীজ', 'সার', 'শ্রমিক', 'যন্ত্রপাতি', 'বিক্রয়', 'ওষুধ', 'পরিবহন', 'অন্যান্য'
];

export default function FarmingLedger() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const CATEGORIES = isBn ? CATEGORIES_BN : CATEGORIES_EN;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Seeds',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'farmingLedger'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Entry[];
      setEntries(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'farmingLedger'), {
        ...formData,
        amount: Number(formData.amount),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setFormData({
        type: 'expense',
        amount: '',
        category: 'Seeds',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      });
    } catch (err) {
      console.error("Error saving ledger entry", err);
    }
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      try {
        await deleteDoc(doc(db, 'farmingLedger', entryToDelete));
        setIsDeleting(false);
        setEntryToDelete(null);
      } catch (err) {
        console.error("Error deleting entry", err);
      }
    }
  };

  // Stats calculation
  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart data Preparation
  const chartData = entries.reduce((acc: any[], entry) => {
    const dateObj = new Date(entry.date);
    const monthIndex = dateObj.getMonth();
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsBn = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলাই', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    const month = isBn ? monthsBn[monthIndex] : monthsEn[monthIndex];
    
    const existing = acc.find(a => a.name === month);
    if (existing) {
      if (entry.type === 'income') existing.income += entry.amount;
      else existing.expense += entry.amount;
    } else {
      acc.push({
        name: month,
        income: entry.type === 'income' ? entry.amount : 0,
        expense: entry.type === 'expense' ? entry.amount : 0
      });
    }
    return acc;
  }, []).reverse();

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const isBn = i18n.language === 'bn';

    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(46, 125, 50); // Organic Green
    doc.text(isBn ? 'কৃষি বন্ধু - জীবন খাতা' : 'Krishi Bondhu - Farming Ledger', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(isBn ? `${currentMonth} এর মাসিক রিপোর্ট` : `Monthly Report - ${currentMonth}`, 14, 30);

    // Summary Section
    doc.setFontSize(12);
    doc.text(isBn ? `মোট আয়: ৳${totalIncome.toLocaleString()}` : `Total Income: ${totalIncome.toLocaleString()} BDT`, 14, 45);
    doc.text(isBn ? `মোট ব্যয়: ৳${totalExpense.toLocaleString()}` : `Total Expense: ${totalExpense.toLocaleString()} BDT`, 14, 52);
    doc.text(isBn ? `বর্তমান স্থিতি: ৳${balance.toLocaleString()}` : `Net Balance: ${balance.toLocaleString()} BDT`, 14, 59);

    const tableData = entries.map(e => [
      format(new Date(e.date), 'yyyy-MM-dd'),
      e.type === 'income' ? (isBn ? 'আয়' : 'Income') : (isBn ? 'ব্যয়' : 'Expense'),
      e.category,
      e.description || '-',
      `${e.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [[isBn ? 'তারিখ' : 'Date', isBn ? 'ধরন' : 'Type', isBn ? 'বিভাগ' : 'Category', isBn ? 'বিবরণ' : 'Description', isBn ? 'পরিমাণ (৳)' : 'Amount (BDT)']],
      body: tableData,
      headStyles: { fillColor: [46, 125, 50] },
      alternateRowStyles: { fillColor: [245, 255, 245] },
    });

    doc.save(`Farming_Ledger_${format(new Date(), 'yyyy_MM')}.pdf`);
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Calculator size={18} />
              {isBn ? 'ডিজিটাল জীবন খাতা' : 'Farming Ledger'}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] text-center px-4">
              {isBn ? 'আপনার ডিজিটাল' : 'YOUR DIGITAL'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(74,222,128,0.3)]">{isBn ? 'জীবন খাতা' : 'LEDGER'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6">
              {isBn ? 'আপনার খামারের আয়-ব্যয়ের হিসাব ও বিশ্লেষণ সহজে পরিচালনা করুন' : 'Manage your farm income, expenses, and financial analysis effortlessly.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="organic-btn bg-organic-green text-white shadow-[0_20px_50px_rgba(74,222,128,0.4)] flex items-center justify-center gap-4 py-4 px-10 group"
            >
              <Plus size={28} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-xl uppercase tracking-widest font-black">{isBn ? 'নতুন এন্ট্রি' : 'New Entry'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF}
              className="organic-btn bg-white text-organic-dark shadow-xl flex items-center justify-center gap-4 py-4 px-10 group"
            >
              <FileText size={28} className="text-organic-green group-hover:scale-110 transition-transform" />
              <span className="text-xl uppercase tracking-widest font-black">{isBn ? 'পিডিএফ রিপোর্ট' : 'Download PDF'}</span>
            </motion.button>
          </div>
        </div>
      </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title={isBn ? 'মোট আয়' : 'Total Income'} 
            value={totalIncome} 
            color="text-emerald-500" 
            subText={isBn ? 'বিক্রয় থেকে লাভ' : 'Profit from sales'}
            icon={<ArrowUpRight size={24} />}
            isBn={isBn}
          />
          <StatCard 
            title={isBn ? 'মোট ব্যয়' : 'Total Expense'} 
            value={totalExpense} 
            color="text-rose-500" 
            subText={isBn ? 'উৎপাদন খরচ' : 'Cost of production'}
            icon={<ArrowDownLeft size={24} />}
            isBn={isBn}
          />
          <StatCard 
            title={isBn ? 'বর্তমান স্থিতি' : 'Balance'} 
            value={balance} 
            color={balance >= 0 ? "text-organic-green" : "text-amber-500"} 
            subText={isBn ? 'নিট সঞ্চয়' : 'Net savings'}
            icon={<DollarSign size={24} />}
            isBn={isBn}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="organic-card p-6 aspect-[16/9] lg:aspect-auto h-[400px]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-organic-green rounded-full" />
                  <h3 className="text-xl font-black text-organic-dark dark:text-gray-100 font-display text-center w-full">
                    {isBn ? 'মাসিক আয়-ব্যয় বিশ্লেষণ' : 'Monthly Analytics'}
                  </h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EEE8" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#4CAF50" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <div className="space-y-6">
              <h3 className="text-3xl font-black text-organic-dark dark:text-gray-100 font-display flex flex-col items-center justify-center gap-4 text-center">
                <Calendar className="text-organic-green w-10 h-10" />
                {isBn ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}
              </h3>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {entries.map((entry) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={entry.id}
                      className="organic-card p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          entry.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600'
                        }`}>
                          {entry.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-organic-dark dark:text-gray-100">{entry.category}</span>
                            <span className="text-[10px] uppercase tracking-tighter px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                              {format(new Date(entry.date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{entry.description || 'No description provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-black text-lg ${
                          entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {entry.type === 'income' ? '+' : '-'}৳{entry.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {entries.length === 0 && !loading && (
                  <div className="text-center py-20 bg-gray-50 dark:bg-dark-surface/30 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-dark-border">
                    <PieChart className="mx-auto mb-4 text-gray-300" size={48} />
                    <p className="text-gray-500">
                      {isBn ? 'এখনো কোনো তথ্য নেই। আপনার কৃষি আর্থিক লেনদেন ট্র্যাক করা শুরু করুন!' : 'No entries yet. Start tracking your farming finances!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Logic/Tips */}
          <div className="space-y-6">
            <motion.div 
               whileHover={{ scale: 1.02 }}
               className="bg-organic-dark p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-organic-green/20 rounded-full -mr-16 -mt-16 blur-3xl" />
              <Bookmark className="text-organic-green mb-4" size={32} />
              <h4 className="text-xl font-bold mb-2">{isBn ? 'সঞ্চয় টিপস' : 'Smart Saving Tip'}</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                {isBn 
                  ? '"মাছের খাবার এক সাথে ৫ বস্তা কিনলে ১০% সাশ্রয় হতে পারে। আপনার চলতি মাসের ব্যয়ের দিকে লক্ষ্য রাখুন।"'
                  : '"Buying 5 bags of fish feed at once can save 10%. Keep an eye on your expenses this month."'}
              </p>
            </motion.div>

            <div className="organic-card p-6 space-y-4">
              <h3 className="font-black text-lg">{isBn ? 'ব্যয়ের ধরন' : 'Category Distribution'}</h3>
              <div className="space-y-3">
                {CATEGORIES.map(cat => {
                  const catEntries = entries.filter(e => e.category === cat);
                  const catTotal = catEntries.reduce((sum, e) => sum + e.amount, 0);
                  const percentage = totalIncome + totalExpense > 0 ? (catTotal / (totalIncome + totalExpense)) * 100 : 0;
                  
                  if (catTotal === 0) return null;

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{cat}</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full bg-organic-green"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-organic-dark/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-10 bg-organic-dark text-white relative flex-shrink-0">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-organic-green/20 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">{isBn ? 'নতুন ডাটা' : 'Add Entry'}</h2>
                <p className="text-organic-green font-black uppercase tracking-widest text-[10px]">{isBn ? 'আয় বা ব্যয়ের রেকর্ড করুন' : 'Record income or expense'}</p>
                <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Type Selector */}
                <div className="flex p-2 bg-gray-100 dark:bg-gray-800 rounded-[2rem] gap-2">
                  {['income', 'expense'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t as any})}
                      className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-wider transition-all ${
                        formData.type === t 
                          ? 'bg-white dark:bg-dark-surface text-organic-dark dark:text-gray-100 shadow-sm' 
                          : 'text-gray-500'
                      }`}
                    >
                      {t === 'income' ? (isBn ? 'আয়' : 'Income') : (isBn ? 'ব্যয়' : 'Expense')}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-4">{isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</label>
                     <input 
                       type="number" 
                       required
                       value={formData.amount}
                       onChange={(e) => setFormData({...formData, amount: e.target.value})}
                       placeholder="0.00"
                       className="organic-input py-4 text-xl" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-4">{isBn ? 'তারিখ' : 'Date'}</label>
                     <input 
                       type="date" 
                       required
                       value={formData.date}
                       onChange={(e) => setFormData({...formData, date: e.target.value})}
                       className="organic-input py-4 text-lg" 
                     />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">{isBn ? 'বিভাগ (Category)' : 'Category'}</label>
                  <select 
                     value={formData.category}
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                     className="organic-input py-4 text-lg appearance-none"
                  >
                    {CATEGORIES.map((cat, i) => <option key={i} value={isBn ? CATEGORIES_EN[i] : cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">{isBn ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}</label>
                  <textarea 
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     placeholder={isBn ? 'এই লেনদেনটি কী জন্য ছিল?' : 'What was this for?'}
                     className="organic-input rounded-[2rem] h-32 pt-4 resize-none text-lg"
                  />
                </div>

                <button className="w-full organic-btn bg-organic-green text-white hover:bg-emerald-600 transition-colors shadow-2xl py-6 rounded-[2.5rem] font-black text-xl uppercase tracking-tighter shadow-organic-green/30">
                  {isBn ? 'এন্ট্রি সংরক্ষণ করুন' : 'Save Entry'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleting(false)}
              className="absolute inset-0 bg-organic-dark/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-sm bg-white dark:bg-dark-surface rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-organic-dark dark:text-white tracking-tighter uppercase">
                  {isBn ? 'ডিলিট করতে চান?' : 'Confirm Delete?'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {isBn 
                    ? 'আপনি কি নিশ্চিত যে আপনি এই এন্ট্রিটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।' 
                    : 'Are you sure you want to remove this entry? This action cannot be undone.'}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30"
                >
                  {isBn ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase"
                >
                  {isBn ? 'না, থাক' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, color, subText, icon }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="organic-card p-6 flex items-center justify-between"
    >
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-tight text-gray-400">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-bold text-gray-400">৳</span>
          <h2 className={`text-3xl font-black ${color}`}>
            {value.toLocaleString()}
          </h2>
        </div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{subText}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color.replace('text', 'bg').replace('500', '100')} dark:bg-opacity-10`}>
        {icon}
      </div>
    </motion.div>
  );
}

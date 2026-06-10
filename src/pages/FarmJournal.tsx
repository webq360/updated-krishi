import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, Plus, Calendar, Tag, FileText, Trash2, Bell, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, Sprout,
  Droplets, Shovel, Scissors, Wheat, ArrowRight, Activity, X
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, where, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../firebase';

interface JournalEntry {
  id: string;
  type: string;
  date: string;
  notes: string;
  completed: boolean;
  createdAt: any;
  userId: string;
}

const activityIcons: Record<string, any> = {
  sowing: Sprout,
  fertilizing: Shovel,
  spraying: Droplets,
  harvesting: Wheat,
  irrigation: Droplets,
  other: FileText
};

export default function FarmJournal() {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'sowing',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'farmJournal'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as JournalEntry);
      });
      setEntries(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'farmJournal'));

    return () => unsubscribe();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'farmJournal'), {
        ...newEntry,
        userId: auth.currentUser.uid,
        completed: false,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewEntry({
        type: 'sowing',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'farmJournal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'farmJournal', id), {
        completed: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `farmJournal/${id}`);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'farmJournal', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `farmJournal/${id}`);
    }
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return entries.filter(entry => !entry.completed && new Date(entry.date) >= today);
  };

  return (
    <div className="space-y-12 pb-32">
      {/* Header Banner */}
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1454165205744-3b78555e5572" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Book size={18} />
              {t('farm_journal')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tighter uppercase leading-[1.1] text-center">
              {i18n.language === 'en' ? 'MY FARM' : 'আমার খামার'} <br />
              <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">{i18n.language === 'en' ? 'RECORDS' : 'রেকর্ডস'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed">
              {t('farm_journal_desc')}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="organic-btn bg-organic-green text-white shadow-[0_20px_50px_rgba(34,197,94,0.4)] flex items-center justify-center gap-6 py-8 px-16 group"
          >
            <Plus size={40} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-3xl uppercase tracking-tighter font-black">{t('add_entry')}</span>
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Statistics or Quick Summary */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Total Tasks', value: entries.length, icon: Calendar, color: 'text-organic-green' },
             { label: 'Pending', value: entries.filter(e => !e.completed).length, icon: Clock, color: 'text-amber-500' },
             { label: 'Completed', value: entries.filter(e => e.completed).length, icon: CheckCircle2, color: 'text-blue-500' },
             { label: 'Success Rate', value: entries.length ? `${Math.round((entries.filter(e => e.completed).length / entries.length) * 100)}%` : '0%', icon: Activity, color: 'text-purple-500' },
           ].map((stat, i) => (
             <div key={i} className="organic-card p-8 flex flex-col items-center gap-3 text-center transition-all bg-white dark:bg-dark-surface border border-organic-green/5 dark:border-white/10">
                <stat.icon className={cn("w-8 h-8", stat.color)} />
                <span className="text-3xl font-black text-organic-dark dark:text-white uppercase tracking-tighter leading-none">{stat.value}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-organic-dark/40 dark:text-gray-500">{stat.label}</span>
             </div>
           ))}
        </div>

        {/* Main Journal List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-organic-green rounded-full shadow-lg" />
             <h2 className="text-3xl font-black text-organic-dark dark:text-white tracking-tighter uppercase">{i18n.language === 'en' ? 'Activities' : 'কার্যক্রমসমূহ'}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-white dark:bg-dark-surface rounded-[2.5rem] animate-pulse border border-organic-green/5 dark:border-white/10" />)}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-dark-surface rounded-[3.5rem] border-2 border-dashed border-organic-green/10 dark:border-white/10 flex flex-col items-center gap-6">
                 <div className="w-20 h-20 bg-organic-light dark:bg-dark-bg rounded-full flex items-center justify-center text-organic-green/20">
                    <Book size={48} />
                 </div>
                 <div className="space-y-2">
                    <p className="text-2xl font-black text-organic-dark dark:text-white uppercase tracking-tight">Your journal is empty</p>
                    <p className="text-sm text-organic-dark/40 dark:text-gray-500 font-bold uppercase tracking-widest">Start recording your farm activities today!</p>
                 </div>
              </div>
            ) : (
              entries.map((entry, index) => {
                const Icon = activityIcons[entry.type] || FileText;
                return (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "organic-card p-10 flex flex-col sm:flex-row items-start sm:items-center gap-8 relative overflow-hidden group bg-white dark:bg-dark-surface border border-organic-green/5 dark:border-white/10",
                      entry.completed && "bg-organic-light/50 dark:bg-dark-bg/50 border-transparent dark:border-transparent opacity-70"
                    )}
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 shrink-0",
                      entry.completed ? "bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600" : "bg-white dark:bg-dark-bg text-organic-green border border-organic-green/10 dark:border-white/10"
                    )}>
                      <Icon size={32} />
                    </div>

                    <div className="flex-grow space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                         <span className="px-5 py-1.5 bg-organic-dark dark:bg-dark-bg text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-opacity group-hover:bg-organic-green">
                           {t(entry.type)}
                         </span>
                         <span className="text-xs font-black text-organic-dark/20 dark:text-gray-600 uppercase tracking-widest">
                           {format(new Date(entry.date), 'dd MMMM, yyyy')}
                         </span>
                      </div>
                      <h3 className={cn(
                        "text-2xl font-black tracking-tight uppercase leading-none",
                        entry.completed ? "text-gray-400 dark:text-gray-600 line-through" : "text-organic-dark dark:text-white"
                      )}>
                        {entry.notes || t(entry.type)}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto pt-6 sm:pt-0 border-t sm:border-t-0 border-organic-green/5 dark:border-white/5">
                      <button
                        onClick={() => toggleComplete(entry.id, entry.completed)}
                        className={cn(
                          "flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md",
                          entry.completed 
                            ? "bg-organic-green text-white" 
                            : "bg-organic-dark dark:bg-dark-bg text-white hover:bg-organic-green"
                        )}
                      >
                        {entry.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                        {entry.completed ? t('completed') : t('mark_done')}
                      </button>
                      <button
                        onClick={() => { if(window.confirm(t('delete_entry'))) deleteEntry(entry.id) }}
                        className="p-4 bg-red-50 dark:bg-red-900/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: Upcoming & Tips */}
        <div className="lg:col-span-4 space-y-12">
          {/* Upcoming Card */}
          <div className="bg-organic-dark rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-organic-green/10 rounded-full -mr-24 -mt-24 blur-3xl transition-transform group-hover:scale-150 duration-700" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-organic-green rounded-2xl flex items-center justify-center shadow-lg shadow-organic-green/20">
                  <Bell size={24} />
                </div>
                <h2 className="text-2xl font-black tracking-tighter uppercase">{t('upcoming_tasks')}</h2>
              </div>

              <div className="space-y-4">
                {getUpcomingTasks().length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/5">
                    <p className="text-green-200/40 text-xs font-black uppercase tracking-widest">{i18n.language === 'en' ? 'No pending tasks' : 'কোন পেন্ডিং কাজ নেই'}</p>
                  </div>
                ) : (
                  getUpcomingTasks().slice(0, 4).map((task) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={task.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-organic-green">{t(task.type)}</span>
                        <div className="flex items-center gap-1.5 text-white/40">
                           <Calendar size={10} />
                           <span className="text-[10px] font-bold">{format(new Date(task.date), 'dd MMM')}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-green-300 transition-colors uppercase tracking-tight">{task.notes || t(task.type)}</p>
                    </motion.div>
                  ))
                )}
              </div>

              <button className="w-full py-5 bg-white text-organic-dark rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-organic-light transition-all shadow-xl">
                 {i18n.language === 'en' ? 'Manage All Tasks' : 'সকল কাজ পরিচালনা করুন'}
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-white dark:bg-dark-surface rounded-[3.5rem] p-10 border border-organic-green/10 dark:border-white/10 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-4 h-full bg-organic-green opacity-5" />
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-organic-green/10 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-organic-green">
                      <AlertCircle size={24} />
                   </div>
                   <h3 className="text-xl font-black text-organic-dark dark:text-white uppercase tracking-tight">
                    {i18n.language === 'en' ? 'Smart Tips' : 'স্মার্ট টিপস'}
                   </h3>
                </div>
                <div className="space-y-6">
                  {[
                    { en: 'Regularly monitor soil moisture levels.', bn: 'নিয়মিত মাটির আর্দ্রতা পরীক্ষা করুন।' },
                    { en: 'Early detection of pests can save 40% yield.', bn: 'বালাইয়ের প্রাথমিক শনাক্তকরণ ৪০% ফলন রক্ষা করে।' }
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-2 h-2 bg-organic-green rounded-full mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                      <p className="text-sm font-medium text-organic-dark/60 dark:text-gray-400 leading-relaxed italic">
                        {i18n.language === 'en' ? tip.en : tip.bn}
                      </p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
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
              className="relative w-full max-w-xl bg-white dark:bg-dark-surface rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-10 bg-organic-dark dark:bg-dark-bg text-white relative flex-shrink-0">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-organic-green/20 rounded-full blur-3xl" />
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">{t('add_entry')}</h2>
                <p className="text-organic-green font-black uppercase tracking-widest text-[10px]">{i18n.language === 'en' ? 'Record farm activity' : 'খামার কার্যক্রম রেকর্ড করুন'}</p>
                <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-organic-dark/40 dark:text-gray-500 uppercase tracking-widest ml-4">{t('activity_type')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.keys(activityIcons).map((type) => {
                      const Icon = activityIcons[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewEntry({ ...newEntry, type })}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all gap-3 group relative overflow-hidden",
                            newEntry.type === type 
                              ? "bg-organic-green/5 border-organic-green text-organic-green" 
                              : "bg-organic-light dark:bg-dark-bg border-transparent text-organic-dark/20 dark:text-gray-600 hover:border-organic-green/20"
                          )}
                        >
                          <Icon size={28} className="relative z-10 transition-transform group-hover:rotate-12" />
                          <span className="text-[10px] font-black uppercase tracking-tighter relative z-10">{t(type)}</span>
                          {newEntry.type === type && <div className="absolute inset-0 bg-organic-green opacity-5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-organic-dark/40 dark:text-gray-500 uppercase tracking-widest ml-4">{t('date')}</label>
                  <div className="relative group">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-green" size={20} />
                    <input 
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="organic-input pl-16 py-5 text-lg dark:bg-dark-bg dark:text-white dark:border-white/10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-organic-dark/40 dark:text-gray-500 uppercase tracking-widest ml-4">{t('notes')}</label>
                  <textarea 
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    placeholder={i18n.language === 'en' ? 'Technical details or observation...' : 'প্রযুক্তিক তথ্য বা পর্যবেক্ষণ লিখুন...'}
                    className="organic-input p-6 min-h-[160px] resize-none text-lg rounded-[2rem] dark:bg-dark-bg dark:text-white dark:border-white/10"
                  />
                </div>

                <div className="flex gap-6 pt-6 pb-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-6 bg-organic-dark text-white rounded-[2.5rem] font-black text-lg uppercase tracking-tighter hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 group"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />}
                    {isSubmitting ? t('submitting') : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={cn("w-6 h-6 animate-spin", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

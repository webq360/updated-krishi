import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, doc, onSnapshot, collection, query, where, handleFirestoreError, OperationType } from '../lib/db';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Info, 
  Sprout, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Stethoscope,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Species {
  name: string;
  category: string;
  subCategory?: string;
  description: string;
  farmingMethod: string;
  stockingDensity: string;
  biosecurity: string;
  imageUrl?: string;
}

interface Disease {
  id: string;
  title: string;
  description: string;
  symptoms: string;
  treatment: string;
}

export default function SpeciesDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [species, setSpecies] = useState<Species | null>(null);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubSpecies = onSnapshot(doc(db, 'species', id), (doc) => {
      if (doc.exists()) {
        setSpecies(doc.data() as Species);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `species/${id}`));

    const q = query(collection(db, 'diseases'), where('speciesId', '==', id));
    const unsubDiseases = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Disease[];
      setDiseases(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'diseases'));

    return () => {
      unsubSpecies();
      unsubDiseases();
    };
  }, [id]);

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-12 animate-pulse">
      <div className="h-96 bg-white dark:bg-dark-surface rounded-[4rem]" />
      <div className="h-64 bg-white dark:bg-dark-surface rounded-[3rem]" />
    </div>
  );
  
  if (!species) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
       <div className="w-24 h-24 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500">
         <AlertTriangle size={48} />
       </div>
       <p className="text-2xl font-black text-organic-dark dark:text-white uppercase tracking-tight">{t('species_not_found')}</p>
       <Link to="/" className="organic-btn bg-organic-green text-white">{t('back_to_home')}</Link>
    </div>
  );

  const sections = [
    { title: t('farming_method'), icon: Sprout, content: species.farmingMethod, color: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' },
    { title: t('stocking_density'), icon: Users, content: species.stockingDensity, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
    { title: t('biosecurity'), icon: ShieldCheck, content: species.biosecurity, color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      <Link 
        to={`/${species.category}`}
        className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-dark-surface rounded-full border border-organic-green/10 dark:border-white/10 text-organic-dark dark:text-gray-100 font-black text-xs uppercase tracking-widest hover:bg-organic-green hover:text-white transition-all shadow-sm"
      >
        <ArrowLeft size={16} />
        {i18n.language === 'en' ? `Back to ${t(species.category)}` : `${t(species.category)} এ ফিরে যান`}
      </Link>

      <header className="relative h-[450px] sm:h-[650px] rounded-[5rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center">
        <img 
          src={species.imageUrl || `https://picsum.photos/seed/${species.name}/1200/800`} 
          alt={species.name}
          className="w-full h-full absolute inset-0 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-organic-dark via-organic-dark/60 to-organic-dark/40" />
        <div className="relative z-10 p-12 sm:p-24 flex flex-col items-center space-y-10 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <span className="px-6 py-2.5 bg-organic-green text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_12px_24px_-8px_rgba(76,175,80,0.5)]">
              {t(species.category)}
            </span>
            {species.subCategory && (
              <span className="px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 text-white">
                {species.subCategory}
              </span>
            )}
          </motion.div>
          
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[10vw] sm:text-9xl font-black tracking-tighter uppercase leading-[1.1] text-white break-words"
            >
              {species.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed uppercase tracking-tight font-bold italic"
            >
              {species.description}
            </motion.p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sections.map((section, i) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="organic-card p-10 space-y-6"
          >
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner", section.color)}>
              <section.icon size={32} />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black text-organic-dark dark:text-white uppercase tracking-wide">{section.title}</h3>
              <p className="text-organic-dark/60 dark:text-gray-400 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                {section.content || (i18n.language === 'en' ? 'Information coming soon...' : 'তথ্য শীঘ্রই আসছে...')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {diseases.length > 0 && (
        <section className="space-y-10 pt-10">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-4xl font-black text-organic-dark dark:text-white tracking-tighter uppercase">
              {t('diseases')}
            </h2>
            <div className="flex-grow h-[2px] bg-gradient-to-r from-red-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-8">
            {diseases.map((disease, idx) => (
              <motion.div 
                key={disease.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-dark-surface rounded-[3.5rem] p-10 sm:p-16 border border-red-500/10 dark:border-white/5 shadow-xl hover:shadow-red-500/5 transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 dark:bg-red-500/10 rounded-bl-[6rem] group-hover:bg-red-500/10 transition-colors" />
                
                <h3 className="text-3xl font-black text-red-700 dark:text-red-400 mb-10 tracking-tight uppercase relative inline-block">
                  {disease.title}
                  <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-red-500/20 rounded-full" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                      <Stethoscope size={20} />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em]">{t('symptoms')}</h4>
                    </div>
                    <p className="text-organic-dark/70 dark:text-gray-300 leading-relaxed font-medium text-lg whitespace-pre-wrap">{disease.symptoms}</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-organic-green">
                      <ShieldCheck size={20} />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em]">{t('treatment')}</h4>
                    </div>
                    <p className="text-organic-dark/70 dark:text-gray-300 leading-relaxed font-medium text-lg whitespace-pre-wrap">{disease.treatment}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Advice Banner */}
      <section className="bg-organic-green rounded-[4rem] p-12 sm:p-20 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-none">
              {i18n.language === 'en' ? 'Need Expert Help?' : 'বিশেষজ্ঞের পরামর্শ প্রয়োজন?'}
            </h2>
            <p className="text-xl text-white/80 font-medium">
              {i18n.language === 'en' 
                ? 'Chat with our agricultural experts for personalized advice and more detailed and technical farming guide.' 
                : 'ব্যক্তিগত পরামর্শ এবং আরও বিস্তারিত এবং প্রযুক্তিগত চাষাবাদ নির্দেশিকার জন্য আমাদের কৃষি বিশেষজ্ঞদের সাথে চ্যাট করুন।'}
            </p>
          </div>
          <Link 
            to="/chat-expert" 
            className="organic-btn bg-white text-organic-green shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 w-full md:w-auto"
          >
            <span className="text-lg uppercase tracking-widest">{t('expert_chat')}</span>
            <ChevronRight size={24} />
          </Link>
        </div>
      </section>
    </div>
  );
}

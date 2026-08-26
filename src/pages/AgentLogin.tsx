import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, ArrowRight, Loader2, AlertCircle, 
  ShieldCheck, BadgeCheck, Users, LayoutDashboard
} from 'lucide-react';
import { db, auth, collection, query, where, getDocs, doc, updateDoc } from '../lib/db';
import { cn } from '../lib/utils';
import { safeLocalStorage } from '../lib/storage';

export default function AgentLogin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Hardcoded Demo Account for Testing
    if (agentId.toUpperCase() === 'KB-AGENT-77' && password === '7755') {
      const demoAgent = {
        agentId: 'KB-AGENT-77',
        name: 'Demo Agent',
        phone: '01700-000000', // Real agent phone placeholder instead of hotline
        status: 'active',
        role: 'agent',
        shopName: 'Krishi Bondhu Demo Shop'
      };

      // We just save to storage and navigate. 
      // Security rules will handle data access based on the logged-in user (if any).
      // For demo, we assume the user is trying to see the UI.
      safeLocalStorage.setItem('agentData', JSON.stringify({
        ...demoAgent,
        id: 'demo-agent-id',
        uid: auth.currentUser?.uid || 'demo-user-uid'
      }));
      
      navigate('/agent-dashboard', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'agents'), 
        where('agentId', '==', agentId.toUpperCase()),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const agentDoc = querySnapshot.docs[0];
        const agentData = agentDoc.data();
        
        if (agentData.status === 'suspended') {
          setError(i18n.language === 'en' ? 'Your agent account is suspended.' : 'আপনার এজেন্ট অ্যাকাউন্ট স্থগিত করা হয়েছে।');
          return;
        }

        const currentUser = auth.currentUser;
        const uid = currentUser?.id || currentUser?.uid || agentDoc.id;

        await updateDoc(doc(db, 'agents', agentDoc.id), {
          currentSessionUid: uid,
          lastLogin: new Date().toISOString()
        });
        
        safeLocalStorage.setItem('agentData', JSON.stringify({
          ...agentData,
          id: agentDoc.id,
          uid: uid
        }));
        safeLocalStorage.setItem('user', JSON.stringify({
          id: agentDoc.id,
          name: agentData.name || 'Agent',
          role: 'agent',
          agentId: agentData.agentId
        }));
        safeLocalStorage.setItem('isUser', 'true');
        navigate('/agent-dashboard');
      } else {
        setError(t('incorrect_agent_id'));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(i18n.language === 'en' ? 'An error occurred. Please try again.' : 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-dark-surface rounded-[4rem] shadow-2xl border border-organic-green/10 overflow-hidden"
      >
        <div className="bg-organic-dark p-12 text-center space-y-4">
          <div className="w-20 h-20 flex items-center justify-center mx-auto shadow-xl shadow-organic-green/20">
            <img src="/krishi_logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{t('agent_login')}</h2>
            <p className="text-green-50/40 text-xs font-black uppercase tracking-widest">{t('agent_panel')}</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('agent_id')}</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                <input
                  type="text" required
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="organic-input pl-14"
                  placeholder={t('agent_id_placeholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-organic-dark/40 ml-4">{t('password')}</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-organic-dark/20 group-focus-within:text-organic-green transition-colors" size={20} />
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="organic-input pl-14"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "organic-btn w-full bg-organic-green text-white shadow-xl flex items-center justify-center gap-3",
              loading && "opacity-70 pointer-events-none"
            )}
          >
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
            <span className="text-xl uppercase tracking-tighter">{t('login')}</span>
          </button>

          <div className="pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] font-black text-organic-dark/40 uppercase tracking-widest mb-4">
              {i18n.language === 'en' ? "Don't have an agent account?" : "এজেন্ট অ্যাকাউন্ট নেই?"}
            </p>
            <button 
              type="button"
              onClick={() => navigate('/agent-registration')}
              className="text-organic-green hover:scale-105 transition-transform flex items-center gap-2 mx-auto text-xs font-black uppercase tracking-widest"
            >
              <Users size={16} />
              {t('apply_now')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Users, Plus, Search, ThumbsUp, MessageCircle, Share2, User, Loader2, X, Send } from 'lucide-react';
import { 
  db, auth, collection, onSnapshot, query, orderBy, 
  addDoc, serverTimestamp, updateDoc, doc, increment, 
  handleFirestoreError, OperationType 
} from '../lib/db';
import { cn } from '../lib/utils';

export default function CommunityForum() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });

  useEffect(() => {
    const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'forumPosts'));
    return () => unsub();
  }, []);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.id || user.uid || user._id;
    
    try {
      await addDoc(collection(db, 'forumPosts'), {
        ...newPost,
        authorId: uid,
        authorName: user.name || user.displayName || user.email?.split('@')[0] || (i18n.language === 'en' ? 'Farmer' : 'কৃষক বন্ধু'),
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewPost({ title: '', content: '', category: 'General' });
    } catch (err) {
      console.error("Add post error:", err);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const categories = ['General', 'Crops', 'Livestock', 'Poultry', 'Fisheries', 'Success Stories'];

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4CAF50]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1543269664-76bc3997d9ea" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              {t('community_forum')}
            </div>
            <h1 className="text-[10vw] sm:text-8xl font-black tracking-tight uppercase leading-[1.1] text-center">
              {i18n.language === 'en' ? 'FARM DISCUSSION' : 'কৃষি আলোচনা'}
            </h1>
            <div className="h-2 w-24 bg-organic-green mx-auto rounded-full mt-4" />
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-xl sm:text-2xl leading-relaxed mt-6">
              {i18n.language === 'en' 
                ? 'Share your farming experiences, ask questions, and learn from fellow farmers across Bangladesh.' 
                : 'আপনার চাষাবাদের অভিজ্ঞতা শেয়ার করুন, প্রশ্ন করুন এবং সারাদেশের কৃষকদের কাছ থেকে শিখুন।'}
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-12 py-6 bg-organic-green text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-organic-green/90 transition-all shadow-[0_20px_50px_rgba(34,197,94,0.3)] hover:-translate-y-1 flex items-center gap-4 mt-8"
            >
              <Plus size={28} />
              {i18n.language === 'en' ? 'START DISCUSSION' : 'নতুন আলোচনা'}
            </button>
          </div>
        </div>
        <MessageSquare className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 -rotate-12 blur-3xl" />
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8BA88B]" size={20} />
          <input
            type="text"
            placeholder={i18n.language === 'en' ? 'Search discussions...' : 'আলোচনা খুঁজুন...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-surface rounded-2xl border border-[#E0E8E0] dark:border-white/10 focus:border-[#4CAF50] outline-none transition-all shadow-sm text-organic-dark dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-surface rounded-[2rem] border border-[#E0E8E0] dark:border-white/10 p-6 sm:p-8 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F5F0] dark:bg-dark-bg flex items-center justify-center text-[#4CAF50] font-bold">
                  {post.authorName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-[#1B301B] dark:text-white">{post.authorName}</h4>
                  <p className="text-[10px] text-[#8BA88B] dark:text-gray-500 font-bold uppercase tracking-widest">
                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now')}
                  </p>
                </div>
                <div className="ml-auto px-3 py-1 bg-[#E8F5E9] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {post.category}
                </div>
              </div>

              <h3 className="text-xl font-black text-[#1B301B] dark:text-white mb-4 group-hover:text-[#4CAF50] transition-colors leading-tight uppercase tracking-tight">
                {post.title}
              </h3>
              <p className="text-[#556B55] dark:text-gray-400 leading-relaxed mb-8">
                {post.content}
              </p>

              <div className="flex items-center gap-6 pt-6 border-t border-[#F0F5F0] dark:border-white/5">
                <button 
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-[#556B55] dark:text-gray-400 hover:text-[#4CAF50] transition-colors font-bold text-sm"
                >
                  <ThumbsUp size={18} />
                  {post.likes}
                </button>
                <button className="flex items-center gap-2 text-[#556B55] dark:text-gray-400 hover:text-[#4CAF50] transition-colors font-bold text-sm">
                  <MessageCircle size={18} />
                  {post.comments}
                </button>
                <button className="flex items-center gap-2 text-[#556B55] dark:text-gray-400 hover:text-[#4CAF50] transition-colors font-bold text-sm ml-auto">
                  <Share2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 border border-[#E0E8E0] dark:border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-[#1B301B] dark:text-white mb-6 flex items-center gap-2">
              <ThumbsUp className="text-[#4CAF50]" size={20} />
              {i18n.language === 'en' ? 'Popular Categories' : 'জনপ্রিয় ক্যাটাগরি'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  className="px-4 py-2 bg-[#F9FBF9] dark:bg-dark-bg text-[#556B55] dark:text-gray-400 rounded-xl text-xs font-bold border border-[#E0E8E0] dark:border-white/10 hover:border-[#4CAF50] hover:text-[#4CAF50] transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#4CAF50] rounded-[2.5rem] p-8 text-white shadow-xl shadow-green-900/20">
            <h3 className="text-xl font-bold mb-4">{i18n.language === 'en' ? 'Forum Rules' : 'ফোরামের নিয়মাবলী'}</h3>
            <ul className="space-y-3 text-sm text-green-50/80">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
                {i18n.language === 'en' ? 'Be respectful to fellow farmers.' : 'অন্যান্য কৃষকদের প্রতি শ্রদ্ধাশীল থাকুন।'}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
                {i18n.language === 'en' ? 'Share only authentic agricultural info.' : 'শুধুমাত্র সঠিক কৃষি তথ্য শেয়ার করুন।'}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shrink-0" />
                {i18n.language === 'en' ? 'Avoid spamming or irrelevant posts.' : 'স্প্যাম বা অপ্রাসঙ্গিক পোস্ট এড়িয়ে চলুন।'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Post Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#1B301B]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#1B301B] dark:text-white uppercase tracking-tight leading-none">
                  {i18n.language === 'en' ? 'Start Discussion' : 'আলোচনা শুরু করুন'}
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-[#F0F5F0] dark:hover:bg-white/10 rounded-full transition-colors text-organic-dark dark:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddPost} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Title</label>
                  <input
                    required
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                    placeholder="What's on your mind?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none text-organic-dark dark:text-white"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#556B55] dark:text-gray-400 uppercase tracking-widest ml-2">Content</label>
                  <textarea
                    required
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full px-6 py-4 bg-[#F9FBF9] dark:bg-dark-bg border border-[#E0E8E0] dark:border-white/10 rounded-2xl focus:border-[#4CAF50] outline-none h-32 resize-none text-organic-dark dark:text-white"
                    placeholder="Share your experience in detail..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#4CAF50] text-white font-bold rounded-2xl hover:bg-[#43A047] transition-all shadow-xl shadow-green-900/20 mt-4 flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  {i18n.language === 'en' ? 'Post Discussion' : 'পোস্ট করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

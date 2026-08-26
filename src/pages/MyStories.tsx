import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  Image as ImageIcon, 
  Send, 
  User, 
  Clock, 
  MoreVertical,
  Trash2,
  Loader2,
  Camera
} from 'lucide-react';
import { 
  auth, db, collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, increment, deleteDoc, setDoc, getDoc,
  handleFirestoreError, OperationType 
} from '../lib/db';
import { compressBase64, uploadToCloudinary } from '../lib/imageUtils';
import { cn } from '../lib/utils';

interface Story {
  id: string;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: any;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
}

export default function MyStories() {
  const { t, i18n } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  const [newStory, setNewStory] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      setStories(storyData);

      // Handle scrolling to shared story
      const urlParams = new URLSearchParams(window.location.search);
      const storyId = urlParams.get('id');
      if (storyId) {
        setTimeout(() => {
          const element = document.getElementById(`story-${storyId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-[#4CAF50]', 'ring-offset-4');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-[#4CAF50]', 'ring-offset-4');
            }, 3000);
          }
        }, 500);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stories'));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.id || user.uid || user._id;
    
    // Listen to user reactions
    const unsubscribes: (() => void)[] = [];

    stories.forEach(story => {
      const reactionRef = doc(db, 'stories', story.id, 'reactions', uid);
      const unsub = onSnapshot(reactionRef, (d) => {
        setUserReactions(prev => ({
          ...prev,
          [story.id]: d.exists()
        }));
      }, (err) => handleFirestoreError(err, OperationType.GET, `stories/${story.id}/reactions/${uid}`));
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(u => u());
  }, [stories.length]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const uploadedUrl = await uploadToCloudinary(file, 'krishi-stories');
        setImagePreview(uploadedUrl);
      } catch (err) {
        console.error("Story image upload error:", err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handlePostStory = async () => {
    const user = auth.currentUser;
    if (!user || (!newStory.trim() && !imagePreview)) return;
    const uid = user.id || user.uid || user._id;
    
    setIsPosting(true);
    try {
      const storyData: any = {
        userId: uid,
        userName: user.name || user.displayName || user.email?.split('@')[0] || 'Farmer',
        content: newStory,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      };

      if (imagePreview) {
        storyData.imageUrl = imagePreview;
      }

      await addDoc(collection(db, 'stories'), storyData);
      setNewStory('');
      setImagePreview(null);
    } catch (error) {
      console.error('Error posting story:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (storyId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.id || user.uid || user._id;
    
    const reactionRef = doc(db, 'stories', storyId, 'reactions', uid);
    const storyRef = doc(db, 'stories', storyId);
    
    if (userReactions[storyId]) {
      await deleteDoc(reactionRef);
      await updateDoc(storyRef, { likesCount: increment(-1) });
    } else {
      await setDoc(reactionRef, {
        userId: uid,
        storyId,
        timestamp: serverTimestamp()
      });
      await updateDoc(storyRef, { likesCount: increment(1) });
    }
  };

  const toggleComments = (storyId: string) => {
    if (activeComments === storyId) {
      setActiveComments(null);
    } else {
      setActiveComments(storyId);
      // Fetch comments
      const q = query(collection(db, 'stories', storyId, 'comments'), orderBy('createdAt', 'asc'));
      onSnapshot(q, (snapshot) => {
        const commentData = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Comment[];
        setComments(prev => ({ ...prev, [storyId]: commentData }));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `stories/${storyId}/comments`));
    }
  };

  const handleAddComment = async (storyId: string) => {
    const user = auth.currentUser;
    if (!user || !newComment.trim()) return;
    const uid = user.id || user.uid || user._id;
    
    try {
      await addDoc(collection(db, 'stories', storyId, 'comments'), {
        userId: uid,
        userName: user.name || user.displayName || user.email?.split('@')[0] || 'Farmer',
        content: newComment,
        storyId,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'stories', storyId), {
        commentsCount: increment(1)
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async (story: Story) => {
    const shareData = {
      title: 'Farmer Story - ' + story.userName,
      text: story.content.substring(0, 100) + '...',
      url: window.location.origin + '/my-stories?id=' + story.id
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert(i18n.language === 'en' ? 'Link copied to clipboard!' : 'লিঙ্ক কপি করা হয়েছে!');
      } catch (err) {
        console.error('Error copying link:', err);
      }
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#1B301B]">আমার চাষ গল্প</h1>
        <p className="text-[#556B55]">আপনার খামারের সফলতার গল্প সবার সাথে শেয়ার করুন</p>
      </header>

      {/* Post Creation */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E0E8E0]">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
            <User size={20} />
          </div>
          <div className="flex-1 space-y-4">
            <textarea
              value={newStory}
              onChange={(e) => setNewStory(e.target.value)}
              placeholder="আজ আপনার খামারে কী হলো?"
              className="w-full bg-[#F9FBF9] rounded-2xl p-4 border border-[#E0E8E0] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all resize-none min-h-[100px]"
            />
            
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-[#E0E8E0]">
                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-cover" />
                <button 
                  onClick={() => { setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#F0F5F0] text-[#2E7D32] rounded-xl cursor-pointer hover:bg-[#E8F5E9] transition-all">
                <Camera size={18} />
                <span className="text-sm font-medium">
                  {isCompressing ? 'কম্প্রেস হচ্ছে...' : 'ছবি যুক্ত করুন'}
                </span>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
              
              <button
                onClick={handlePostStory}
                disabled={isPosting || isCompressing || (!newStory.trim() && !imagePreview)}
                className="flex items-center gap-2 px-6 py-2 bg-[#4CAF50] text-white rounded-xl hover:bg-[#43A047] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#4CAF50]/20"
              >
                {isPosting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                <span className="font-medium">পোস্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Feed */}
      <div className="space-y-6">
        {stories.map((story) => (
          <motion.div
            key={story.id}
            id={`story-${story.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-[#E0E8E0] overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] font-bold">
                    {story.userName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1B301B]">{story.userName}</h3>
                    <div className="flex items-center gap-1 text-xs text-[#8BA88B]">
                      <Clock size={12} />
                      <span>{story.createdAt?.toDate ? story.createdAt.toDate().toLocaleDateString() : (story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Just now')}</span>
                    </div>
                  </div>
                </div>
                {((auth.currentUser?.id === story.userId || auth.currentUser?.uid === story.userId || auth.currentUser?._id === story.userId) || sessionStorage.getItem('isAdmin') === 'true') && (
                  <button 
                    onClick={() => handleDeleteStory(story.id)}
                    className="p-2 text-[#8BA88B] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <p className="text-[#2D3A2D] whitespace-pre-wrap leading-relaxed">
                {story.content}
              </p>

              {story.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-[#F0F5F0]">
                  <img 
                    src={story.imageUrl} 
                    alt="Story" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-[#F0F5F0]">
                <button 
                  onClick={() => handleLike(story.id)}
                  className={cn(
                    "flex items-center gap-2 transition-all",
                    userReactions[story.id] ? "text-red-500" : "text-[#556B55] hover:text-red-500"
                  )}
                >
                  <Heart size={20} fill={userReactions[story.id] ? "currentColor" : "none"} />
                  <span className="text-sm font-medium">{story.likesCount}</span>
                </button>
                <button 
                  onClick={() => toggleComments(story.id)}
                  className={cn(
                    "flex items-center gap-2 transition-all",
                    activeComments === story.id ? "text-[#4CAF50]" : "text-[#556B55] hover:text-[#4CAF50]"
                  )}
                >
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">{story.commentsCount}</span>
                </button>
                <button 
                  onClick={() => handleShare(story)}
                  className="flex items-center gap-2 text-[#556B55] hover:text-blue-500 transition-all ml-auto"
                >
                  <Share2 size={20} />
                  <span className="text-sm font-medium">{i18n.language === 'en' ? 'Share' : 'শেয়ার'}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {activeComments === story.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#F9FBF9] border-t border-[#E0E8E0]"
                >
                  <div className="p-6 space-y-4">
                    <div className="space-y-4">
                      {comments[story.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-[#E0E8E0] flex items-center justify-center text-[#2E7D32] text-xs font-bold shrink-0">
                            {comment.userName[0].toUpperCase()}
                          </div>
                          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-[#E0E8E0]">
                            <h4 className="text-xs font-bold text-[#1B301B] mb-1">{comment.userName}</h4>
                            <p className="text-sm text-[#2D3A2D]">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="মন্তব্য লিখুন..."
                        className="flex-1 bg-white rounded-xl px-4 py-2 border border-[#E0E8E0] text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(story.id)}
                      />
                      <button 
                        onClick={() => handleAddComment(story.id)}
                        disabled={!newComment.trim()}
                        className="p-2 bg-[#4CAF50] text-white rounded-xl hover:bg-[#43A047] disabled:opacity-50 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

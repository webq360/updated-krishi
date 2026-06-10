import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { ShoppingBag, ExternalLink, CheckCircle2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string;
  imageUrl?: string;
  orderLink?: string;
}

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <header className="text-center max-w-4xl mx-auto space-y-8 py-10">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-green-50 dark:bg-green-900/10 text-[#2E7D32] dark:text-green-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-green-100 dark:border-green-900/30">
          <ShoppingBag size={18} />
          {t('our_products')}
        </div>
        <h1 className="text-4xl sm:text-7xl font-black text-organic-dark dark:text-white uppercase tracking-tighter leading-none">
          {t('products_title')}
        </h1>
        <p className="text-xl sm:text-2xl text-organic-dark/60 dark:text-gray-400 font-bold max-w-2xl mx-auto italic leading-relaxed">
          {t('products_desc')}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="h-96 bg-white rounded-3xl animate-pulse border border-[#E0E8E0]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden border border-[#E0E8E0] hover:border-[#4CAF50] hover:shadow-2xl hover:shadow-green-900/5 transition-all group"
            >
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 aspect-square lg:aspect-auto relative overflow-hidden bg-[#F0F5F0]">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.name}/800/800`} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="lg:w-1/2 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100 italic">
                         {product.category}
                       </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{product.name}</h3>
                    <p className="text-[#556B55] mb-6 leading-relaxed">{product.description}</p>
                    
                    <div className="space-y-3 mb-8">
                      <h4 className="text-sm font-bold text-[#4CAF50] uppercase tracking-wider">{t('benefits')}</h4>
                      {product.benefits?.split('\n').map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[#2D3A2D]">
                          <CheckCircle2 size={18} className="text-[#4CAF50] shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a 
                    href={product.orderLink || "https://www.absfeed.com"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-[#4CAF50] text-white rounded-2xl font-bold hover:bg-[#43A047] transition-all shadow-lg shadow-[#4CAF50]/20"
                  >
                    {t('order_now')}
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E0E8E0]">
          <p className="text-[#556B55]">No products available at the moment.</p>
        </div>
      )}

      <footer className="bg-[#2E7D32] rounded-3xl p-12 text-white text-center space-y-6">
        <h2 className="text-3xl font-bold">Need a Custom Feed Solution?</h2>
        <p className="text-green-50/80 max-w-xl mx-auto">
          Contact our experts for personalized nutritional advice. ABS FEED INDUSTRIES LIMITED is here to help you grow.
        </p>
        <a 
          href="https://www.absfeed.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#2E7D32] rounded-2xl font-bold hover:bg-green-50 transition-colors"
        >
          Visit absfeed.com
          <ExternalLink size={20} />
        </a>
      </footer>
    </div>
  );
}

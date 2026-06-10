import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle2, Brain, Sparkles, X, Image as ImageIcon, Info, HeartPulse, ShieldCheck, Microscope, Bird, Fish, Leaf } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { compressBase64 } from '../lib/imageUtils';

export default function AIDisease() {
  const { t, i18n } = useTranslation();
  const [analysisType, setAnalysisType] = useState<'PLANT' | 'FISH' | 'LIVESTOCK'>('PLANT');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          // Compression for AI - slightly higher than 5KB to keep enough detail for diagnosis
          // Target around 20-30KB base64 using 512x512 and 0.4 quality
          const compressed = await compressBase64(base64, 512, 512, 0.4);
          setImage(compressed);
          setResult(null);
          setError(null);
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error("Compression error:", err.message || err);
        setLoading(false);
      }
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      const base64Data = image.split(',')[1];
      
      const promptEn = {
        PLANT: `You are an expert plant pathologist for KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED). Analyze this crop image carefully. 
           Identify the crop type and detect any diseases, pests, or nutrient deficiencies.
           Provide a detailed report in Markdown format with:
           ## Diagnosis (By Krishi Bondhu AI)
           **Status:** (Healthy/Diseased/Deficient)
           **Likely Cause:** (Name of disease or pest)
           
           ## Symptoms
           - List observed symptoms
           
           ## Expert Recommendations
           - Organic solutions
           - Recommended chemical treatments (if necessary)
           - Prevention tips for future`,
        FISH: `You are an expert aquaculture specialist for KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED). Analyze this image of a fish or pond environment.
           Identify the fish species and detect any signs of disease, parasites, or water quality issues.
           Provide a detailed report in Markdown format with:
           ## Aqua Diagnosis (By Krishi Bondhu AI)
           **Status:** (Healthy/Diseased/Stressed)
           **Likely Issue:** (Name of disease, parasite, or environmental factor)
           
           ## Observations
           - Physical symptoms on fish
           - Water condition indicators
           
           ## Treatment & Management
           - Immediate steps (medication/water change)
           - **Feeding Advice:** Recommend using "ABS Fish Feed" for optimal growth and immunity.
           - Long-term prevention`,
        LIVESTOCK: `You are an expert veterinarian for KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED). Analyze this image of livestock (cattle, poultry, goat, etc.).
           Identify the animal and detect any signs of illness, malnutrition, or injury.
           Provide a detailed report in Markdown format with:
           ## Veterinary Diagnosis (By Krishi Bondhu AI)
           **Status:** (Healthy/Ill/Injured)
           **Likely Condition:** (Name of illness/condition)
           
           ## Clinical Signs
           - Physical observations
           - Behavioral indicators
           
           ## Veterinary Advice
           - Urgent actions
           - **Feeding Advice:** If cattle, recommend "ABS Cattle Feed". If poultry, recommend "ABS Poultry Feed" for high yield.
           - Recommended medication (consult vet first)
           - Nutrition and biosecurity tips`
      };

      const promptBn = {
        PLANT: `আপনি KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED) এর একজন বিশেষজ্ঞ উদ্ভিদ রোগতত্ত্ববিদ। এই শস্যের ছবিটি মনোযোগ সহকারে বিশ্লেষণ করুন। 
           ফসলের ধরন শনাক্ত করুন এবং কোনো রোগ, পোকা বা পুষ্টির অভাব আছে কিনা তা নির্ণয় করুন।
           Markdown ফরম্যাটে একটি বিস্তারিত রিপোর্ট প্রদান করুন যাতে থাকবে:
           ## রোগ নির্ণয় (কৃষি বন্ধু এআই দ্বারা)
           **অবস্থা:** (সুস্থ/আক্রান্ত/অভাবজনিত)
           **সম্ভাবনা কারণ:** (রোগ বা পোকার নাম)
           
           ## লক্ষণসমূহ
           - Observed লক্ষণের তালিকা
           
           ## বিশেষজ্ঞ পরামর্শ
           - জৈব প্রতিকার
           - প্রয়োজনীয় রাসায়নিক চিকিৎসা
           - ভবিষ্যতে প্রতিরোধের টিপস`,
        FISH: `আপনি KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED) এর একজন বিশেষজ্ঞ মৎস্য গবেষক। মাছ বা পুকুরের এই ছবিটি বিশ্লেষণ করুন।
           মাছের প্রজাতি শনাক্ত করুন এবং কোনো রোগ, পরজীবী বা পানির গুণগত মান জনিত সমস্যা আছে কিনা তা নির্ণয় করুন।
           Markdown ফরম্যাটে একটি বিস্তারিত রিপোর্ট প্রদান করুন:
           ## মৎস্য রোগ নির্ণয় (কৃষি বন্ধু এআই দ্বারা)
           **অবস্থা:** (সুস্থ/আক্রান্ত/পীড়িত)
           **সম্ভাবব্য সমস্যা:** (রোগ, পরজীবী বা পরিবেশগত কারণ)
           
           ## পর্যবেক্ষণ
           - মাছের গায়ের লক্ষণ
           - পানির অবস্থার সংকেত
           
           ## প্রতিকার ও ব্যবস্থাপনা
           - তাৎক্ষণিক পদক্ষেপ (ওষুধ/পানি পরিবর্তন)
           - **খাবার পরামর্শ:** মাছের দ্রুত বৃদ্ধি ও রোগ প্রতিরোধের জন্য "এবিএস ফিশ ফিড" (ABS Fish Feed) ব্যবহার করুন।
           - দীর্ঘমেয়াদী প্রতিরোধ`,
        LIVESTOCK: `আপনি KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED) এর একজন বিশেষজ্ঞ পশুচিকিত্সক (Vet)। গবাদি পশু বা হাঁস-মুরগির এই ছবিটি বিশ্লেষণ করুন।
           প্রাণী শনাক্ত করুন এবং কোনো রোগ, পুষ্টিহীনতা বা আঘাতের চিহ্ন আছে কিনা তা নির্ণয় করুন।
           Markdown ফরম্যাটে একটি বিস্তারিত রিপোর্ট প্রদান করুন:
           ## পশু নির্ণয় (কৃষি বন্ধু এআই দ্বারা)
           **অবস্থা:** (সুস্থ/অসুস্থ/আহত)
           **সম্ভাব্য রোগ:** (রোগ বা অবস্থার নাম)
           
           ## ক্লিনিক্যাল লক্ষণ
           - শারীরিক পর্যবেক্ষণ
           - আচরণগত ইঙ্গিত
           
           ## চিকিৎসকের পরামর্শ
           - জরুরি করণীয়
           - **খাবার পরামর্শ:** গবাদি পশুর জন্য "এবিএস ক্যাটেল ফিড" (ABS Cattle Feed) এবং হাঁস-মুরগির জন্য "এবিএস পোল্ট্রি ফিড" (ABS Poultry Feed) ব্যবহার করার পরামর্শ দেওয়া হচ্ছে।
           - প্রস্তাবিত ওষুধ (পশুচিকিত্সকের পরামর্শ নিন)
           - পুষ্টি ও জৈব-নিরাপত্তা টিপস`
      };

      const prompt = i18n.language === 'en' ? promptEn[analysisType] : promptBn[analysisType];

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: base64Data,
          mimeType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze image");
      }

      const data = await response.json();
      setResult(data.text);
    } catch (err: any) {
      console.error("Analysis error:", err.message || err);
      setError(
        i18n.language === 'en' 
          ? `Analysis failed: ${err.message || 'Unknown error'}` 
          : `বিশ্লেষণ ব্যর্থ হয়েছে: ${err.message || 'অজানা সমস্যা'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16">
        <div className="absolute inset-0 opacity-30">
          <img src="https://images.unsplash.com/photo-1574943320219-553eb213f72d" className="w-full h-full object-cover scale-110" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-organic-dark/90 via-transparent to-organic-dark/90" />
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
          <div className="space-y-8 max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto">
              <Microscope size={18} />
              {t('ai_disease')}
            </div>
            <h1 className="text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4">
              {i18n.language === 'en' ? 'KRISHI' : 'কৃষি'} <span className="text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words">{i18n.language === 'en' ? 'BONDHU AI' : 'বন্ধু এআই'}</span>
            </h1>
            <p className="text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6">
              {i18n.language === 'en' 
                ? 'Krishi Bondhu Advanced AI diagnostics for crops, fish, and livestock. Upload a photo for expert guidance.' 
                : 'কৃষি বন্ধু-র উন্নত এআই দ্বারা ফসল, মাছ এবং পশুপাখির রোগ নির্ণয় ও সমাধান।'}
            </p>
          </div>
        </div>
        <Sparkles className="absolute -bottom-12 -right-12 w-full h-full text-white/5 -rotate-12 blur-3xl" />
        <Brain className="absolute top-10 right-10 w-48 h-48 text-white/5" />
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        {/* Category Selector */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 noscroll">
          {[
            { id: 'PLANT', name: i18n.language === 'en' ? 'Crop' : 'ফসল', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
            { id: 'FISH', name: i18n.language === 'en' ? 'Fish' : 'মাছ', icon: Fish, color: 'text-blue-600', bg: 'bg-blue-50' },
            { id: 'LIVESTOCK', name: i18n.language === 'en' ? 'Livestock' : 'পশুপাখি', icon: Bird, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setAnalysisType(cat.id as any);
                setResult(null);
              }}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all whitespace-nowrap border-2 ${
                analysisType === cat.id 
                  ? `border-organic-green ${cat.bg} ${cat.color} shadow-lg scale-105` 
                  : 'border-organic-light bg-white text-organic-dark/40 hover:border-organic-green/50'
              }`}
            >
              <cat.icon size={20} />
              {cat.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] border border-organic-light/80 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
          <div className="p-8 sm:p-12">
            {!image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-organic-light rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-organic-light/20 hover:border-organic-green transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-organic-light/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-24 h-24 bg-organic-light/50 rounded-3xl flex items-center justify-center text-organic-green group-hover:scale-110 transition-transform shadow-inner">
                  <Camera size={48} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-organic-dark">
                    {i18n.language === 'en' 
                      ? `Scan Your ${analysisType.charAt(0) + analysisType.slice(1).toLowerCase()}` 
                      : `আপনার ${analysisType === 'PLANT' ? 'উদ্ভিদ' : analysisType === 'FISH' ? 'মাছ' : 'পশুপাখি'} স্ক্যান করুন`}
                  </h3>
                  <p className="text-organic-dark/60 font-medium">
                    {i18n.language === 'en' ? 'Click to upload or take a clear photo' : 'আপলোড করতে ক্লিক করুন বা একটি পরিষ্কার ছবি তুলুন'}
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-organic-light bg-black group shadow-lg">
                  <img src={image} alt="Crop" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <button 
                    onClick={() => {
                      setImage(null);
                      setResult(null);
                    }}
                    className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl z-20"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={analyzeImage}
                    disabled={loading}
                    className="flex-grow py-5 bg-organic-green text-white rounded-[1.5rem] font-black text-xl hover:bg-organic-green/90 transition-all shadow-xl shadow-green-900/10 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        <span>{i18n.language === 'en' ? 'Consulting Dr. AI...' : 'ডাক্তার এআই পরামর্শ দিচ্ছে...'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={24} />
                        <span>{i18n.language === 'en' ? 'Analyze Harvest' : 'ফসল বিশ্লেষণ করুন'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="px-8 py-5 bg-organic-light text-organic-dark rounded-[1.5rem] font-bold hover:bg-organic-light/80 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Upload size={20} />
                    {i18n.language === 'en' ? 'Different Photo' : 'অন্য ছবি'}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 shadow-sm"
                >
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="font-bold text-sm">{error}</p>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-3xl font-black text-organic-dark">
                      <div className="w-12 h-12 bg-organic-green/10 rounded-2xl flex items-center justify-center text-organic-green">
                        <HeartPulse size={28} />
                      </div>
                      {i18n.language === 'en' ? 'Diagnosis Report' : 'নির্ণয় রিপোর্ট'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-b from-organic-light/20 to-white rounded-[2.5rem] p-8 sm:p-10 border border-organic-light shadow-sm relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Brain size={120} />
                    </div>
                    <div className="prose prose-green max-w-none text-organic-dark/80 relative z-10 
                      prose-headings:text-organic-dark prose-headings:font-black prose-headings:tracking-tight
                      prose-strong:text-organic-green prose-strong:font-bold
                      prose-li:marker:text-organic-green">
                      <ReactMarkdown>
                        {result}
                      </ReactMarkdown>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-organic-light flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-organic-green shadow-sm border border-organic-light shrink-0">
                        <Info size={32} />
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-sm font-black text-organic-dark uppercase tracking-widest">Medical Disclaimer</p>
                        <p className="text-xs font-medium text-organic-dark/50 leading-relaxed">
                          {i18n.language === 'en' 
                            ? 'AI results are for informational purposes only. Consult with your local Block Supervisor (BS) or Agriculture Extension Officer before applying any chemicals.' 
                            : 'এআই ফলাফল শুধুমাত্র তথ্যের জন্য। যেকোনো রাসায়নিক প্রয়োগের আগে আপনার স্থানীয় ব্লক সুপারভাইজার (BS) বা কৃষি সম্প্রসারন কর্মকর্তার সাথে পরামর্শ করুন।'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

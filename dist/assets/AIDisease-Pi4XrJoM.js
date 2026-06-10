import{i as j,u as D,r as i,j as e,ai as B,$ as E,a0 as C,X as L,A as T,m as y,I as F}from"./index-CRiOJyFn.js";import{compressBase64 as H}from"./imageUtils-DojqMDcb.js";import{M as R}from"./microscope-BZ-4GFcV.js";import{S as M}from"./sparkles-BEazDZ8K.js";import{B as v}from"./brain-2K8EUHH6.js";import{C as z}from"./camera-ChrharZY.js";import{L as U}from"./loader-circle-BFaPOjEd.js";import{S as P}from"./shield-check-C2e1_GUI.js";import{C as O}from"./circle-alert-Ck1edsQS.js";import{M as K}from"./index-DZT_I-RB.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}],["path",{d:"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",key:"auskq0"}]],$=j("heart-pulse",_);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],q=j("upload",V);function te(){const{t:N,i18n:s}=D(),[r,w]=i.useState("PLANT"),[n,u]=i.useState(null),[m,o]=i.useState(!1),[f,c]=i.useState(null),[b,p]=i.useState(null),h=i.useRef(null),I=async a=>{var g;const d=(g=a.target.files)==null?void 0:g[0];if(d){o(!0);try{const t=new FileReader;t.onloadend=async()=>{const x=t.result,l=await H(x,512,512,.4);u(l),c(null),p(null),o(!1)},t.readAsDataURL(d)}catch(t){console.error("Compression error:",t.message||t),o(!1)}}},k=async()=>{if(n){o(!0),p(null);try{const a=n.split(",")[0].split(":")[1].split(";")[0],d=n.split(",")[1],g={PLANT:`You are an expert plant pathologist for KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED). Analyze this crop image carefully. 
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
           - Prevention tips for future`,FISH:`You are an expert aquaculture specialist for KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED). Analyze this image of a fish or pond environment.
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
           - Long-term prevention`,LIVESTOCK:`You are an expert veterinarian for KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED). Analyze this image of livestock (cattle, poultry, goat, etc.).
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
           - Nutrition and biosecurity tips`},t={PLANT:`আপনি KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED) এর একজন বিশেষজ্ঞ উদ্ভিদ রোগতত্ত্ববিদ। এই শস্যের ছবিটি মনোযোগ সহকারে বিশ্লেষণ করুন। 
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
           - ভবিষ্যতে প্রতিরোধের টিপস`,FISH:`আপনি KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED) এর একজন বিশেষজ্ঞ মৎস্য গবেষক। মাছ বা পুকুরের এই ছবিটি বিশ্লেষণ করুন।
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
           - দীর্ঘমেয়াদী প্রতিরোধ`,LIVESTOCK:`আপনি KRISHI BONDHU (ABS FEED INDUSTRIES LIMITED) এর একজন বিশেষজ্ঞ পশুচিকিত্সক (Vet)। গবাদি পশু বা হাঁস-মুরগির এই ছবিটি বিশ্লেষণ করুন।
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
           - পুষ্টি ও জৈব-নিরাপত্তা টিপস`},x=s.language==="en"?g[r]:t[r],l=await fetch("/api/ai/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:x,image:d,mimeType:a})});if(!l.ok){const A=await l.json();throw new Error(A.error||"Failed to analyze image")}const S=await l.json();c(S.text)}catch(a){console.error("Analysis error:",a.message||a),p(s.language==="en"?`Analysis failed: ${a.message||"Unknown error"}`:`বিশ্লেষণ ব্যর্থ হয়েছে: ${a.message||"অজানা সমস্যা"}`)}finally{o(!1)}}};return e.jsxs("div",{className:"space-y-8 pb-12",children:[e.jsxs("header",{className:"relative bg-organic-dark rounded-[4rem] p-12 sm:p-24 text-white overflow-hidden shadow-2xl text-center mx-auto mb-16",children:[e.jsx("div",{className:"absolute inset-0 opacity-30",children:e.jsx("img",{src:"https://images.unsplash.com/photo-1574943320219-553eb213f72d",className:"w-full h-full object-cover scale-110",alt:""})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-organic-dark/90 via-transparent to-organic-dark/90"}),e.jsx("div",{className:"relative z-10 flex flex-col items-center justify-center gap-12",children:e.jsxs("div",{className:"space-y-8 max-w-5xl text-center flex flex-col items-center",children:[e.jsxs("div",{className:"inline-flex items-center gap-3 px-8 py-3 bg-organic-green/20 rounded-full border border-organic-green/30 text-organic-green text-xs font-black uppercase tracking-[0.3em] mx-auto",children:[e.jsx(R,{size:18}),N("ai_disease")]}),e.jsxs("h1",{className:"text-[10vw] sm:text-7xl font-black tracking-tight uppercase leading-[1.1] text-center px-4",children:[s.language==="en"?"KRISHI":"কৃষি"," ",e.jsx("span",{className:"text-organic-green uppercase drop-shadow-[0_0_30px_rgba(34,197,94,0.3)] break-words",children:s.language==="en"?"BONDHU AI":"বন্ধু এআই"})]}),e.jsx("p",{className:"text-green-50/80 max-w-2xl mx-auto font-bold text-base sm:text-2xl leading-snug sm:leading-relaxed mt-4 px-6",children:s.language==="en"?"Krishi Bondhu Advanced AI diagnostics for crops, fish, and livestock. Upload a photo for expert guidance.":"কৃষি বন্ধু-র উন্নত এআই দ্বারা ফসল, মাছ এবং পশুপাখির রোগ নির্ণয় ও সমাধান।"})]})}),e.jsx(M,{className:"absolute -bottom-12 -right-12 w-full h-full text-white/5 -rotate-12 blur-3xl"}),e.jsx(v,{className:"absolute top-10 right-10 w-48 h-48 text-white/5"})]}),e.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-0",children:[e.jsx("div",{className:"flex gap-4 mb-8 overflow-x-auto pb-2 noscroll",children:[{id:"PLANT",name:s.language==="en"?"Crop":"ফসল",icon:B,color:"text-green-600",bg:"bg-green-50"},{id:"FISH",name:s.language==="en"?"Fish":"মাছ",icon:E,color:"text-blue-600",bg:"bg-blue-50"},{id:"LIVESTOCK",name:s.language==="en"?"Livestock":"পশুপাখি",icon:C,color:"text-amber-600",bg:"bg-amber-50"}].map(a=>e.jsxs("button",{onClick:()=>{w(a.id),c(null)},className:`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all whitespace-nowrap border-2 ${r===a.id?`border-organic-green ${a.bg} ${a.color} shadow-lg scale-105`:"border-organic-light bg-white text-organic-dark/40 hover:border-organic-green/50"}`,children:[e.jsx(a.icon,{size:20}),a.name]},a.id))}),e.jsx("div",{className:"bg-white rounded-[3rem] border border-organic-light/80 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]",children:e.jsxs("div",{className:"p-8 sm:p-12",children:[n?e.jsxs("div",{className:"space-y-8",children:[e.jsxs("div",{className:"relative aspect-video rounded-[2.5rem] overflow-hidden border border-organic-light bg-black group shadow-lg",children:[e.jsx("img",{src:n,alt:"Crop",className:"w-full h-full object-contain"}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"}),e.jsx("button",{onClick:()=>{u(null),c(null)},className:"absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl z-20",children:e.jsx(L,{size:20})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-4",children:[e.jsx("button",{onClick:k,disabled:m,className:"flex-grow py-5 bg-organic-green text-white rounded-[1.5rem] font-black text-xl hover:bg-organic-green/90 transition-all shadow-xl shadow-green-900/10 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95",children:m?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:24,className:"animate-spin"}),e.jsx("span",{children:s.language==="en"?"Consulting Dr. AI...":"ডাক্তার এআই পরামর্শ দিচ্ছে..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(P,{size:24}),e.jsx("span",{children:s.language==="en"?"Analyze Harvest":"ফসল বিশ্লেষণ করুন"})]})}),e.jsxs("button",{onClick:()=>{var a;return(a=h.current)==null?void 0:a.click()},disabled:m,className:"px-8 py-5 bg-organic-light text-organic-dark rounded-[1.5rem] font-bold hover:bg-organic-light/80 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50",children:[e.jsx(q,{size:20}),s.language==="en"?"Different Photo":"অন্য ছবি"]})]})]}):e.jsxs("div",{onClick:()=>{var a;return(a=h.current)==null?void 0:a.click()},className:"border-4 border-dashed border-organic-light rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-organic-light/20 hover:border-organic-green transition-all group relative overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-transparent to-organic-light/5 opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsx("div",{className:"w-24 h-24 bg-organic-light/50 rounded-3xl flex items-center justify-center text-organic-green group-hover:scale-110 transition-transform shadow-inner",children:e.jsx(z,{size:48})}),e.jsxs("div",{className:"text-center space-y-2",children:[e.jsx("h3",{className:"text-2xl font-black text-organic-dark",children:s.language==="en"?`Scan Your ${r.charAt(0)+r.slice(1).toLowerCase()}`:`আপনার ${r==="PLANT"?"উদ্ভিদ":r==="FISH"?"মাছ":"পশুপাখি"} স্ক্যান করুন`}),e.jsx("p",{className:"text-organic-dark/60 font-medium",children:s.language==="en"?"Click to upload or take a clear photo":"আপলোড করতে ক্লিক করুন বা একটি পরিষ্কার ছবি তুলুন"})]}),e.jsx("input",{type:"file",ref:h,onChange:I,accept:"image/*",className:"hidden"})]}),e.jsxs(T,{mode:"wait",children:[b&&e.jsxs(y.div,{initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},exit:{opacity:0,height:0},className:"mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 shadow-sm",children:[e.jsx(O,{size:24,className:"shrink-0"}),e.jsx("p",{className:"font-bold text-sm",children:b})]}),f&&e.jsxs(y.div,{initial:{opacity:0,y:30},animate:{opacity:1,y:0},className:"mt-12 space-y-8",children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("div",{className:"flex items-center gap-4 text-3xl font-black text-organic-dark",children:[e.jsx("div",{className:"w-12 h-12 bg-organic-green/10 rounded-2xl flex items-center justify-center text-organic-green",children:e.jsx($,{size:28})}),s.language==="en"?"Diagnosis Report":"নির্ণয় রিপোর্ট"]})}),e.jsxs("div",{className:"bg-gradient-to-b from-organic-light/20 to-white rounded-[2.5rem] p-8 sm:p-10 border border-organic-light shadow-sm relative",children:[e.jsx("div",{className:"absolute top-0 right-0 p-8 opacity-5",children:e.jsx(v,{size:120})}),e.jsx("div",{className:`prose prose-green max-w-none text-organic-dark/80 relative z-10 
                      prose-headings:text-organic-dark prose-headings:font-black prose-headings:tracking-tight
                      prose-strong:text-organic-green prose-strong:font-bold
                      prose-li:marker:text-organic-green`,children:e.jsx(K,{children:f})}),e.jsxs("div",{className:"mt-10 pt-8 border-t border-organic-light flex flex-col sm:flex-row items-center gap-6",children:[e.jsx("div",{className:"w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-organic-green shadow-sm border border-organic-light shrink-0",children:e.jsx(F,{size:32})}),e.jsxs("div",{className:"space-y-1 text-center sm:text-left",children:[e.jsx("p",{className:"text-sm font-black text-organic-dark uppercase tracking-widest",children:"Medical Disclaimer"}),e.jsx("p",{className:"text-xs font-medium text-organic-dark/50 leading-relaxed",children:s.language==="en"?"AI results are for informational purposes only. Consult with your local Block Supervisor (BS) or Agriculture Extension Officer before applying any chemicals.":"এআই ফলাফল শুধুমাত্র তথ্যের জন্য। যেকোনো রাসায়নিক প্রয়োগের আগে আপনার স্থানীয় ব্লক সুপারভাইজার (BS) বা কৃষি সম্প্রসারন কর্মকর্তার সাথে পরামর্শ করুন।"})]})]})]})]})]})]})})]})]})}export{te as default};

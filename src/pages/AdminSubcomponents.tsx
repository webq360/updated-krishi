import React from 'react';
import { useTranslation } from 'react-i18next';
import { db, doc, deleteDoc } from '../lib/db';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Wheat, 
  Bird, 
  Fish, 
  ShoppingBag, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Users,
  Activity,
  Shield,
  Phone,
  MapPin,
  Mail,
  Loader2,
  Database,
  TrendingUp,
  Calendar,
  MessageSquare,
  Landmark,
  GraduationCap,
  FileDown,
  FileSpreadsheet,
  Globe,
  RefreshCw,
  History as HistoryIcon,
  CreditCard,
  Send,
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { BANGLADESH_DISTRICTS } from '../constants/districts';
import { cn } from '../lib/utils';

export function UserItem({ user, onUpdateRole, isAdmin }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language !== 'en';

  return (
    <div className="p-6 hover:bg-[#F9FBF9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-lg">{user.name}</h4>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            user.role === 'admin' ? "bg-purple-100 text-purple-600" : 
            user.role === 'manager' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
          )}>
            {user.role || 'user'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-[#556B55]">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-[#8BA88B]" />
            {user.phone}
          </div>
          {user.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#8BA88B]" />
              {user.email}
            </div>
          )}
          <div className="flex items-center gap-2 sm:col-span-2">
            <MapPin size={14} className="text-[#8BA88B]" />
            {user.address || (isBn ? 'ঠিকানা দেওয়া হয়নি' : 'No address provided')}
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 text-[10px] text-[#8BA88B] mt-1">
            <Activity size={12} />
            {isBn ? 'নিবন্ধন তারিখ:' : 'Registered:'} {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString() : (user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A')}
            {user.provider && (
              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[9px] uppercase font-bold">{user.provider}</span>
            )}
            {isAdmin && user.password && (
              <div className="flex items-center gap-1 ml-4 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                <Lock size={10} />
                <span className="font-black">Pass: {user.password}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isAdmin && (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onUpdateRole(user.role === 'admin' ? 'user' : 'admin')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E8E0] rounded-xl text-sm font-bold hover:bg-[#F0F5F0] transition-all"
          >
            <Shield size={16} />
            {user.role === 'admin' ? (isBn ? 'অ্যাডমিন বাতিল' : 'Revoke Admin') : (isBn ? 'অ্যাডমিন করুন' : 'Make Admin')}
          </button>
          <button 
            onClick={() => {
              if (window.confirm(isBn ? "এই ইউজার ডিলিট করতে চান?" : "Delete this user?")) {
                deleteDoc(doc(db, 'users', user.id));
              }
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title={isBn ? "মুছুন" : "Delete"}
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ListItem({ item, onEdit, onDelete, isAdmin }: any) {
  const title = item.name || item.title || item.seedName || item.machineName || item.ownerName || item.userName || (item.guide?.en ? 'Crop Guide' : 'Item');
  const subtitle = item.category || item.speciesId || item.district || item.area || item.animalType || item.fishSpecies || item.season || item.stage;
  
  return (
    <div className="flex items-center justify-between p-4 hover:bg-[#F9FBF9] transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#F0F5F0] rounded-xl overflow-hidden shrink-0 border border-[#E0E8E0]">
          <img 
            src={item.imageUrl || item.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(title)}/100/100`} 
            alt="" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-[#1B301B]">{title}</h4>
            {item.price && (
              <span className="text-xs font-black text-[#4CAF50] bg-green-50 px-2 py-0.5 rounded-md">
                ৳{item.price} {item.unit ? `/${item.unit}` : ''}
              </span>
            )}
            {item.isPaid && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                Featured
              </span>
            )}
            {item.status && (
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                item.status === 'approved' || item.status === 'resolved' ? "bg-green-100 text-green-700" :
                item.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
              )}>
                {item.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#8BA88B]">
            {subtitle && <span className="uppercase tracking-wider font-semibold">{subtitle}</span>}
            {item.contact && <span>📞 {item.contact}</span>}
            {item.phone && <span>📞 {item.phone}</span>}
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onEdit(item)} className="p-2 text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition-colors" title="Edit">
            <Edit2 size={18} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export function Form({ type, initialData, onSave, onCancel, speciesList }: any) {
  const { i18n } = useTranslation();
  const [formData, setFormData] = React.useState(initialData || {});

  const SUB_CATEGORIES: Record<string, string[]> = {
    livestock: ['Cattle (গরু)', 'Goat (ছাগল)', 'Buffalo (মহিষ)', 'Sheep (ভেড়া)'],
    poultry: ['Broiler (ব্রয়লার)', 'Layer (লেয়ার)', 'Sonali (সোনালী)', 'Duck (হাঁস)', 'Turkey (টার্কি)'],
    fisheries: ['Carp (কার্প)', 'Catfish (ক্যাটফিশ)', 'Tilapia (তেলাপিয়া)', 'Shrimp (চিংড়ি)'],
    vegetables: [
      'Rice (ধান)', 
      'Wheat (গম)', 
      'Maize (ভুট্টা)', 
      'Jute (পাট)', 
      'Red Spinach (লাল শাক)', 
      'Eggplant (বেগুন)', 
      'Pointed Gourd (পটল)', 
      'Okra (ঢেঁড়স)', 
      'Bean (সীম)'
    ],
    agriculture: ['Seeds (বীজ)', 'Fertilizer (সার)', 'Pesticide (কীটনাশক)', 'Tools (যন্ত্রপাতি)']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {type === 'species' && (
        <>
          <Input label="Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(v: string) => setFormData({...formData, category: v, subCategory: ''})} 
            options={[
              { label: 'Livestock', value: 'livestock' },
              { label: 'Poultry', value: 'poultry' },
              { label: 'Fisheries', value: 'fisheries' },
              { label: 'Vegetables', value: 'vegetables' }
            ]} 
            required
          />
          {formData.category && (
            <Select 
              label="Sub Category" 
              value={formData.subCategory} 
              onChange={(v: string) => setFormData({...formData, subCategory: v})} 
              options={SUB_CATEGORIES[formData.category as string]?.map(sub => ({ label: sub, value: sub })) || []} 
              required
            />
          )}
          <Textarea label="Description" value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} className="md:col-span-2" />
          <Textarea label="Farming Method" value={formData.farmingMethod} onChange={v => setFormData({...formData, farmingMethod: v})} />
          <Input label="Stocking Density" value={formData.stockingDensity} onChange={v => setFormData({...formData, stockingDensity: v})} />
          <ImageUploadInput label="Species Photo" value={formData.imageUrl} onChange={(v: string) => setFormData({...formData, imageUrl: v})} folder="krishi-species" />
        </>
      )}

      {type === 'diseases' && (
        <>
          <Input label="Title" value={formData.title} onChange={v => setFormData({...formData, title: v})} required />
          <Select 
            label="Species" 
            value={formData.speciesId} 
            onChange={v => setFormData({...formData, speciesId: v})} 
            options={speciesList.map((s: any) => ({ label: s.name, value: s.id }))} 
            required
          />
          <Textarea label="Description" value={formData.description} onChange={v => setFormData({...formData, description: v})} className="md:col-span-2" />
          <Textarea label="Symptoms" value={formData.symptoms} onChange={v => setFormData({...formData, symptoms: v})} />
          <Textarea label="Treatment" value={formData.treatment} onChange={v => setFormData({...formData, treatment: v})} />
        </>
      )}

      {type === 'agents' && (
        <>
          <Input label="Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
          <Input label="Phone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
          <Input label="Shop Name" value={formData.shopName} onChange={v => setFormData({...formData, shopName: v})} required />
          <Input label="District" value={formData.address} onChange={v => setFormData({...formData, address: v})} required />
          <Input label="Upazila" value={formData.upazila} onChange={v => setFormData({...formData, upazila: v})} />
          <Input label="Agent Type" value={formData.agentType} onChange={v => setFormData({...formData, agentType: v})} />
          <Textarea label="Shop Address" value={formData.shopAddress} onChange={v => setFormData({...formData, shopAddress: v})} className="md:col-span-2" />
          <Select 
            label="Status" 
            value={formData.status} 
            onChange={v => setFormData({...formData, status: v})} 
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' }
            ]} 
          />
        </>
      )}

      {type === 'cards' && (
        <>
          <Input label="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
          <Input label="Father's Name" value={formData.fatherName} onChange={v => setFormData({...formData, fatherName: v})} required />
          <Input label="NID Number" value={formData.nidNumber} onChange={v => setFormData({...formData, nidNumber: v})} required />
          <Input label="Phone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
          <Select 
            label="District" 
            value={formData.district} 
            onChange={v => setFormData({...formData, district: v})} 
            options={BANGLADESH_DISTRICTS.map(d => ({ label: d, value: d }))} 
            required
          />
          <Input label="Upazila" value={formData.upazila} onChange={v => setFormData({...formData, upazila: v})} />
          <Select 
            label="Card Type" 
            value={formData.cardType} 
            onChange={v => setFormData({...formData, cardType: v})} 
            options={[
              { label: 'Farmer Card', value: 'Farmer Card' },
              { label: 'Premium Card', value: 'Premium Card' },
              { label: 'Agent Card', value: 'Agent Card' }
            ]} 
            required
          />
          <Select 
            label="Status" 
            value={formData.status} 
            onChange={v => setFormData({...formData, status: v})} 
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' }
            ]} 
          />
        </>
      )}

      {type === 'products' && (
        <>
          <Input label="Product Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(v: string) => setFormData({...formData, category: v, subCategory: ''})} 
            options={[
              { label: 'Livestock (গবাদি পশু)', value: 'livestock' },
              { label: 'Poultry (পোল্ট্রি)', value: 'poultry' },
              { label: 'Fisheries (মৎস্য)', value: 'fisheries' },
              { label: 'Agriculture (কৃষি)', value: 'agriculture' }
            ]} 
            required
          />
          {formData.category && SUB_CATEGORIES[formData.category as string] && (
            <Select 
              label="Sub Category" 
              value={formData.subCategory} 
              onChange={(v: string) => setFormData({...formData, subCategory: v})} 
              options={SUB_CATEGORIES[formData.category as string].map(s => ({ label: s, value: s }))} 
              required
            />
          )}
          <Input label="Order Link" value={formData.orderLink} onChange={(v: string) => setFormData({...formData, orderLink: v})} />
          <ImageUploadInput label="Product Photo" value={formData.imageUrl} onChange={(v: string) => setFormData({...formData, imageUrl: v})} folder="krishi-products" />
          <Textarea label="Description" value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} className="md:col-span-2" required />
          <Textarea label="Benefits (One per line)" value={formData.benefits} onChange={(v: string) => setFormData({...formData, benefits: v})} className="md:col-span-2" required />
        </>
      )}

      {type === 'market' && (
        <>
          <Input label="Product Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Input label="Price Range (e.g. 60-70)" value={formData.price} onChange={(v: string) => setFormData({...formData, price: v})} required />
          <Input label="Current Market Price" value={formData.marketPrice} onChange={(v: string) => setFormData({...formData, marketPrice: v})} />
          <Input label="Unit (e.g. kg, maund)" value={formData.unit} onChange={(v: string) => setFormData({...formData, unit: v})} required />
          <ImageUploadInput label="Market Product Photo" value={formData.imageUrl} onChange={(v: string) => setFormData({...formData, imageUrl: v})} folder="krishi-market" />
          <Select 
            label="District" 
            value={formData.district} 
            onChange={(v: string) => setFormData({...formData, district: v})} 
            options={BANGLADESH_DISTRICTS.map(d => ({ label: d, value: d }))} 
            required
          />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(v: string) => setFormData({...formData, category: v})} 
            options={[
              { label: 'Crops', value: 'Crops' },
              { label: 'Fish', value: 'Fish' },
              { label: 'Poultry', value: 'Poultry' }
            ]} 
            required
          />
          <Select 
            label="Trend" 
            value={formData.change} 
            onChange={(v: string) => setFormData({...formData, change: v})} 
            options={[
              { label: 'Up', value: 'up' },
              { label: 'Down', value: 'down' },
              { label: 'Stable', value: 'stable' }
            ]} 
          />
          <Input label="Trend % (e.g. +2.5%)" value={formData.trend} onChange={(v: string) => setFormData({...formData, trend: v})} />
        </>
      )}

      {type === 'calendar' && (
        <>
          <Input label="Crop Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Input label="Season (e.g. July - Dec)" value={formData.season} onChange={(v: string) => setFormData({...formData, season: v})} required />
          <Input label="Current Stage" value={formData.stage} onChange={(v: string) => setFormData({...formData, stage: v})} required />
          <Input label="Color Class (e.g. bg-green-500)" value={formData.color} onChange={(v: string) => setFormData({...formData, color: v})} />
          <Textarea 
            label="Tasks (One per line)" 
            value={Array.isArray(formData.tasks) ? formData.tasks.join('\n') : formData.tasks} 
            onChange={(v: string) => setFormData({...formData, tasks: v.split('\n').filter(t => t.trim())})} 
            className="md:col-span-2"
            required
          />
          <Textarea 
            label="Guide (English)" 
            value={formData.guide?.en} 
            onChange={(v: string) => setFormData({...formData, guide: { ...formData.guide, en: v }})} 
            className="md:col-span-2"
            required
          />
          <Textarea 
            label="Guide (Bengali)" 
            value={formData.guide?.bn} 
            onChange={(v: string) => setFormData({...formData, guide: { ...formData.guide, bn: v }})} 
            className="md:col-span-2"
            required
          />
        </>
      )}

      {type === 'marketplace' && (
        <>
          <Input label="Product Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Input label="Price" value={formData.price} onChange={(v: string) => setFormData({...formData, price: v})} required />
          <Input label="Unit (e.g. kg)" value={formData.unit} onChange={(v: string) => setFormData({...formData, unit: v})} required />
          <Input label="District" value={formData.district} onChange={(v: string) => setFormData({...formData, district: v})} required />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(v: string) => setFormData({...formData, category: v})} 
            options={[
              { label: 'Crops', value: 'Crops' },
              { label: 'Vegetables', value: 'Vegetables' },
              { label: 'Fruits', value: 'Fruits' },
              { label: 'Fish', value: 'Fish' },
              { label: 'Poultry', value: 'Poultry' },
              { label: 'Livestock', value: 'Livestock' }
            ]} 
            required
          />
          <Input label="Contact" value={formData.contact} onChange={(v: string) => setFormData({...formData, contact: v})} required />
          <Textarea label="Description" value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} className="md:col-span-2" required />
        </>
      )}

      {type === 'forum' && (
        <>
          <Input label="Title" value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} required />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(v: string) => setFormData({...formData, category: v})} 
            options={[
              { label: 'General', value: 'General' },
              { label: 'Crops', value: 'Crops' },
              { label: 'Livestock', value: 'Livestock' },
              { label: 'Poultry', value: 'Poultry' },
              { label: 'Fisheries', value: 'Fisheries' },
              { label: 'Success Stories', value: 'Success Stories' }
            ]} 
            required
          />
          <Textarea label="Content" value={formData.content} onChange={(v: string) => setFormData({...formData, content: v})} className="md:col-span-2" required />
        </>
      )}

      {type === 'loan-payments' && (
        <>
          <Input label="Loan ID" value={formData.loanId} onChange={(v: string) => setFormData({...formData, loanId: v})} required />
          <Input label="Amount Paid (TK)" value={formData.amount} onChange={(v: string) => setFormData({...formData, amount: v})} required />
          <Input label="Date (YYYY-MM-DD)" value={formData.date} onChange={(v: string) => setFormData({...formData, date: v})} required />
          <Select 
            label="Method" 
            value={formData.method} 
            onChange={(v: string) => setFormData({...formData, method: v})} 
            options={[
              { label: 'Bank Transfer', value: 'Bank Transfer' },
              { label: 'Cash Payment', value: 'Cash Payment' },
              { label: 'Mobile Banking', value: 'Mobile Banking' }
            ]} 
          />
        </>
      )}

      {(type === 'loans' || type === 'protections' || type === 'pona' || type === 'training' || type === 'exports') && (
        <>
          <Input label="User Name" value={formData.userName || formData.name} onChange={(v: string) => setFormData({...formData, userName: v, name: v})} required />
          <Input label="Phone" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} required />
          {type === 'loans' && (
            <>
              <Input label="Requested Amount (TK)" value={formData.amount} onChange={(v: string) => setFormData({...formData, amount: v})} required />
              <Input label="Approved Amount (TK)" value={formData.approvedAmount} onChange={(v: string) => setFormData({...formData, approvedAmount: v})} />
              <Input label="District" value={formData.district} onChange={(v: string) => setFormData({...formData, district: v})} />
              <Input label="Upazila" value={formData.upazila} onChange={(v: string) => setFormData({...formData, upazila: v})} />
            </>
          )}
          {type === 'protections' && (
            <>
              <Input label="Crop Type" value={formData.cropType} onChange={(v: string) => setFormData({...formData, cropType: v})} required />
              <Input label="Total Value (TK)" value={formData.totalValue} onChange={(v: string) => setFormData({...formData, totalValue: v})} required />
            </>
          )}
          {type === 'pona' && (
            <Select 
              label="Category" 
              value={formData.category} 
              onChange={(v: string) => setFormData({...formData, category: v})} 
              options={[
                { label: 'Fish Pona', value: 'Fish Pona' },
                { label: 'Poultry Chicks', value: 'Poultry Chicks' },
                { label: 'Livestock Calves', value: 'Livestock Calves' }
              ]}
              required
            />
          )}
          {type === 'training' && (
            <>
              <Input label="Training Topic" value={formData.trainingType} onChange={(v: string) => setFormData({...formData, trainingType: v})} required />
              <Select 
                label="Fee Type" 
                value={formData.feeType} 
                onChange={(v: string) => setFormData({...formData, feeType: v})} 
                options={[
                  { label: 'Free', value: 'free' },
                  { label: 'Paid', value: 'paid' }
                ]} 
                required
              />
            </>
          )}
          {type === 'exports' && (
            <>
              <Input label="Product Name" value={formData.productName} onChange={(v: string) => setFormData({...formData, productName: v})} required />
              <Input label="District" value={formData.district} onChange={(v: string) => setFormData({...formData, district: v})} />
              <Input label="Upazila" value={formData.upazila} onChange={(v: string) => setFormData({...formData, upazila: v})} />
            </>
          )}
          <Select 
            label="Status" 
            value={formData.status} 
            onChange={(v: string) => setFormData({...formData, status: v})} 
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved/Contacted', value: 'approved' },
              { label: 'Completed', value: 'completed' }
            ]} 
            required
          />
          <Textarea label="Details" value={formData.details} onChange={(v: string) => setFormData({...formData, details: v})} className="md:col-span-2" />
        </>
      )}

      {type === 'settings' && (
        <>
          <Input label="Admin Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Input label="Admin Email/Username" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} required />
          <Input label="Password" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} required />
          <Select 
            label="Role" 
            value={formData.role} 
            onChange={(v: string) => setFormData({...formData, role: v})} 
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Manager', value: 'manager' }
            ]} 
            required
          />
        </>
      )}

      {type === 'stories' && (
        <>
          <Input label="User Name" value={formData.userName} onChange={(v: string) => setFormData({...formData, userName: v})} required />
          <Textarea label="Story Content" value={formData.content} onChange={(v: string) => setFormData({...formData, content: v})} className="md:col-span-2" required />
        </>
      )}

      {type === 'problems' && (
        <>
          <Textarea label="User Problem" value={formData.problem} onChange={(v: string) => setFormData({...formData, problem: v})} required />
          <Textarea label="AI Solution" value={formData.solution} onChange={(v: string) => setFormData({...formData, solution: v})} className="md:col-span-2" required />
        </>
      )}

      {type === 'user-market' && (
        <>
          <Input label="Product Name" value={formData.productName} onChange={(v: string) => setFormData({...formData, productName: v})} required />
          <Input label="Price" value={formData.price} onChange={(v: string) => setFormData({...formData, price: v})} required />
          <Input label="Unit" value={formData.unit} onChange={(v: string) => setFormData({...formData, unit: v})} required />
          <Input label="Area" value={formData.area} onChange={(v: string) => setFormData({...formData, area: v})} required />
          <Input label="Date" value={formData.date} onChange={(v: string) => setFormData({...formData, date: v})} required />
        </>
      )}

      {type === 'cold-storage' && (
        <>
          <Input label="Storage Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required />
          <Input label="District" value={formData.district} onChange={(v: string) => setFormData({...formData, district: v})} required />
          <Input label="Location" value={formData.location} onChange={(v: string) => setFormData({...formData, location: v})} required />
          <Input label="Phone" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} required />
          <Input label="Capacity" value={formData.capacity} onChange={(v: string) => setFormData({...formData, capacity: v})} required />
          <Input label="Available Space" value={formData.availableSpace} onChange={(v: string) => setFormData({...formData, availableSpace: v})} required />
          <Input label="Image URL (Ad Picture)" value={formData.imageUrl} onChange={(v: string) => setFormData({...formData, imageUrl: v})} />
        </>
      )}

      {type === 'rent-machines' && (
        <>
          <Input label="Machine Name" value={formData.machineName} onChange={(v: string) => setFormData({...formData, machineName: v})} required />
          <Input label="Owner Name" value={formData.ownerName} onChange={(v: string) => setFormData({...formData, ownerName: v})} required />
          <Input label="District" value={formData.district} onChange={(v: string) => setFormData({...formData, district: v})} required />
          <Input label="Phone" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} required />
          <Input label="Rate" value={formData.rate} onChange={(v: string) => setFormData({...formData, rate: v})} required />
          <Textarea label="Description" value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} className="md:col-span-2" />
        </>
      )}

      {type === 'pest-warnings' && (
        <>
          <Input label="Title" value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} required />
          <Input label="Area" value={formData.area} onChange={(v: string) => setFormData({...formData, area: v})} required />
          <Select 
            label="Severity" 
            value={formData.severity} 
            onChange={(v: string) => setFormData({...formData, severity: v})} 
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' }
            ]} 
            required
          />
          <Textarea label="Description" value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} className="md:col-span-2" required />
        </>
      )}

      {type === 'map-resources' && (
        <>
          <Input label="Name (English)" value={formData.name_en} onChange={(v: string) => setFormData({...formData, name_en: v})} required />
          <Input label="Name (Bengali)" value={formData.name_bn} onChange={(v: string) => setFormData({...formData, name_bn: v})} required />
          <Select 
            label="Type" 
            value={formData.type} 
            onChange={(v: string) => setFormData({...formData, type: v})} 
            options={[
              { label: 'Cold Storage', value: 'cold-storage' },
              { label: 'Machinery Rental', value: 'machinery-rental' },
              { label: 'Authorized Dealer', value: 'authorized-dealer' }
            ]} 
            required
          />
          <Input label="District (English)" value={formData.district_en} onChange={(v: string) => setFormData({...formData, district_en: v})} required />
          <Input label="District (Bengali)" value={formData.district_bn} onChange={(v: string) => setFormData({...formData, district_bn: v})} required />
          <Input label="Address (English)" value={formData.address_en} onChange={(v: string) => setFormData({...formData, address_en: v})} required />
          <Input label="Address (Bengali)" value={formData.address_bn} onChange={(v: string) => setFormData({...formData, address_bn: v})} required />
          <Input label="Phone" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} required />
          <Input label="Latitude" type="number" step="any" value={formData.lat} onChange={(v: string) => setFormData({...formData, lat: parseFloat(v)})} required />
          <Input label="Longitude" type="number" step="any" value={formData.lng} onChange={(v: string) => setFormData({...formData, lng: parseFloat(v)})} required />
          <Input label="Details (English)" value={formData.details_en} onChange={(v: string) => setFormData({...formData, details_en: v})} />
          <Input label="Details (Bengali)" value={formData.details_bn} onChange={(v: string) => setFormData({...formData, details_bn: v})} />
        </>
      )}

      {type === 'knowledge-base' && (
        <>
          <Input label="Title (English)" value={formData.title_en} onChange={(v: string) => setFormData({...formData, title_en: v})} required />
          <Input label="Title (Bengali)" value={formData.title_bn} onChange={(v: string) => setFormData({...formData, title_bn: v})} required />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(v: string) => setFormData({...formData, category: v})} 
            options={[
              { label: 'Crops', value: 'crops' },
              { label: 'Livestock', value: 'livestock' },
              { label: 'Poultry', value: 'poultry' },
              { label: 'Fisheries', value: 'fisheries' },
              { label: 'General', value: 'general' }
            ]} 
            required
          />
          <Textarea label="Content (English)" value={formData.content_en} onChange={(v: string) => setFormData({...formData, content_en: v})} className="md:col-span-2" required />
          <Textarea label="Content (Bengali)" value={formData.content_bn} onChange={(v: string) => setFormData({...formData, content_bn: v})} className="md:col-span-2" required />
          <ImageUploadInput label="Article Photo" value={formData.imageUrl} onChange={(v: string) => setFormData({...formData, imageUrl: v})} folder="krishi-knowledge" />
        </>
      )}

      {type === 'video-tutorials' && (
        <>
          <Input label="Title (English)" value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} required />
          <Input label="Title (Bengali)" value={formData.titleBn} onChange={(v: string) => setFormData({...formData, titleBn: v})} required />
          <Input label="YouTube Embed URL (e.g. https://www.youtube.com/embed/XXXX)" value={formData.url} onChange={(v: string) => setFormData({...formData, url: v})} required />
          <ImageUploadInput label="Video Thumbnail" value={formData.thumbnail} onChange={(v: string) => setFormData({...formData, thumbnail: v})} folder="krishi-videos" />
          <Input label="Duration (e.g. 12:45)" value={formData.duration} onChange={(v: string) => setFormData({...formData, duration: v})} />
          <Input label="Category (English)" value={formData.category} onChange={(v: string) => setFormData({...formData, category: v})} required />
          <Input label="Category (Bengali)" value={formData.categoryBn} onChange={(v: string) => setFormData({...formData, categoryBn: v})} required />
          <Input label="Channel Name" value={formData.channel} onChange={(v: string) => setFormData({...formData, channel: v})} />
          <Input label="Views" value={formData.views} onChange={(v: string) => setFormData({...formData, views: v})} />
          <Input label="Published At (English)" value={formData.publishedAt} onChange={(v: string) => setFormData({...formData, publishedAt: v})} />
          <Input label="Published At (Bengali)" value={formData.publishedAtBn} onChange={(v: string) => setFormData({...formData, publishedAtBn: v})} />
        </>
      )}

      {type === 'seed-bank' && (
        <>
          <Input label="Seed Name (English)" value={formData.seedName_en} onChange={(v: string) => setFormData({...formData, seedName_en: v})} required />
          <Input label="Seed Name (Bengali)" value={formData.seedName_bn} onChange={(v: string) => setFormData({...formData, seedName_bn: v})} required />
          <Input label="Variety (English)" value={formData.variety_en} onChange={(v: string) => setFormData({...formData, variety_en: v})} required />
          <Input label="Variety (Bengali)" value={formData.variety_bn} onChange={(v: string) => setFormData({...formData, variety_bn: v})} required />
          <Input label="District (English)" value={formData.district_en} onChange={(v: string) => setFormData({...formData, district_en: v})} required />
          <Input label="District (Bengali)" value={formData.district_bn} onChange={(v: string) => setFormData({...formData, district_bn: v})} required />
          <Input label="Contact" value={formData.contact} onChange={(v: string) => setFormData({...formData, contact: v})} required />
          <Input label="Quantity" value={formData.quantity} onChange={(v: string) => setFormData({...formData, quantity: v})} />
          <ImageUploadInput label="Seed Photo" value={formData.imageUrl} onChange={(v: string) => setFormData({...formData, imageUrl: v})} folder="krishi-seeds" />
          <Select 
            label="Type" 
            value={formData.type} 
            onChange={(v: string) => setFormData({...formData, type: v})} 
            options={[
              { label: 'Offer', value: 'offer' },
              { label: 'Request', value: 'request' },
              { label: 'Exchange', value: 'exchange' }
            ]} 
            required
          />
          <Textarea label="Description (English)" value={formData.description_en} onChange={(v: string) => setFormData({...formData, description_en: v})} className="md:col-span-2" />
          <Textarea label="Description (Bengali)" value={formData.description_bn} onChange={(v: string) => setFormData({...formData, description_bn: v})} className="md:col-span-2" />
        </>
      )}

      {(type === 'soil-test' || type === 'livestock-health' || type === 'fish-water-test') && (
        <>
          <Input label="Owner Name" value={formData.ownerName} onChange={(v: string) => setFormData({...formData, ownerName: v})} required />
          <Input label="Phone" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} required />
          <Input label="District" value={formData.district} onChange={(v: string) => setFormData({...formData, district: v})} required />
          {type === 'soil-test' && (
            <>
              <Input label="Land Size" value={formData.landSize} onChange={(v: string) => setFormData({...formData, landSize: v})} required />
              <Input label="Crop Plan" value={formData.cropPlan} onChange={(v: string) => setFormData({...formData, cropPlan: v})} required />
            </>
          )}
          {type === 'livestock-health' && (
            <>
              <Input label="Animal Type" value={formData.animalType} onChange={(v: string) => setFormData({...formData, animalType: v})} required />
              <Input label="Symptoms" value={formData.symptoms} onChange={(v: string) => setFormData({...formData, symptoms: v})} required />
            </>
          )}
          {type === 'fish-water-test' && (
            <>
              <Input label="Pond Area" value={formData.pondArea} onChange={(v: string) => setFormData({...formData, pondArea: v})} required />
              <Input label="Fish Species" value={formData.fishSpecies} onChange={(v: string) => setFormData({...formData, fishSpecies: v})} required />
            </>
          )}
          <Select 
            label="Status" 
            value={formData.status} 
            onChange={(v: string) => setFormData({...formData, status: v})} 
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Processing', value: 'processing' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Cancelled', value: 'cancelled' }
            ]} 
            required
          />
          <Textarea label="Notes" value={formData.notes} onChange={(v: string) => setFormData({...formData, notes: v})} className="md:col-span-2" />
        </>
      )}

      {(type === 'problems' || type === 'stories' || type === 'system-push') && (
        <>
          <Input label="Title" value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} required />
          {type !== 'system-push' && (
            <Input label="Author" value={formData.authorName} onChange={(v: string) => setFormData({...formData, authorName: v})} />
          )}
          {type === 'system-push' && (
            <Select 
              label="Alert Type" 
              value={formData.type} 
              onChange={(v: string) => setFormData({...formData, type: v})} 
              options={[
                { label: 'Info', value: 'info' },
                { label: 'Warning', value: 'warning' },
                { label: 'Weather', value: 'weather' },
                { label: 'Success', value: 'success' }
              ]} 
              required
            />
          )}
          <Textarea label={type === 'system-push' ? 'Notification Body' : 'Content'} value={formData.content || formData.body} onChange={(v: string) => setFormData({...formData, content: v, body: v})} className="md:col-span-2" required />
          {type === 'problems' && (
            <Select 
              label="Status" 
              value={formData.status} 
              onChange={(v: string) => setFormData({...formData, status: v})} 
              options={[
                { label: 'Open', value: 'open' },
                { label: 'In Progress', value: 'in-progress' },
                { label: 'Resolved', value: 'resolved' }
              ]} 
            />
          )}
        </>
      )}

      <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-[#E0E8E0]">
        <button type="button" onClick={onCancel} className="px-6 py-2 text-[#556B55] font-bold hover:bg-[#E0E8E0] rounded-xl transition-all">
          {i18n.language === 'en' ? 'Cancel' : 'বাতিল'}
        </button>
        <button type="submit" className="px-6 py-2 bg-[#4CAF50] text-white font-bold rounded-xl hover:bg-[#43A047] transition-all shadow-lg shadow-[#4CAF50]/20 flex items-center gap-2">
          <Save size={20} />
          {i18n.language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
        </button>
      </div>
    </form>
  );
}

export function Input({ label, value, onChange, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-[#556B55] uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-4 py-2 bg-white border border-[#E0E8E0] rounded-xl focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all"
        {...props}
      />
    </div>
  );
}

export function Textarea({ label, value, onChange, className, ...props }: any) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-bold text-[#556B55] uppercase tracking-wider">{label}</label>
      <textarea 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-4 py-2 bg-white border border-[#E0E8E0] rounded-xl focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all min-h-[100px]"
        {...props}
      />
    </div>
  );
}

export function Select({ label, value, onChange, options, ...props }: any) {
  const { i18n } = useTranslation();
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-[#556B55] uppercase tracking-wider">{label}</label>
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-4 py-2 bg-white border border-[#E0E8E0] rounded-xl focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all"
        {...props}
      >
        <option value="">{i18n.language === 'en' ? 'Select...' : 'বাছাই করুন...'}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function ImageUploadInput({ label, value, onChange, folder = 'krishi-admin' }: any) {
  const { i18n } = useTranslation();
  const [uploading, setUploading] = React.useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const { uploadToCloudinary } = await import('../lib/imageUtils');
        const url = await uploadToCloudinary(file, folder);
        onChange(url);
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#556B55] uppercase tracking-wider">{label}</label>
        {uploading && (
          <span className="text-[10px] text-[#4CAF50] font-bold animate-pulse">
            {i18n.language === 'en' ? 'Uploading to Cloudinary...' : 'ক্লাউডিনারিতে আপলোড হচ্ছে...'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={value || ''} 
          onChange={e => onChange(e.target.value)} 
          placeholder={i18n.language === 'en' ? "https://... or upload photo" : "https://... অথবা ছবি আপলোড করুন"}
          className="flex-1 px-4 py-2 bg-white border border-[#E0E8E0] rounded-xl focus:ring-2 focus:ring-[#4CAF50] outline-none transition-all text-sm"
        />
        <label className="px-3 py-2 bg-[#F0F5F0] hover:bg-[#E8F5E9] text-[#1B301B] rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0">
          {i18n.language === 'en' ? 'Upload' : 'ছবি আপলোড'}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {value && (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E0E8E0] mt-1">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

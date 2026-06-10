import { useTranslation } from 'react-i18next';
import { AlertTriangle, Sprout, Cpu, ShoppingCart } from 'lucide-react';

export function PestWarning() {
  const { i18n } = useTranslation();
  return (
    <div className="p-8 text-center space-y-4">
      <AlertTriangle size={64} className="mx-auto text-orange-500" />
      <h1 className="text-3xl font-black">{i18n.language === 'en' ? 'Pest Warning Map' : 'বালাই সতর্কবার্তা ম্যাপ'}</h1>
      <p className="text-[#556B55]">{i18n.language === 'en' ? 'Coming Soon: Real-time pest alerts for your area.' : 'শীঘ্রই আসছে: আপনার এলাকার জন্য রিয়েল-টাইম বালাই সতর্কবার্তা।'}</p>
    </div>
  );
}

export function SeedBank() {
  const { i18n } = useTranslation();
  return (
    <div className="p-8 text-center space-y-4">
      <Sprout size={64} className="mx-auto text-green-500" />
      <h1 className="text-3xl font-black">{i18n.language === 'en' ? 'Seed Bank & Exchange' : 'বীজ ব্যাংক ও বিনিময়'}</h1>
      <p className="text-[#556B55]">{i18n.language === 'en' ? 'Coming Soon: Exchange high-quality seeds with other farmers.' : 'শীঘ্রই আসছে: অন্যান্য কৃষকদের সাথে উন্নত মানের বীজ বিনিময় করুন।'}</p>
    </div>
  );
}

export function IoTDashboard() {
  const { i18n } = useTranslation();
  return (
    <div className="p-8 text-center space-y-4">
      <Cpu size={64} className="mx-auto text-blue-500" />
      <h1 className="text-3xl font-black">{i18n.language === 'en' ? 'Smart Irrigation Dashboard' : 'স্মার্ট সেচ ড্যাশবোর্ড'}</h1>
      <p className="text-[#556B55]">{i18n.language === 'en' ? 'Coming Soon: Monitor soil moisture and control irrigation remotely.' : 'শীঘ্রই আসছে: মাটির আর্দ্রতা পর্যবেক্ষণ এবং দূর থেকে সেচ নিয়ন্ত্রণ করুন।'}</p>
    </div>
  );
}

export function DirectConsumer() {
  const { i18n } = useTranslation();
  return (
    <div className="p-8 text-center space-y-4">
      <ShoppingCart size={64} className="mx-auto text-purple-500" />
      <h1 className="text-3xl font-black">{i18n.language === 'en' ? 'Direct to Consumer' : 'সরাসরি ভোক্তা সংযোগ'}</h1>
      <p className="text-[#556B55]">{i18n.language === 'en' ? 'Coming Soon: Sell your products directly to city consumers.' : 'শীঘ্রই আসছে: সরাসরি শহরের ভোক্তাদের কাছে আপনার পণ্য বিক্রি করুন।'}</p>
    </div>
  );
}

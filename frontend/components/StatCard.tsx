import type { ComponentType, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: ComponentType<{ size?: number }>
  colorClass: string;
  isActive?: boolean;
  onClick?: () => void;
  subtext?: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass, isActive, onClick, subtext }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`p-6 rounded-2xl shadow-sm border transition-all duration-500 flex flex-col cursor-pointer ${
      isActive
        ? 'border-slate-100 bg-blue-50/30 shadow-xl transform scale-[1.02]'
        : 'border-slate-100 bg-white hover:shadow-md'
    }`}
  >
    <div className="flex items-center space-x-4 mb-3">
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
    {subtext && (
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtext}</p>
    )}
  </motion.div>
);

export default StatCard;

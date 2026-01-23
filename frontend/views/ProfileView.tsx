import { motion } from 'framer-motion';
import { IdCard, Mail, Phone, User, UserCircle2 } from 'lucide-react';
import type { Employee } from '../types';
import { PROFILE_BANNER_URL } from '../data';

const ProfileView = ({ employee }: { employee: Employee | null }) => {
  if (!employee) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 p-10 text-center text-slate-500">
        No employee profile loaded.
      </div>
    );
  }
  const detailItems = [
    { icon: IdCard, label: 'Employee Number', value: employee.employeeNumber },
    { icon: User, label: 'Employee Name', value: employee.name },
    { icon: UserCircle2, label: 'Manager Name', value: employee.managerName },
    { icon: Mail, label: 'Email Address', value: employee.email },
    { icon: Phone, label: 'Phone Number', value: employee.phone }
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative">
        <div
          className="h-56 relative overflow-hidden bg-slate-900"
          style={{
            backgroundImage: `url(${PROFILE_BANNER_URL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
        </div>
        <div className="px-12 pb-16 relative">
          <div className="relative -mt-24 mb-10 flex flex-col items-center">
            <div className="relative p-2 bg-white rounded-[2.5rem] shadow-xl border border-slate-50">
              <div className="w-40 h-40 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white overflow-hidden relative">
                <User size={80} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{employee.name}</h2>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <span className="text-blue-600 font-bold uppercase text-xs tracking-widest">{employee.designation}</span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                <span className="text-slate-400 font-medium text-xs">{employee.department}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-4 group">
                <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl transition-all duration-300">
                  <item.icon size={20} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">{item.label}</label>
                  <p className="text-slate-800 font-bold group-hover:text-blue-900 transition-colors">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileView;

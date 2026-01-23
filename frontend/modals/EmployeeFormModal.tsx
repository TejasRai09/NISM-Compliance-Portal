import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emp: Partial<Employee>) => void;
  employee?: Employee;
}

const EmployeeFormModal = ({ isOpen, onClose, onSubmit, employee }: EmployeeFormModalProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || {
      employeeNumber: '',
      name: '',
      designation: '',
      department: '',
      location: '',
      email: '',
      phone: '',
      managerEmail: '',
      managerEmployeeNo: '',
      managerName: ''
    }
  );

  useEffect(() => {
    if (employee) setFormData(employee);
    else
      setFormData({
        employeeNumber: '',
        name: '',
        designation: '',
        department: '',
        location: '',
        email: '',
        phone: '',
        managerEmail: '',
        managerEmployeeNo: '',
        managerName: ''
      });
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const inputBaseClass =
    'bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 ring-indigo-100 focus:bg-white focus:border-indigo-400 transition-all outline-none placeholder:text-slate-400 shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">Fill in the professional details below.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <input
                required
                className={inputBaseClass + ' w-full'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Siddharth Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employee Number</label>
              <input
                required
                disabled={!!employee}
                className={inputBaseClass + ' w-full ' + (employee ? 'opacity-50 cursor-not-allowed' : '')}
                value={formData.employeeNumber}
                onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                placeholder="e.g. EMP-7241"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Designation</label>
              <input
                required
                className={inputBaseClass + ' w-full'}
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior Wealth Manager"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
              <select
                required
                className={inputBaseClass + ' w-full'}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">Select Department</option>
                <option value="Trading">Trading</option>
                <option value="Customer Care">Customer Care</option>
                <option value="Back Office - Trading">Back Office - Trading</option>
                <option value="Human Resource">Human Resource</option>
                <option value="Back Office - DP & MF">Back Office - DP & MF</option>
                <option value="IT">IT</option>
                <option value="Programmer">Programmer</option>
                <option value="Product">Product</option>
                <option value="Accounts">Accounts</option>
                <option value="RMS - Equity">RMS - Equity</option>
                <option value="RMS - Commodity">RMS - Commodity</option>
                <option value="Management">Management</option>
                <option value="Secretarial">Secretarial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Corporate Email</label>
              <input
                required
                type="email"
                className={inputBaseClass + ' w-full'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. siddharth@zuari.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
              <input
                required
                className={inputBaseClass + ' w-full'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Manager Name</label>
              <input
                required
                className={inputBaseClass + ' w-full'}
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="e.g. Vikram Aditya Mehta"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Work Location</label>
              <input
                required
                className={inputBaseClass + ' w-full'}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Mumbai - Corporate Office"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Manager Email</label>
              <input
                required
                type="email"
                className={inputBaseClass + ' w-full'}
                value={formData.managerEmail}
                onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                placeholder="e.g. manager@zuari.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Manager Employee No</label>
              <input
                required
                className={inputBaseClass + ' w-full'}
                value={formData.managerEmployeeNo}
                onChange={(e) => setFormData({ ...formData, managerEmployeeNo: e.target.value })}
                placeholder="e.g. EMP-1020"
              />
            </div>
          </div>
          <div className="pt-6 flex items-center space-x-4 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              {employee ? 'Save Changes' : 'Create Employee Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EmployeeFormModal;

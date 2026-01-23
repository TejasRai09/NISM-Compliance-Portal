import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  FilePlus,
  FileText,
  Info,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Upload,
  UserCircle2,
  XCircle
} from 'lucide-react';
import type { ActiveView, Certificate, CertStatus, Employee } from '../types';
import { INITIAL_CERTS, LOGO_URL } from '../data';
import { getStatusColor } from '../utils';
import BackgroundDecoration from '../components/BackgroundDecoration';
import StatCard from '../components/StatCard';
import ProfileView from '../views/ProfileView';

const EmployeePortal = ({ employee, onLogout }: { employee: Employee | null; onLogout: () => void }) => {
  const [view, setView] = useState<ActiveView>('dashboard');
  const [certs, setCerts] = useState<Certificate[]>(INITIAL_CERTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CertStatus | 'All'>('All');
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [certificatePage, setCertificatePage] = useState(1);

  const currentEmployee = employee;

  const stats = useMemo(
    () => ({
      total: certs.length,
      compliant: certs.filter((c) => c.status === 'Compliant').length,
      expiring: certs.filter((c) => c.status === 'Expiring Soon').length,
      expired: certs.filter((c) => c.status === 'Expired').length
    }),
    [certs]
  );

  const filteredCerts = useMemo(() => {
    return certs.filter((c) => {
      const matchesSearch =
        c.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.certNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [certs, searchTerm, statusFilter]);

  const certificatesPerPage = 6;
  const totalCertificatePages = Math.max(1, Math.ceil(filteredCerts.length / certificatesPerPage));
  const pagedCertificates = useMemo(() => {
    const startIndex = (certificatePage - 1) * certificatesPerPage;
    return filteredCerts.slice(startIndex, startIndex + certificatesPerPage);
  }, [filteredCerts, certificatePage]);

  useEffect(() => {
    setCertificatePage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const loadModules = async () => {
      setModulesError(null);
      try {
        const res = await fetch('/api/certificates/types');
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to load modules');
        setModuleOptions((payload.data || []).map((row: { name: string }) => row.name));
      } catch (error) {
        setModulesError(String(error));
        setModuleOptions([]);
      }
    };
    loadModules();
  }, []);

  const loadCertificates = async () => {
    if (!currentEmployee?.employeeNumber && !currentEmployee?.email) {
      setToast({ message: 'Employee details not loaded. Please log in again.', type: 'error' });
      return;
    }
    const query = currentEmployee?.employeeNumber
      ? `employeeNumber=${encodeURIComponent(currentEmployee.employeeNumber)}`
      : `email=${encodeURIComponent(currentEmployee?.email || '')}`;
    try {
      const res = await fetch(`/api/certificates?${query}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load certificates');
      setCerts(payload.data || []);
    } catch {
      setCerts([]);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [currentEmployee?.employeeNumber]);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEmployee?.employeeNumber) return;
    const formData = new FormData(e.currentTarget);
    formData.append('employeeNumber', currentEmployee.employeeNumber);
    try {
      const res = await fetch('/api/certificates', { method: 'POST', body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Upload failed');
      await loadCertificates();
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setView('dashboard');
      setToast({ message: 'Certificate submitted for review.', type: 'success' });
    } catch {
      setToast({ message: 'Upload failed. Please try again.', type: 'error' });
    }
  };

  const inputBaseClass =
    'bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all outline-none placeholder:text-slate-400 shadow-sm';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <motion.aside initial={{ x: -250 }} animate={{ x: 0 }} className="w-72 bg-white border-r border-slate-100 flex flex-col z-20">
        <div className="border-b border-slate-50 bg-white">
          <img src={LOGO_URL} alt="Logo" className="w-full h-24 object-contain block" />
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>My Dashboard</span>
          </button>
          <button
            onClick={() => setView('upload')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'upload' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FilePlus size={20} />
            <span>Upload Certificate</span>
          </button>
          <button
            onClick={() => setView('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'profile' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <UserCircle2 size={20} />
            <span>My Profile</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors font-bold text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 relative overflow-y-auto">
        <BackgroundDecoration />
        <div className="relative z-10 p-10 max-w-7xl mx-auto">
          {toast && (
            <div
              className={`mb-6 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-rose-600 text-white shadow-rose-200'
              }`}
            >
              {toast.message}
            </div>
          )}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {view === 'dashboard' ? 'Compliance Overview' : view === 'upload' ? 'Upload Certification' : 'Employee Profile'}
              </h1>
              <p className="text-slate-500 mt-1 font-medium tracking-tight">
                Portal: {currentEmployee?.name || 'Employee'} • Zuari Finserv Ltd
              </p>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Modules"
                    value={stats.total}
                    icon={FileText}
                    colorClass="bg-blue-50 text-blue-600"
                    isActive={statusFilter === 'All'}
                    onClick={() => setStatusFilter('All')}
                  />
                  <StatCard
                    title="Compliant"
                    value={stats.compliant}
                    icon={CheckCircle}
                    colorClass="bg-emerald-50 text-emerald-600"
                    isActive={statusFilter === 'Compliant'}
                    onClick={() => setStatusFilter('Compliant')}
                  />
                  <StatCard
                    title="Expiring Soon"
                    value={stats.expiring}
                    icon={Clock}
                    colorClass="bg-amber-50 text-amber-600"
                    isActive={statusFilter === 'Expiring Soon'}
                    onClick={() => setStatusFilter('Expiring Soon')}
                  />
                  <StatCard
                    title="Expired"
                    value={stats.expired}
                    icon={XCircle}
                    colorClass="bg-rose-50 text-rose-600"
                    isActive={statusFilter === 'Expired'}
                    onClick={() => setStatusFilter('Expired')}
                  />
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <h2 className="text-xl font-bold text-slate-800">My Certificates</h2>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search by module..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`${inputBaseClass} pl-10 w-full`}
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as CertStatus | 'All')}
                        className={`${inputBaseClass} w-full md:w-48 cursor-pointer font-medium text-slate-600`}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Compliant">Compliant Only</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Expired">Expired Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module Name</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cert Number</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pagedCertificates.map((cert) => (
                          <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{cert.moduleName}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{cert.certNumber}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {new Date(cert.expiryDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(
                                  cert.status
                                )}`}
                              >
                                {cert.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {cert.filePath ? (
                                <button
                                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                  onClick={() => window.open(cert.filePath, '_blank')}
                                >
                                  <Download size={16} />
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredCerts.length === 0 && (
                      <div className="py-16 text-center text-slate-500">No certificates found.</div>
                    )}
                  </div>
                  {filteredCerts.length > 0 && (
                    <div className="p-6 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                        Page {certificatePage} of {totalCertificatePages}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCertificatePage((page) => Math.max(1, page - 1))}
                          disabled={certificatePage === 1}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setCertificatePage((page) => Math.min(totalCertificatePages, page + 1))}
                          disabled={certificatePage === totalCertificatePages}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
              >
                <div className="lg:col-span-7">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-blue-50/50 pointer-events-none">
                      <Upload size={120} />
                    </div>
                    <form onSubmit={handleUpload} className="space-y-6 relative z-10">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">NISM Module</label>
                        <select name="moduleName" required className={`${inputBaseClass} w-full`}>
                          <option value="">Select Module</option>
                          {moduleOptions.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        {modulesError && <p className="text-xs text-rose-500 mt-2">{modulesError}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Certificate Number</label>
                        <input
                          name="certNumber"
                          required
                          type="text"
                          placeholder="NISM-2024-XXXXX"
                          className={`${inputBaseClass} w-full`}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Issue Date</label>
                          <input name="issueDate" required type="date" className={`${inputBaseClass} w-full`} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Date</label>
                          <input name="expiryDate" required type="date" className={`${inputBaseClass} w-full`} />
                        </div>
                      </div>
                      <div className="pt-4">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Upload Document (PDF/JPG)</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          name="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          required
                          onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || '')}
                        />
                        <div
                          className="border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={32} className="text-slate-300 mb-3 group-hover:text-blue-500 transition-colors" />
                          <p className="text-sm text-slate-400 font-medium text-center">
                            {selectedFileName ? selectedFileName : 'Click to browse or drag and drop file'}
                          </p>
                          <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold tracking-wider">Max size 5MB</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 pt-6">
                        <button
                          type="submit"
                          className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-sm"
                        >
                          Register Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => setView('dashboard')}
                          className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Info size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Upload Guidelines</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <CheckCircle2 size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-500 leading-relaxed">
                          <span className="font-bold text-slate-700">File Format:</span> Only PDF or JPG scans are accepted.
                        </p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle2 size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-500 leading-relaxed">
                          <span className="font-bold text-slate-700">Legibility:</span> Ensure the Certificate Number and Expiry
                          Date are visible.
                        </p>
                      </li>
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute -bottom-4 -right-4 text-white/5 rotate-12">
                      <ShieldCheck size={160} />
                    </div>
                    <h3 className="text-lg font-bold mb-6 relative z-10">Verification Journey</h3>
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-black">1</div>
                        <div>
                          <p className="text-sm font-bold">Document Upload</p>
                          <p className="text-[11px] text-slate-400">Securely stored in cloud</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black">2</div>
                        <div>
                          <p className="text-sm font-bold">Verification Process</p>
                          <p className="text-[11px] text-slate-400">Validation against NISM data</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {view === 'profile' && <ProfileView employee={currentEmployee} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default EmployeePortal;

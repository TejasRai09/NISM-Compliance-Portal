import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  Edit3,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  TableProperties,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Users,
  XCircle
} from 'lucide-react';
import type { ActiveView, Certificate, CertStatus, Employee } from '../types';
import { LOGO_URL, MOCK_EMPLOYEES, PENDING_REVIEWS } from '../data';
import { getStatusColor } from '../utils';
import BackgroundDecoration from '../components/BackgroundDecoration';
import StatCard from '../components/StatCard';
import ModulePieChart from '../components/ModulePieChart';
import EmployeeFormModal from '../modals/EmployeeFormModal';
import ProfileView from '../views/ProfileView';

const AdminPortal = ({ onLogout }: { onLogout: () => void }) => {
  const [view, setView] = useState<ActiveView>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [reviews, setReviews] = useState<Certificate[]>(PENDING_REVIEWS);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<CertStatus | 'All'>('All');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [employeePage, setEmployeePage] = useState(1);
  const [certificatePage, setCertificatePage] = useState(1);
  const [adminStats, setAdminStats] = useState({
    totalEmployees: 0,
    complianceRate: '—',
    pendingReviews: 0,
    criticalExpirations: 0
  });
  const [departmentCompliance, setDepartmentCompliance] = useState<
    { department: string; percent: number; compliantEmployees: number; totalEmployees: number }[]
  >([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [moduleStats, setModuleStats] = useState<{ moduleName: string; moduleCount: number; percent: number }[]>([]);
  const [moduleStatsError, setModuleStatsError] = useState<string | null>(null);
  const pageSize = 7;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [mandatoryCountByEmployee, setMandatoryCountByEmployee] = useState<Record<string, number>>({});

  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderToast, setReminderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [complianceMatrix, setComplianceMatrix] = useState<{
    employeeNumber: string;
    employeeName: string;
    department: string;
    email: string;
    certs: { certType: string; status: string }[];
  }[]>([]);
  const [complianceMatrixError, setComplianceMatrixError] = useState<string | null>(null);
  const [complianceSearch, setComplianceSearch] = useState('');
  const [complianceDeptFilter, setComplianceDeptFilter] = useState('All');
  const [sendingReminderFor, setSendingReminderFor] = useState<string | null>(null);

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    setReminderToast(null);
    try {
      const res = await fetch('/api/admin/send-reminders', { method: 'POST' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send reminders');
      setReminderToast({ message: payload.message, type: 'success' });
    } catch (error) {
      setReminderToast({ message: String(error), type: 'error' });
    } finally {
      setIsSendingReminders(false);
      setTimeout(() => setReminderToast(null), 5000);
    }
  };

  const handleDownloadMasterReport = () => {
    window.open('/api/admin/master-report', '_blank');
  };

  const loadComplianceMatrix = async () => {
    setComplianceMatrixError(null);
    try {
      const res = await fetch('/api/admin/compliance-matrix');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load compliance matrix');
      setComplianceMatrix(payload.data || []);
    } catch (error) {
      setComplianceMatrixError(String(error));
      setComplianceMatrix([]);
    }
  };

  const handleSendIndividualReminder = async (employeeNumber: string) => {
    setSendingReminderFor(employeeNumber);
    try {
      const res = await fetch(`/api/admin/send-reminder/${encodeURIComponent(employeeNumber)}`, { method: 'POST' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send reminder');
      setReminderToast({ message: payload.message, type: 'success' });
    } catch (error) {
      setReminderToast({ message: String(error), type: 'error' });
    } finally {
      setSendingReminderFor(null);
      setTimeout(() => setReminderToast(null), 4000);
    }
  };

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    setEmployeesError(null);
    try {
      const res = await fetch('/api/employees');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load employees');
      const empList: Employee[] = payload.data || [];
      setEmployees(empList);
      const counts: Record<string, number> = {};
      await Promise.all(
        empList.map(async (emp) => {
          try {
            const r = await fetch(`/api/employees/${encodeURIComponent(emp.employeeNumber)}/mandatory-certificates`);
            const p = await r.json();
            counts[emp.employeeNumber] = (p.data || []).length;
          } catch {
            counts[emp.employeeNumber] = 0;
          }
        })
      );
      setMandatoryCountByEmployee(counts);
    } catch (error) {
      setEmployeesError(String(error));
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [certificatesError, setCertificatesError] = useState<string | null>(null);

  const loadAllCertificates = async () => {
    try {
      const res = await fetch('/api/certificates');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load certificates');
      setAllCertificates(payload.data || []);
    } catch (error) {
      setCertificatesError(String(error));
      setAllCertificates([]);
    }
  };

  const loadReviewQueue = async () => {
    try {
      const res = await fetch('/api/certificates/review');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load review queue');
      setReviews(payload.data || []);
    } catch (error) {
      setReviews([]);
    }
  };

  useEffect(() => {
    loadAllCertificates();
    loadReviewQueue();
    loadAdminStats();
    loadModuleStats();
    loadComplianceMatrix();
  }, []);

  const filteredCertificates = useMemo(() => {
    return allCertificates.filter((c) => {
      const matchesSearch =
        c.moduleName.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
        c.certNumber.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
        c.employeeName?.toLowerCase().includes(certSearchTerm.toLowerCase());
      const matchesStatus = certStatusFilter === 'All' || c.status === certStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allCertificates, certSearchTerm, certStatusFilter]);

  const certificateTotalPages = Math.max(1, Math.ceil(filteredCertificates.length / pageSize));
  const currentCertificatePage = Math.min(certificatePage, certificateTotalPages);
  const pagedCertificates = useMemo(() => {
    const start = (currentCertificatePage - 1) * pageSize;
    return filteredCertificates.slice(start, start + pageSize);
  }, [filteredCertificates, currentCertificatePage]);

  const loadAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load admin stats');
      setAdminStats({
        totalEmployees: payload.data.totalEmployees ?? 0,
        complianceRate: payload.data.complianceRate ?? '—',
        pendingReviews: payload.data.pendingReviews ?? 0,
        criticalExpirations: payload.data.criticalExpirations ?? 0
      });
      setDepartmentCompliance(payload.data.departmentCompliance || []);
      setStatsError(null);
    } catch (error) {
      setStatsError(String(error));
    }
  };

  const loadModuleStats = async () => {
    try {
      const res = await fetch('/api/admin/module-stats');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load module stats');
      setModuleStats(payload.data || []);
      setModuleStatsError(null);
    } catch (error) {
      setModuleStatsError(String(error));
      setModuleStats([]);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const validCertificateCountByEmployee = useMemo(() => {
    const counts: Record<string, number> = {};
    allCertificates.forEach((cert) => {
      if (!cert.employeeNumber) return;
      if (cert.status === 'Compliant' || cert.status === 'Expiring Soon') {
        counts[cert.employeeNumber] = (counts[cert.employeeNumber] || 0) + 1;
      }
    });
    return counts;
  }, [allCertificates]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(employeePage, totalPages);
  const pagedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setEmployeePage(1);
  }, [searchTerm, deptFilter]);

  useEffect(() => {
    setCertificatePage(1);
  }, [certSearchTerm, certStatusFilter]);

  const handleReviewAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/certificates/${id}/${action}`, { method: 'POST' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Action failed');
      await loadReviewQueue();
      await loadAllCertificates();
      await loadAdminStats();
    } catch (error) {
      setCertificatesError(String(error));
    }
  };

  const handleDeleteEmployee = async (employeeNumber: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(employeeNumber)}`, { method: 'DELETE' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to delete employee');
      await loadEmployees();
    } catch (error) {
      setEmployeesError(String(error));
    }
  };

  const handleEmployeeSubmit = async (data: Partial<Employee>) => {
    try {
      const method = editingEmployee ? 'PUT' : 'POST';
      const url = editingEmployee
        ? `/api/employees/${encodeURIComponent(editingEmployee.employeeNumber)}`
        : '/api/employees';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to save employee');
      setIsModalOpen(false);
      setEditingEmployee(undefined);
      await loadEmployees();
      await loadComplianceMatrix();
    } catch (error) {
      setEmployeesError(String(error));
    }
  };

  const inputBaseClass =
    'bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 ring-indigo-100 focus:bg-white focus:border-indigo-300 transition-all outline-none placeholder:text-slate-400 shadow-sm';
  const formatDisplayDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <motion.aside initial={{ x: -250 }} animate={{ x: 0 }} className="w-72 bg-white border-r border-slate-100 flex flex-col z-20">
        <div className="p-8 border-b border-slate-50">
          <img src={LOGO_URL} alt="Logo" className="w-full h-12 object-contain" />
          <div className="mt-4 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full inline-block">
            <span className="text-[10px] font-black uppercase tracking-widest">Admin Control</span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Admin Dashboard</span>
          </button>
          <button
            onClick={() => setView('employees')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'employees' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users size={20} />
            <span>Workforce Directory</span>
          </button>
          <button
            onClick={() => setView('certificates')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'certificates' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ClipboardList size={20} />
            <span>All Certificates</span>
          </button>
          <button
            onClick={() => setView('review')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'review' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className="relative">
              <ShieldCheck size={20} />
              {reviews.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />}
            </div>
            <span>Review Queue</span>
          </button>
          <button
            onClick={() => setView('compliance')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'compliance' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <TableProperties size={20} />
            <span>Compliance Matrix</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors font-bold text-sm"
          >
            <LogOut size={16} />
            <span>Logout Admin</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 relative overflow-y-auto">
        <BackgroundDecoration />
        <div className="relative z-10 p-10 max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {view === 'dashboard'
                  ? 'Organization Insights'
                  : view === 'employees'
                    ? 'Workforce Directory'
                    : view === 'certificates'
                      ? 'Certificates Repository'
                      : view === 'review'
                        ? 'Verification Queue'
                        : view === 'compliance'
                          ? 'Compliance Matrix'
                          : 'Admin Profile'}
              </h1>
              <p className="text-slate-500 mt-1 font-medium tracking-tight">Managing compliance for Zuari Finserv Ltd</p>
            </div>
            {view === 'dashboard' && (
              <div className="flex flex-col items-end gap-3">
                {reminderToast && (
                  <div
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg ${
                      reminderToast.type === 'success'
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-rose-600 text-white shadow-rose-200'
                    }`}
                  >
                    {reminderToast.message}
                  </div>
                )}
                <button
                  onClick={handleSendReminders}
                  disabled={isSendingReminders}
                  className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-100 transition-all"
                >
                  <Bell size={16} />
                  <span>{isSendingReminders ? 'Sending...' : 'Send Expiry Reminders'}</span>
                </button>
                <button
                  onClick={handleDownloadMasterReport}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 transition-all"
                >
                  <Download size={16} />
                  <span>Download Master Report</span>
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alerts at 30, 60 &amp; 90 days • Auto-runs daily at 9 AM</p>
              </div>
            )}
            {view === 'employees' && (
              <button
                onClick={() => {
                  setEditingEmployee(undefined);
                  setIsModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Employee</span>
              </button>
            )}
            {view === 'certificates' && (
              <button
                onClick={handleDownloadMasterReport}
                className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-2">
                <Download size={18} />
                <span>Download Master Report</span>
              </button>
            )}
            {view === 'compliance' && (
              <button
                onClick={handleSendReminders}
                disabled={isSendingReminders}
                className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-100 transition-all"
              >
                <Send size={16} />
                <span>{isSendingReminders ? 'Sending...' : 'Send All Reminders'}</span>
              </button>
            )}
          </header>

          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="admin-dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="Total Employees" value={adminStats.totalEmployees} icon={Users} colorClass="bg-indigo-50 text-indigo-600" subtext="Across all offices" />
                  <StatCard title="Compliance Rate" value={adminStats.complianceRate} icon={BarChart3} colorClass="bg-emerald-50 text-emerald-600" subtext="Target: 95%" />
                  <StatCard title="Pending Review" value={adminStats.pendingReviews} icon={Clock} colorClass="bg-blue-50 text-blue-600" subtext="Action required" onClick={() => setView('review')} />
                  <StatCard title="Critical Expirations" value={adminStats.criticalExpirations} icon={ShieldAlert} colorClass="bg-rose-50 text-rose-600" subtext="Next 30 days" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Department Compliance</h3>
                    {statsError && <div className="py-6 text-center text-rose-500">{statsError}</div>}
                    {!statsError && departmentCompliance.length === 0 && (
                      <div className="py-10 text-center text-slate-500">No department compliance data available.</div>
                    )}
                    {!statsError && departmentCompliance.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {departmentCompliance.map((d, i) => (
                          <div key={d.department} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                              <span className="text-slate-500">{d.department}</span>
                              <span className="text-slate-800">{d.percent}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${d.percent}%` }}
                                transition={{ duration: 1, delay: i * 0.05 }}
                                className="h-full bg-indigo-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <ShieldCheck size={120} />
                    </div>
                    <div>
                      {moduleStatsError && <p className="text-rose-300 text-sm">{moduleStatsError}</p>}
                      {!moduleStatsError && moduleStats.length === 0 && (
                        <p className="text-slate-400 text-sm">No analytics data available yet.</p>
                      )}
                      {!moduleStatsError && moduleStats.length > 0 && (
                        <div className="space-y-6">
                          <ModulePieChart data={moduleStats} />
                          <div className="max-h-44 overflow-auto pr-2 grid grid-cols-1 gap-2">
                            {moduleStats.map((item) => (
                              <div key={item.moduleName} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-xs text-slate-200 font-semibold truncate" title={item.moduleName}>
                                    {item.moduleName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{item.moduleCount} certificates</p>
                                </div>
                                <span className="text-sm text-white font-black">{item.percent}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'employees' && (
              <motion.div key="admin-employees" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                  <h2 className="text-xl font-bold text-slate-800">Workforce Status</h2>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${inputBaseClass} pl-10 w-full`}
                      />
                    </div>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className={`${inputBaseClass} w-full md:w-56 cursor-pointer font-medium text-slate-600`}
                    >
                      <option value="All">All Departments</option>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid Certs</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mandatory</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pagedEmployees.map((emp) => (
                        <tr key={emp.employeeNumber} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm">
                                <User size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold tracking-wider">{emp.employeeNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-600 tracking-tight">{emp.department}</p>
                            <p className="text-[10px] text-slate-400">{emp.designation}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border text-emerald-600 bg-emerald-50 border-emerald-100">
                              {(validCertificateCountByEmployee[emp.employeeNumber] ?? 0).toString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              (mandatoryCountByEmployee[emp.employeeNumber] ?? 0) > 0
                                ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                : 'text-slate-400 bg-slate-50 border-slate-100'
                            }`}>
                              {(mandatoryCountByEmployee[emp.employeeNumber] ?? 0).toString()} required
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp.employeeNumber)}
                                className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isLoadingEmployees && <div className="py-16 text-center text-slate-500">Loading employees...</div>}
                  {!isLoadingEmployees && employeesError && (
                    <div className="py-16 text-center text-rose-500">{employeesError}</div>
                  )}
                  {!isLoadingEmployees && !employeesError && filteredEmployees.length === 0 && (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Users size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No employees found matching these criteria.</p>
                    </div>
                  )}
                </div>
                {!isLoadingEmployees && !employeesError && filteredEmployees.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 text-sm text-slate-500">
                    <span>
                      Showing {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
                          currentPage === 1
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-slate-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setEmployeePage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
                          currentPage === totalPages
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'certificates' && (
              <motion.div key="admin-certs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-800">Organizational Certifications</h2>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search by name, module or cert #..."
                        value={certSearchTerm}
                        onChange={(e) => setCertSearchTerm(e.target.value)}
                        className={`${inputBaseClass} pl-10 w-full`}
                      />
                    </div>
                    <select
                      value={certStatusFilter}
                      onChange={(e) => setCertStatusFilter(e.target.value as CertStatus | 'All')}
                      className={`${inputBaseClass} w-full md:w-52 cursor-pointer font-medium text-slate-600`}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Compliant">Compliant</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certificate #</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pagedCertificates.map((cert) => (
                        <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-800">{cert.employeeName || '—'}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{cert.employeeNumber || '—'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-700">{cert.moduleName}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{cert.certNumber}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{new Date(cert.expiryDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(cert.status)}`}>
                              {cert.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {cert.filePath ? (
                              <button
                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                title="Download Document"
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
                  {certificatesError && <div className="py-10 text-center text-rose-500">{certificatesError}</div>}
                </div>
                {!certificatesError && filteredCertificates.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 text-sm text-slate-500">
                    <span>
                      Showing {(currentCertificatePage - 1) * pageSize + 1}–
                      {Math.min(currentCertificatePage * pageSize, filteredCertificates.length)} of {filteredCertificates.length}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCertificatePage((p) => Math.max(1, p - 1))}
                        disabled={currentCertificatePage === 1}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
                          currentCertificatePage === 1
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-slate-500">
                        Page {currentCertificatePage} of {certificateTotalPages}
                      </span>
                      <button
                        onClick={() => setCertificatePage((p) => Math.min(certificateTotalPages, p + 1))}
                        disabled={currentCertificatePage === certificateTotalPages}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
                          currentCertificatePage === certificateTotalPages
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'review' && (
              <motion.div key="admin-review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-100">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                      <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Queue is Clear</h3>
                    <p className="text-slate-500 mt-2">All pending NISM certifications have been reviewed.</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <motion.div
                      layout
                      key={rev.id}
                      className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8"
                    >
                      <div className="flex items-start space-x-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                          <FileText size={32} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-bold text-slate-800">{rev.moduleName}</h4>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-full border border-blue-100">
                              Pending Review
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            <p className="text-slate-400 font-bold uppercase tracking-wider">
                              Employee: <span className="text-slate-800">{rev.employeeName} ({rev.employeeNumber || '—'})</span>
                            </p>
                            <p className="text-slate-400 font-bold uppercase tracking-wider">
                              Cert #: <span className="text-slate-800">{rev.certNumber}</span>
                            </p>
                            <p className="text-slate-400 font-bold uppercase tracking-wider">
                              Issue Date: <span className="text-slate-800">{formatDisplayDate(rev.issueDate)}</span>
                            </p>
                            <p className="text-slate-400 font-bold uppercase tracking-wider">
                              Expiry Date: <span className="text-slate-800">{formatDisplayDate(rev.expiryDate)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 px-6 py-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                          <Eye size={16} />
                          <span>Preview</span>
                        </button>
                        <button
                          className="flex items-center space-x-2 px-6 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                          title="Download Document"
                          onClick={() => rev.filePath && window.open(rev.filePath, '_blank')}
                        >
                          <Download size={16} />
                          <span>Download</span>
                        </button>
                        <button onClick={() => handleReviewAction(rev.id, 'reject')} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <ThumbsDown size={20} />
                        </button>
                        <button
                          onClick={() => handleReviewAction(rev.id, 'approve')}
                          className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                        >
                          <ThumbsUp size={16} />
                          <span>Approve</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {view === 'compliance' && (
              <motion.div key="admin-compliance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={complianceSearch}
                        onChange={(e) => setComplianceSearch(e.target.value)}
                        className={`${inputBaseClass} pl-10 w-full`}
                      />
                    </div>
                    <select
                      value={complianceDeptFilter}
                      onChange={(e) => setComplianceDeptFilter(e.target.value)}
                      className={`${inputBaseClass} w-full md:w-56 cursor-pointer font-medium text-slate-600`}
                    >
                      <option value="All">All Departments</option>
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
                  {/* Legend */}
                  <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex-shrink-0">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Done</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> Pending</span>
                    <span className="flex items-center gap-1.5"><XCircle size={14} className="text-rose-500" /> Missing</span>
                  </div>
                </div>

                {complianceMatrixError && (
                  <div className="py-6 text-center text-rose-500 bg-white rounded-2xl border border-slate-100">{complianceMatrixError}</div>
                )}

                {!complianceMatrixError && complianceMatrix.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><TableProperties size={32} /></div>
                    <p className="text-slate-500 font-medium">No mandatory certificates assigned yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Assign mandatory certs when adding or editing employees.</p>
                  </div>
                )}

                {complianceMatrix
                  .filter((emp) => {
                    const matchSearch =
                      emp.employeeName.toLowerCase().includes(complianceSearch.toLowerCase()) ||
                      emp.employeeNumber.toLowerCase().includes(complianceSearch.toLowerCase());
                    const matchDept = complianceDeptFilter === 'All' || emp.department === complianceDeptFilter;
                    return matchSearch && matchDept;
                  })
                  .map((emp) => {
                    const done = emp.certs.filter((c) => c.status === 'Compliant' || c.status === 'Expiring Soon').length;
                    const total = emp.certs.length;
                    const allDone = done === total;
                    const pct = total ? Math.round((done / total) * 100) : 0;

                    return (
                      <motion.div
                        layout
                        key={emp.employeeNumber}
                        className={`bg-white rounded-[1.5rem] border shadow-sm p-6 ${allDone ? 'border-emerald-100' : 'border-slate-100'}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Employee info */}
                          <div className="flex items-center gap-4 lg:w-64 flex-shrink-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${allDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              <User size={22} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-800 truncate">{emp.employeeName}</p>
                              <p className="text-[10px] text-slate-400 font-bold tracking-wider">{emp.employeeNumber}</p>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{emp.department}</p>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="lg:w-32 flex-shrink-0 flex flex-col justify-center">
                            <div className="flex items-baseline gap-1 mb-1.5">
                              <span className={`text-xl font-black ${allDone ? 'text-emerald-600' : 'text-slate-800'}`}>{done}</span>
                              <span className="text-xs text-slate-400 font-bold">/ {total} done</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{pct}% complete</p>
                          </div>

                          {/* Cert badges */}
                          <div className="flex-1 flex flex-wrap gap-2">
                            {emp.certs.map((cert) => {
                              const isDone = cert.status === 'Compliant' || cert.status === 'Expiring Soon';
                              const isPending = cert.status === 'Pending Approval';
                              return (
                                <div
                                  key={cert.certType}
                                  title={`${cert.certType}\nStatus: ${cert.status}`}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border cursor-default max-w-[220px] ${
                                    isDone
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : isPending
                                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 size={12} className="flex-shrink-0" />
                                  ) : isPending ? (
                                    <Clock size={12} className="flex-shrink-0" />
                                  ) : (
                                    <XCircle size={12} className="flex-shrink-0" />
                                  )}
                                  <span className="truncate">{cert.certType.replace('NISM-Series-', 'NISM-').split(':')[0]}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Send reminder button */}
                          <div className="flex-shrink-0 flex items-center">
                            <button
                              onClick={() => handleSendIndividualReminder(emp.employeeNumber)}
                              disabled={sendingReminderFor === emp.employeeNumber || allDone}
                              title={allDone ? 'All certs complete — no reminder needed' : `Send reminder to ${emp.employeeName}`}
                              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm ${
                                allDone
                                  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                  : sendingReminderFor === emp.employeeNumber
                                  ? 'bg-amber-100 text-amber-600 cursor-wait'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                              }`}
                            >
                              <Send size={14} />
                              <span>{sendingReminderFor === emp.employeeNumber ? 'Sending…' : 'Remind'}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </motion.div>
            )}

            {view === 'profile' && <ProfileView employee={null} />}
          </AnimatePresence>
        </div>
      </main>

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(undefined);
        }}
        onSubmit={handleEmployeeSubmit}
        employee={editingEmployee}
      />
    </div>
  );
};

export default AdminPortal;

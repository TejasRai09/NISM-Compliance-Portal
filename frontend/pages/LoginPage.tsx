import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import type { Employee, UserRole } from '../types';
import BackgroundDecoration from '../components/BackgroundDecoration';
import { LOGO_URL } from '../data';

const LoginPage = ({ onLogin }: { onLogin: (role: UserRole, employee?: Employee) => void }) => {
  const [isLoggingIn, setIsLoggingIn] = useState<UserRole>(null);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetOtpRequested, setResetOtpRequested] = useState(false);

  const handleFormLogin = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoggingIn('employee');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Login failed');
      onLogin(payload.role || 'employee', payload.employee);
    } catch (error) {
      setIsLoggingIn(null);
      setStatusMessage(String(error));
      setToast({ message: String(error), type: 'error' });
    }
  };
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!email.toLowerCase().includes('adventz')) {
      setStatusMessage('Only Adventz email addresses can sign up.');
      setToast({ message: 'Only Adventz email addresses can sign up.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage('Passwords do not match.');
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send OTP');
      setOtpRequested(true);
      setStatusMessage('OTP sent to your email.');
      setToast({ message: 'OTP sent to your email address.', type: 'success' });
    } catch (error) {
      setStatusMessage(String(error));
      setToast({ message: String(error), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'OTP verification failed');
      setStatusMessage('Signup completed. You can now log in.');
      setToast({ message: 'User created successfully.', type: 'success' });
      setMode('login');
      setOtpRequested(false);
      setOtp('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatusMessage(String(error));
      setToast({ message: String(error), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (resetPassword !== resetConfirmPassword) {
      setStatusMessage('Passwords do not match.');
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, password: resetPassword, confirmPassword: resetConfirmPassword })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to send OTP');
      setResetOtpRequested(true);
      setStatusMessage('OTP sent to your email.');
      setToast({ message: 'OTP sent to your email address.', type: 'success' });
    } catch (error) {
      setStatusMessage(String(error));
      setToast({ message: String(error), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyResetOtp = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'OTP verification failed');
      setToast({ message: 'Password updated successfully.', type: 'success' });
      setStatusMessage('Password updated. You can now log in.');
      setMode('login');
      setResetOtpRequested(false);
      setResetOtp('');
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (error) {
      setStatusMessage(String(error));
      setToast({ message: String(error), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 text-sm text-slate-900 focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-400 transition-all outline-none placeholder:text-slate-400 shadow-sm';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      <BackgroundDecoration />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg p-10 glass-effect rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,51,102,0.1)] z-10 mx-4 border border-white relative overflow-hidden"
      >
        {toast && (
          <div
            className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg z-20 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-rose-600 text-white shadow-rose-200'
            }`}
          >
            {toast.message}
          </div>
        )}
        <div className="flex flex-col items-center mb-10 relative">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6 w-48">
            <img src={LOGO_URL} alt="Logo" className="w-full h-auto object-contain block mx-auto" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-black zuari-blue tracking-tighter leading-none mb-2">Z-PRISM</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Zuari Professional Records &amp; Information System for Management</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {!isLoggingIn ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {statusMessage && (
                <div className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-600 text-xs font-medium">{statusMessage}</div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleFormLogin} className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="email"
                    placeholder="Corporate Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Account Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setStatusMessage(null);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center justify-center space-x-3"
                >
                  <span>Login to Portal</span>
                  <ArrowRight size={18} />
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setStatusMessage(null);
                  }}
                  className="w-full py-5 bg-white text-indigo-700 border border-indigo-200 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-50 transition-all"
                >
                  Sign Up
                </button>
                </form>
              ) : mode === 'signup' ? (
                <form onSubmit={otpRequested ? handleVerifyOtp : handleSignupSubmit} className="space-y-6">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type="email"
                      placeholder="Corporate Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  {otpRequested && (
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:shadow-indigo-900/40 transition-all flex items-center justify-center space-x-3 disabled:opacity-70"
                  >
                    <span>{otpRequested ? 'Verify OTP' : 'Send OTP'}</span>
                    <ArrowRight size={18} />
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setStatusMessage(null);
                    }}
                    className="w-full py-5 bg-white text-blue-700 border border-blue-200 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-50 transition-all"
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={resetOtpRequested ? handleVerifyResetOtp : handleForgotPassword} className="space-y-6">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type="email"
                      placeholder="Corporate Email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New Password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  {resetOtpRequested && (
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 transition-all flex items-center justify-center space-x-3 disabled:opacity-70"
                  >
                    <span>{resetOtpRequested ? 'Verify OTP' : 'Send OTP'}</span>
                    <ArrowRight size={18} />
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setStatusMessage(null);
                    }}
                    className="w-full py-5 bg-white text-blue-700 border border-blue-200 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-50 transition-all"
                  >
                    Back to Login
                  </button>
                </form>
              )}


            </motion.div>
          ) : (
            <motion.div key="loading" className="flex flex-col items-center justify-center py-10">
              <div className="relative w-24 h-24 mb-8">
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <motion.circle
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                    cx="48"
                    cy="48"
                    r="44"
                    strokeWidth="4"
                    stroke={isLoggingIn === 'admin' ? '#4f46e5' : '#2563eb'}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx="48" cy="48" r="44" strokeWidth="4" stroke="#f1f5f9" fill="none" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    <ShieldCheck size={36} className={isLoggingIn === 'admin' ? 'text-indigo-600' : 'text-blue-600'} />
                  </motion.div>
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Verifying</h2>
              <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">Establishing session...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;

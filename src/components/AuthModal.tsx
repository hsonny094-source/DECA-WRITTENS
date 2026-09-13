import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { loginUser, registerUser } from '../services/storage';
import { ShieldCheck, UserCheck, Key, Lock, AlertCircle, X, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'student',
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>(defaultRole);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'login') {
      const res = loginUser(username, role, role === 'cluster_leader' ? pin : undefined);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Authentication failed');
      }
    } else {
      const res = registerUser({
        username,
        name,
        password,
        role,
        pin: role === 'cluster_leader' ? pin : undefined,
      });
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Account creation failed');
      }
    }
  };

  const handleQuickDemo = () => {
    setError(null);
    const res = loginUser('jordan_lee', 'student');
    if (res.success && res.user) {
      onSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            id="auth-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>DECA Written Exam Testing Terminal</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {tab === 'login' ? 'Sign In to Your Account' : 'Create Your Student Account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Access authentic DECA Entrepreneurship exam questions, official 70-minute timed exams, and performance tracking.
          </p>

          {/* Quick Demo Login */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Classroom test mode:</span>
            <button
              id="btn-quick-student"
              type="button"
              onClick={handleQuickDemo}
              className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-xs font-semibold text-white transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Continue as Student (Jordan Lee)</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              tab === 'login'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              tab === 'signup'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="role-student-select"
                onClick={() => setRole('student')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-medium transition ${
                  role === 'student'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>DECA Student</span>
              </button>

              <button
                type="button"
                id="role-leader-select"
                onClick={() => setRole('cluster_leader')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-medium transition ${
                  role === 'cluster_leader'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-600/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Cluster Leader</span>
              </button>
            </div>
          </div>

          {/* If signup, ask for full name */}
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="input-fullname"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <input
              id="input-username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. alex_deca"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="input-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* Cluster Leader PIN Requirement */}
          {role === 'cluster_leader' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center space-x-2 text-amber-900 text-xs font-bold mb-1">
                <Key className="w-4 h-4 text-amber-700" />
                <span>Advisor Authorization PIN</span>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                Advisor security code is required to access or create a Cluster Leader account.
              </p>
              <input
                id="input-leader-pin"
                type="password"
                maxLength={8}
                required
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter Advisor PIN"
                className="w-full px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
              />
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm hover:shadow"
          >
            {tab === 'login'
              ? `Sign In as ${role === 'cluster_leader' ? 'Cluster Leader' : 'Student'}`
              : `Create ${role === 'cluster_leader' ? 'Cluster Leader' : 'Student'} Account`}
          </button>
        </form>
      </div>
    </div>
  );
};

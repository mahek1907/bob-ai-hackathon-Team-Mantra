import React, { useState } from 'react';
import GridAnimation from '../components/GridAnimation';
import { 
  Zap, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu,
  Radio
} from 'lucide-react';

export default function LoginPage({ onLogin, onNavigateToSignup }) {
  const [email, setEmail] = useState('dispatcher@gridsentinel.ai');
  const [password, setPassword] = useState('Sentinel2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide valid credentials.');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'Elena Vance',
        email: email,
        role: 'Senior Reliability Dispatcher',
        org: 'Metro Power Authority',
        avatar: 'EV'
      });
    }, 450);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 font-sans">
      
      {/* Left Panel: Subtle, Sophisticated Power-Grid Visualization */}
      <div className="lg:w-1/2 relative min-h-[320px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-14 overflow-hidden bg-[#070c18]">
        {/* Animated Canvas */}
        <div className="absolute inset-0 z-0">
          <GridAnimation />
        </div>

        {/* Top Branding & Technical Telemetry Labels */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">GridSentinel</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                AI
              </span>
            </div>
          </div>

          {/* Technical Status Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
              GRID STATUS: <strong className="text-emerald-400 font-bold">ONLINE</strong>
            </span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
              LIVE MONITORING: <strong className="text-blue-400 font-bold">ACTIVE</strong>
            </span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
              DGA ANALYTICS: <strong className="text-slate-200 font-bold">IEEE C57.104</strong>
            </span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
              RISK INTELLIGENCE: <strong className="text-cyan-400 font-bold">REAL-TIME</strong>
            </span>
          </div>
        </div>

        {/* Center Product Statement */}
        <div className="relative z-10 max-w-md my-auto py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
            Predict failures before they become outages.
          </h1>
          <p className="text-sm text-slate-300 mt-2.5 font-normal leading-relaxed">
            Autonomous multi-variable risk index combining dissolved gas telemetry, meteorological compounding stress, and IBM Granite contingency dispatch.
          </p>
        </div>

        {/* Bottom Technical Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>SCADA Telemetry • 60.02 Hz</span>
          </div>
          <span className="text-slate-400">Team Mantra • AI Track</span>
        </div>
      </div>

      {/* Right Panel: Clean, Compact Enterprise Login Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#f8fafc]">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          
          {/* Logo & Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900">GridSentinel AI</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter your utility credentials to access the console.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@utility.org"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <a 
                  href="#demo" 
                  onClick={(e) => { e.preventDefault(); setEmail('dispatcher@gridsentinel.ai'); setPassword('Sentinel2026!'); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset to demo
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Remember workstation</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Demo environment: click Sign In to continue.'); }} className="text-slate-500 hover:text-slate-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Login Credentials Callout */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-500 font-sans">
              <span className="font-semibold text-slate-700">Demo Access</span>
              <span className="text-[11px] text-emerald-600 font-bold">Auto-Loaded</span>
            </div>
            <div className="text-slate-600 truncate">User: <strong className="text-slate-800">dispatcher@gridsentinel.ai</strong></div>
            <div className="text-slate-600">Role: <strong className="text-slate-800">Lead Reliability Dispatcher</strong></div>
          </div>

          {/* Link to Signup */}
          <div className="text-center text-xs text-slate-500 pt-1">
            <span>Don't have an operator profile? </span>
            <button
              type="button"
              onClick={onNavigateToSignup}
              className="font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Request Access / Sign Up
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

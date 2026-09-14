import React, { useState } from 'react';
import {
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu,
  Radio,
  Lock
} from 'lucide-react';
import GridPixelArt from '../components/GridPixelArt';

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
      setError('Please enter both email and password.');
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

  const handleResetDemo = (e) => {
    e.preventDefault();
    setEmail('dispatcher@gridsentinel.ai');
    setPassword('Sentinel2026!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Subtle Utility Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 -z-10"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-6xl w-full mx-auto">
        {/* Mobile-Only Top Brand Header (Compact) */}
        <div className="lg:hidden flex items-center justify-between pb-5 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">GridSentinel</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Power Grid Operations Console
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>

        {/* Two-Column Editorial Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* LEFT COLUMN: Brand, Substation Pixel Art & Engineering Telemetry */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 order-2 lg:order-1">

            {/* Desktop Brand Header */}
            <div className="hidden lg:block space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Mission-Critical Utility Infrastructure Console</span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-slate-900">
                    GridSentinel <span className="text-blue-600">AI</span>
                  </h1>
                  <p className="text-xs xl:text-sm text-slate-500 font-medium">
                    Power Grid Intelligence & Equipment Risk Management
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Pixel-Art Substation & SCADA Monitor Component */}
            <div className="w-full">
              <GridPixelArt />
            </div>

            {/* Technical Capability Badges / Verification Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-700">DGA Health</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  IEEE C57.104 & Duval Triangles
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-700">IBM Granite</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Granite 3.2 8B dispatch orders
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                  <Radio className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-700">Weather Risk</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Real-time meteorological stress
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-700">Criticality</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Societal & hospital prioritization
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono hidden lg:block">
              CHARUSAT University • Team Mantra • Hackathon Finalist Production Node
            </div>
          </div>

          {/* RIGHT COLUMN: Enterprise Operator Login Form Card */}
          <div className="lg:col-span-6 xl:col-span-5 w-full order-1 lg:order-2">
            <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs space-y-6">

              {/* Card Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                    Operator Sign In
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    NERC CIP
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Enter your utility credentials to access the dispatch console
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed">
                  {error}
                </div>
              )}

              {/* Form Elements */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="work-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Work Email
                  </label>
                  <input
                    id="work-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@utility.org"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="work-password" className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                    >
                      Reset to demo credentials
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="work-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 pr-10 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Remember workstation</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Demo environment: Please sign in with the pre-loaded operator credentials.')}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Authenticating Workstation...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials Callout */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Demo Dispatch Credentials
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Pre-loaded
                  </span>
                </div>
                <div className="text-slate-600 font-mono text-[11px] space-y-0.5">
                  <div>Email: <span className="text-slate-900 font-semibold">dispatcher@gridsentinel.ai</span></div>
                  <div>Password: <span className="text-slate-900 font-semibold">Sentinel2026!</span></div>
                </div>
                <div className="text-[11px] text-slate-500 pt-0.5">
                  Role: Lead Reliability Dispatcher • Metro Central
                </div>
              </div>

              {/* Link to Signup */}
              <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                <span>Don't have an operator account? </span>
                <button
                  type="button"
                  onClick={onNavigateToSignup}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Request Access / Sign Up
                </button>
              </div>

            </div>

            {/* Compliant Footer */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Authorized utility personnel only. Adheres to IEEE C57.104 & NERC operational standards.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

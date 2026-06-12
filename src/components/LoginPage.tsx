/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, AlertCircle, Sparkles, Mail, Lock, ShieldCheck } from "lucide-react";
import { ActiveSession } from "../types";

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  onClose: () => void;
}

export default function LoginPage({ onLoginSuccess, onClose }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all layout fields.");
      return;
    }
    setError("");
    setIsLoading(true);

    // Simulate login persistence
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(email);
    }, 800);
  };

  return (
    <div className="min-h-[85vh] bg-surface flex items-center justify-center p-4 md:p-8" id="login-screen-root">
      <div className="max-w-6xl w-full bg-[#fbf9f4] shadow-xl rounded-2xl overflow-hidden border border-[#eae8e3] grid md:grid-cols-12 min-h-[680px]">
        
        {/* Left Side: Illustrative Legacy Banner */}
        <div className="relative md:col-span-5 bg-[#30312e] text-white p-8 flex flex-col justify-between overflow-hidden">
          {/* Faux Background Overlay using an elegant historical library image */}
          <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1000')` 
            }}
          />
          
          {/* Decorative radial lighting representing warm lamp illumination */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-400/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-container" />
            <span className="font-serif text-lg font-bold tracking-tight text-primary-container">Digital Lineage</span>
          </div>

          <div className="relative z-10 my-auto py-12">
            <div className="bg-[#f0eee9]/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg max-w-sm">
              <h3 className="font-serif text-2xl font-bold mb-3 text-amber-100">Preserve Your Legacy</h3>
              <p className="font-sans text-sm text-[#e4e2dd] leading-relaxed">
                Connect with your ancestors, document your heritage, and bridge the gap between generations with Digital Lineage.
              </p>
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#bec8d2]/70 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-secondary-container" />
            <span>Bank-grade encryption safeguards your family vault.</span>
          </div>
        </div>

        {/* Right Side: Sign In / Create Account Controls */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            
            {/* Header logo / titles */}
            <div className="mb-8 text-center md:text-left">
              <div className="text-xs font-semibold tracking-wider text-tertiary uppercase mb-1">Heritage Hearth Portal</div>
              <h2 className="font-serif text-3xl font-extrabold text-tertiary">
                {isSignUp ? "Begin Your Legacy" : "Welcome Back"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isSignUp ? "Register an account to start cataloguing your records" : "Access your shared family tree spaces"}
              </p>
            </div>

            {/* Selection Tabs */}
            <div className="flex border-b border-[#eae8e3] p-0.5 gap-2 mb-6" id="auth-tabs">
              <button
                type="button"
                className={`flex-1 py-2.5 text-center font-sans text-sm font-semibold border-b-2 transition-all duration-200 ${
                  !isSignUp 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => { setIsSignUp(false); setError(""); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-center font-sans text-sm font-semibold border-b-2 transition-all duration-200 ${
                  isSignUp 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => { setIsSignUp(true); setError(""); }}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., james.archivist@lineage.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border-2 border-[#eae8e3] rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Password
                  </label>
                  {!isSignUp && (
                    <a href="#reset" className="text-xs text-primary font-medium hover:underline">
                      Forgot Password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border-2 border-[#eae8e3] rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isSignUp ? "Register My Tree" : "Sign In to My Tree"}</span>
                )}
              </button>
            </form>

            {/* Social SSO path */}
            <div className="relative my-6 text-center">
              <span className="absolute inset-x-0 top-3 border-b border-gray-200" />
              <span className="relative z-10 px-3 bg-white text-xs text-gray-400 font-medium">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => onLoginSuccess("google.user@gmail.com")}
                className="flex items-center justify-center gap-2 py-2.5 border-2 border-[#eae8e3] rounded-lg hover:bg-gray-50 active:scale-95 transition text-sm font-semibold text-gray-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.29 1.92 15.42 1 12.24 1 6.01 1 1 5.925 1 12s5.01 11 11.24 11c6.51 0 10.84-4.505 10.84-11.025 0-.742-.08-1.309-.177-1.69H12.24z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => onLoginSuccess("apple.user@icloud.com")}
                className="flex items-center justify-center gap-2 py-2.5 border-2 border-[#eae8e3] rounded-lg hover:bg-gray-50 active:scale-95 transition text-sm font-semibold text-gray-700"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2 11.02-2.92-12.35.43-1.12.87-2.19 2.01-1.11-.1.12-.13.23-.08.35z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <div className="text-center text-xs text-gray-400">
              Need assistance?{" "}
              <a href="#support" className="text-primary font-semibold hover:underline">
                Contact Heritage Support
              </a>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

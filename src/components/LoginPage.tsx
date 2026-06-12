/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, AlertCircle, Mail, Lock, ShieldCheck, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface LoginPageProps {
  onClose: () => void;
}

export default function LoginPage({ onClose }: LoginPageProps) {
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp]     = useState(false);
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [fullName, setFullName]     = useState("");
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [isLoading, setIsLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (isSignUp) {
      const { error: err } = await signUp(email, password, fullName);
      setIsLoading(false);
      if (err) {
        setError(err);
      } else {
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setIsSignUp(false);
        setPassword("");
      }
    } else {
      const { error: err } = await signIn(email, password);
      setIsLoading(false);
      if (err) {
        setError(err);
      }
      // On success, App.tsx detects auth state change automatically
    }
  };

  return (
    <div className="min-h-[85vh] bg-surface flex items-center justify-center p-4 md:p-8" id="login-screen-root">
      <div className="max-w-6xl w-full bg-[#fbf9f4] shadow-xl rounded-2xl overflow-hidden border border-[#eae8e3] grid md:grid-cols-12 min-h-[680px]">

        {/* Left Side: Illustrative Legacy Banner */}
        <div className="relative md:col-span-5 bg-[#30312e] text-white p-8 flex flex-col justify-between overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1000')` }}
          />
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

            <div className="mb-8 text-center md:text-left">
              <div className="text-xs font-semibold tracking-wider text-tertiary uppercase mb-1">Heritage Hearth Portal</div>
              <h2 className="font-serif text-3xl font-extrabold text-tertiary">
                {isSignUp ? "Begin Your Legacy" : "Welcome Back"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isSignUp ? "Register an account to start cataloguing your records" : "Access your shared family tree spaces"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#eae8e3] p-0.5 gap-2 mb-6" id="auth-tabs">
              <button
                type="button"
                className={`flex-1 py-2.5 text-center font-sans text-sm font-semibold border-b-2 transition-all duration-200 ${
                  !isSignUp ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => { setIsSignUp(false); setError(""); setSuccess(""); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-center font-sans text-sm font-semibold border-b-2 transition-all duration-200 ${
                  isSignUp ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => { setIsSignUp(true); setError(""); setSuccess(""); }}
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

            {success && (
              <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs flex items-center gap-2 rounded">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. James Harrison"
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border-2 border-[#eae8e3] rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary transition"
                  />
                </div>
              )}

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
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) { setError("Enter your email first."); return; }
                        const { error } = await supabase.auth.resetPasswordForEmail(email);
                        if (error) setError(error.message);
                        else setSuccess("Password reset email sent!");
                      }}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
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

            <div className="text-center mt-6 text-xs text-gray-400">
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

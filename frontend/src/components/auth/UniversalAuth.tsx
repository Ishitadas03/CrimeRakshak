"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { SignIn, SignUp } from "@clerk/nextjs";
import "@/app/auth.css";

// ── Input recipe (shared across all fields) ──
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2563EB] transition-colors";

interface UniversalAuthProps {
  defaultIsSignUp?: boolean;
}

export default function UniversalAuth({
  defaultIsSignUp = false,
}: UniversalAuthProps) {
  const pathname = usePathname();
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);

  // ── Login state ──
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ── Signup state ──
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  // ── Slow-network UX (5s timeout → stage 2) ──
  const [showLongLoading, setShowLongLoading] = useState(false);
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (loginLoading || signupLoading) {
      t = setTimeout(() => setShowLongLoading(true), 5000);
    }
    return () => {
      clearTimeout(t);
      setShowLongLoading(false);
    };
  }, [loginLoading, signupLoading]);

  // ── URL ↔ panel sync ──
  useEffect(() => {
    if (isSignUp !== (pathname === "/signup")) {
      setIsSignUp(pathname === "/signup");
    }
  }, [pathname, isSignUp]);

  const togglePanel = (toSignUp: boolean) => {
    setIsSignUp(toSignUp);
    window.history.pushState(null, "", toSignUp ? "/signup" : "/login");
  };

  // ── Form helpers ──
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Submit: Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    // Simulate a brief loading state then redirect
    setTimeout(() => {
      window.location.href = "/overview";
    }, 800);
  };

  // ── Submit: Signup ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");

    if (formData.password !== formData.confirmPassword) {
      setSignupError("Passwords do not match");
      setSignupLoading(false);
      return;
    }

    // Simulate a brief loading state then redirect
    setTimeout(() => {
      window.location.href = "/overview";
    }, 800);
  };

  return (
    <div className="auth-page-bg auth-mesh-bg relative">
      {/* ═══════════════════════════════════════════
          Loading Overlay — Stage 1 (instant spinner)
          ═══════════════════════════════════════════ */}
      {(loginLoading || signupLoading) && !showLongLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all">
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB] animate-spin drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              <div className="absolute inset-4 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-[spin_1.5s_linear_reverse_infinite] drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-extrabold text-white text-lg tracking-[0.2em] uppercase animate-pulse">
                {loginLoading ? "Authenticating" : "Initializing"}
              </span>
              <div className="flex gap-1.5 mt-3">
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          Loading Overlay — Stage 2 ("taking a while")
          ═══════════════════════════════════════════ */}
      {showLongLoading && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200 border-t-4 border-[#2563EB]">
            <div className="flex flex-col items-center text-center gap-4">
              <Loader2
                size={40}
                className="animate-spin text-[#2563EB] shrink-0"
              />
              <div>
                <p className="font-bold text-lg text-slate-800">
                  Please wait...
                </p>
                <p className="text-sm mt-1 text-slate-600">
                  This is taking longer than usual. Hang tight!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          The Card
          ═══════════════════════════════════════════ */}
      <div className="auth-wrapper">
        <div
          className={`auth-container ${isSignUp ? "right-panel-active" : ""}`}
        >
          {/* ─── Sign Up Form (DOM-first) ─── */}
          <div className="auth-form-container sign-up-container">
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center h-full space-y-4">
              <SignUp appearance={{
                elements: {
                  footerAction: "hidden",
                  card: "shadow-none bg-transparent w-full"
                }
              }} routing="hash" fallbackRedirectUrl="/overview" />
              
              {/* Mobile-only switch link */}
              <div className="mt-4 text-center md:hidden pb-10">
                <button
                  type="button"
                  onClick={() => togglePanel(false)}
                  className="text-sm text-gray-500"
                >
                  Already have an account?{" "}
                  <span className="text-[#2563EB] font-medium">Sign In</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Sign In Form (DOM-second) ─── */}
          <div className="auth-form-container sign-in-container">
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center h-full space-y-4">
              <SignIn appearance={{
                elements: {
                  footerAction: "hidden",
                  card: "shadow-none bg-transparent w-full"
                }
              }} routing="hash" fallbackRedirectUrl="/overview" />
              
              {/* Mobile-only switch link */}
              <div className="mt-4 text-center md:hidden pb-10">
                <button
                  type="button"
                  onClick={() => togglePanel(true)}
                  className="text-sm text-gray-500"
                >
                  Don&apos;t have an account?{" "}
                  <span className="text-[#2563EB] font-medium">Sign Up</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Desktop Overlay (sliding gradient blob) ─── */}
          <div className="auth-overlay-container hidden md:block">
            <div className="auth-overlay">
              {/* Left panel — shown when Sign Up is active */}
              <div className="auth-overlay-panel auth-overlay-left">
                <h2
                  className="text-3xl font-bold italic mb-4"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  Welcome Back!
                </h2>
                <p className="text-sm text-white/80 mb-8 max-w-[260px] leading-relaxed">
                  To keep connected with us please login with your personal info
                </p>
                <button
                  onClick={() => togglePanel(false)}
                  className="rounded-xl border-2 border-white px-12 py-3 font-semibold text-white hover:bg-white hover:text-[#2563EB] transition-colors shadow-sm"
                >
                  Sign In
                </button>
              </div>

              {/* Right panel — shown when Sign In is active */}
              <div className="auth-overlay-panel auth-overlay-right">
                <h2
                  className="text-3xl font-bold italic mb-4"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  Hello, Friend!
                </h2>
                <p className="text-sm text-white/80 mb-8 max-w-[260px] leading-relaxed">
                  Enter your personal details and start your journey with us
                </p>
                <button
                  onClick={() => togglePanel(true)}
                  className="rounded-xl border-2 border-white px-12 py-3 font-semibold text-white hover:bg-white hover:text-[#2563EB] transition-colors shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

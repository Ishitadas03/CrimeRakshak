"use client";

import { useState } from "react";
import { setUserRole } from "./actions";
import { ShieldCheck, Loader2 } from "lucide-react";
import * as motion from "motion/react-client";

const ROLES = [
  "Inspector",
  "Sub-Inspector",
  "Superintendent",
  "DGP",
  "Auditor",
  "Supervisor",
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await setUserRole(selectedRole);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-base text-text-primary flex items-center justify-center p-4">
      {/* Background styling to match the app */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-purple/20 via-background to-background" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card relative z-10 w-full max-w-lg p-8 rounded-2xl border border-border/50 shadow-2xl backdrop-blur-xl bg-background/50"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-center bg-gradient-to-r from-brand-purple to-brand-blue text-transparent bg-clip-text">
            Select Your Designation
          </h1>
          <p className="text-muted-foreground text-center mt-2">
            Please choose your official role to configure your CrimeRakshak dashboard access and permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                selectedRole === role
                  ? "border-brand-purple bg-brand-purple/10 shadow-[0_0_15px_rgba(107,70,193,0.15)]"
                  : "border-border/50 hover:border-brand-purple/50 hover:bg-white/5"
              }`}
            >
              <div className="font-bold text-sm">{role}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || loading}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            !selectedRole || loading
              ? "bg-muted-foreground/50 cursor-not-allowed"
              : "bg-brand-purple hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/25"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving Profile...
            </>
          ) : (
            "Complete Setup"
          )}
        </button>
      </motion.div>
    </main>
  );
}

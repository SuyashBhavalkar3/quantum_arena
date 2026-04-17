"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { loginUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/api";
import { setAuthToken, setUserRole, setUserData } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await loginUser({ email, password });
      const { access_token } = authResponse;

      setAuthToken(access_token);

      // Fetch user data
      const userData = await getCurrentUser(access_token);
      const userRole = userData.is_employer ? "hr" : "candidate";
      
      setUserRole(userRole);
      setUserData(userData);

      router.push(userRole === "hr" ? "/hr" : "/candidate");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  // Animation variants (same as before)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#F9F6F0]">
      {/* Artistic background – same as before */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#E6D7C3] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D9C5B3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-20 w-[500px] h-[500px] bg-[#C7B5A0] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/50 shadow-2xl"
      >
        {/* Left side – artistic branding (unchanged) */}
        <div className="relative hidden lg:flex flex-col justify-center p-16 bg-[#F1E9E0]/80 backdrop-blur-sm">
          {/* ... same as before ... */}
          <div className="absolute inset-0 opacity-20">
            <svg className="absolute top-10 left-10 w-64 h-64" viewBox="0 0 200 200" fill="none">
              <path d="M50 100C50 70 70 50 100 50C130 50 150 70 150 100C150 130 130 150 100 150C70 150 50 130 50 100Z" fill="#B8915C" />
              <circle cx="120" cy="80" r="40" fill="#C17C5A" />
            </svg>
          </div>
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-serif text-5xl font-medium tracking-tight text-[#2D2A24] mb-4"
            >
              HireFlow
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg text-[#4A443C] leading-relaxed max-w-sm"
            >
              Where talent meets opportunity —<br /> thoughtfully, intelligently.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-12 h-px w-16 bg-[#B8915C]/40"
            />
          </div>
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-16 right-16 w-32 h-32 opacity-20"
          >
            <svg viewBox="0 0 100 100" fill="none" stroke="#2D2A24" strokeWidth="1">
              <path d="M20 80 Q 40 20, 80 30" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* Right side – form (no role dropdown) */}
        <div className="p-8 lg:p-12 backdrop-blur-xl bg-white/70">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <h1 className="font-serif text-3xl font-medium text-[#2D2A24]">HireFlow</h1>
            </div>

            {/* Header */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="mb-8"
            >
              <h2 className="text-2xl font-medium text-[#2D2A24] mb-2">Sign in</h2>
              <p className="text-[#5A534A]">Enter your work email and password</p>
            </motion.div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {error && (
                <motion.div
                  variants={itemVariants}
                  className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Label htmlFor="email" className="text-sm font-medium text-[#4A443C] mb-1.5 block">
                  Work email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C]"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-[#4A443C]">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#B8915C] hover:text-[#9F7A4F] font-medium transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#B8915C] hover:bg-[#9F7A4F] text-white font-medium rounded-xl shadow-lg shadow-[#B8915C]/20 hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Artistic sign-up section (unchanged) */}
              <motion.div variants={itemVariants} className="relative pt-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-[#B8915C]/30" />
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <span className="text-sm text-[#5A534A]">New here?</span>
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center gap-1 text-[#B8915C] hover:text-[#9F7A4F] font-medium transition-colors"
                  >
                    <span>Create an account</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    <svg
                      className="absolute -bottom-1 left-0 w-full h-2"
                      viewBox="0 0 60 8"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 6 Q 15 2, 30 6 T 60 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        className="opacity-50"
                      />
                    </svg>
                  </Link>
                </div>
                <div className="mt-4 flex justify-center">
                  <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
                    <path d="M2 10 L20 2 L38 10" stroke="#B8915C" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
                  </svg>
                </div>
              </motion.div>
            </motion.form>
          </div>
        </div>
      </motion.div>

      {/* Custom keyframes for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
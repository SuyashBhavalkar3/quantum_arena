"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, User, Building } from "lucide-react";
import { registerUser, loginUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/api";
import { setAuthToken, setUserRole, setUserData } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEmployer, setIsEmployer] = useState(false);
  const [company, setCompany] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (isEmployer && !company) {
      setError("Company name is required for employers");
      return;
    }

    setIsLoading(true);

    try {
      const userData = await registerUser({
        fullName,
        email,
        password,
        is_employer: isEmployer,
        company: company || undefined
      });

      // Auto-login after registration
      const authResponse = await loginUser({ email, password });
      const { access_token } = authResponse;

      setAuthToken(access_token);

      // Fetch user data
      const currentUserData = await getCurrentUser(access_token);
      const userRole = currentUserData.is_employer ? "hr" : "candidate";
      
      setUserRole(userRole);
      setUserData(currentUserData);

      router.push(userRole === "hr" ? "/hr" : "/candidate");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Animation variants
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
      {/* Artistic background */}
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
        {/* Left side – artistic branding */}
        <div className="relative hidden lg:flex flex-col justify-center p-12 bg-[#F1E9E0]/80 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-20">
            <svg className="absolute top-8 left-8 w-48 h-48" viewBox="0 0 200 200" fill="none">
              <path d="M50 100C50 70 70 50 100 50C130 50 150 70 150 100C150 130 130 150 100 150C70 150 50 130 50 100Z" fill="#B8915C" />
              <circle cx="120" cy="80" r="40" fill="#C17C5A" />
            </svg>
          </div>
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-serif text-4xl font-medium tracking-tight text-[#2D2A24] mb-3"
            >
              HireFlow
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-base text-[#4A443C] leading-relaxed max-w-sm"
            >
              Where talent meets opportunity —<br /> thoughtfully, intelligently.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-8 h-px w-12 bg-[#B8915C]/40"
            />
          </div>
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-12 right-12 w-24 h-24 opacity-20"
          >
            <svg viewBox="0 0 100 100" fill="none" stroke="#2D2A24" strokeWidth="1">
              <path d="M20 80 Q 40 20, 80 30" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* Right side – form */}
        <div className="p-6 lg:p-8 backdrop-blur-xl bg-white/70">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden mb-6">
              <h1 className="font-serif text-2xl font-medium text-[#2D2A24]">HireFlow</h1>
            </div>

            {/* Header */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <h2 className="text-xl font-medium text-[#2D2A24] mb-1">Create account</h2>
              <p className="text-sm text-[#5A534A]">Join our recruitment platform</p>
            </motion.div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <motion.div variants={itemVariants}>
                <Label htmlFor="fullName" className="text-xs font-medium text-[#4A443C] mb-1 block">
                  Full name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#A69A8C]" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-9 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C] text-sm"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Label htmlFor="email" className="text-xs font-medium text-[#4A443C] mb-1 block">
                  Work email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#A69A8C]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C] text-sm"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Label htmlFor="password" className="text-xs font-medium text-[#4A443C] mb-1 block">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#A69A8C]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-12 h-9 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C] text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#4A443C] mb-1 block">
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#A69A8C]" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-12 h-9 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C] text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEmployer"
                    checked={isEmployer}
                    onChange={(e) => {
                      setIsEmployer(e.target.checked);
                      if (!e.target.checked) setCompany("");
                    }}
                    className="w-3 h-3 text-[#B8915C] bg-white/60 border-[#D6CDC2] rounded focus:ring-[#B8915C]/20 focus:ring-1"
                  />
                  <Label htmlFor="isEmployer" className="text-xs font-medium text-[#4A443C]">
                    I'm an employer/recruiter
                  </Label>
                </div>
              </motion.div>

              {isEmployer && (
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="company" className="text-xs font-medium text-[#4A443C] mb-1 block">
                    Company name
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#A69A8C]" />
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Enter your company name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-9 h-9 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-xl transition-all placeholder:text-[#A69A8C] text-sm"
                      required
                    />
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 bg-[#B8915C] hover:bg-[#9F7A4F] text-white font-medium rounded-xl shadow-lg shadow-[#B8915C]/20 hover:shadow-xl transition-all duration-200 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Artistic sign-in section */}
              <motion.div variants={itemVariants} className="relative pt-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 flex justify-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-0.5 h-0.5 rounded-full bg-[#B8915C]/30" />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <span className="text-xs text-[#5A534A]">Already have an account?</span>
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center gap-1 text-[#B8915C] hover:text-[#9F7A4F] font-medium transition-colors"
                  >
                    <span className="text-xs">Sign in</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
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

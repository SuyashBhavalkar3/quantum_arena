"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  Briefcase,
  HelpCircle,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ChatAssistant from "@/components/chat/ChatAssistant";
import { removeAuthToken, logout, getAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";
import { cn } from "@/lib/utils";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

const navItems = [
  { name: "Dashboard", href: "/hr", icon: Home },
  { name: "Jobs", href: "/hr/jobs", icon: Briefcase },
  { name: "Applicants", href: "/hr/applicants", icon: Users },
  { name: "Recruitment Strategy", href: "/hr/recruitment-strategy", icon: Lightbulb },
  { name: "Questions", href: "/hr/questions", icon: HelpCircle },
  { name: "Profile", href: "/hr/profile", icon: Settings },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const token = getAuthToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const data = await getCurrentUser(token);

        if (mounted) {
          setUser({
            name: data.name,
            email: data.email,
          });
        }
      } catch {
        removeAuthToken();
        router.replace("/login");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!loading && navRef.current) {
      gsap.fromTo(
        navRef.current.children,
        { x: -16, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    }
  }, [loading]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActiveRoute = (href: string) => {
    if (href === "/hr") {
      return pathname === "/hr";
    }

    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setSidebarOpen((previous) => !previous)}
          className="border-[#D6CDC2] bg-white/80 backdrop-blur-sm"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 border-r bg-white/70 backdrop-blur-xl transition-transform",
          "dark:border-slate-800 dark:bg-slate-900/70",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-6">
          <Link href="/hr" className="mb-8 flex items-center gap-2">
            <span className="font-serif text-3xl text-[#2D2A24] dark:text-white">
              HireFlow
            </span>
            
          </Link>

          <nav ref={navRef} className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200",
                    active
                      ? "bg-[#B8915C] text-white shadow-md"
                      : "text-[#4A443C] hover:bg-[#F1E9E0] dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", active ? "text-white" : "text-[#A69A8C]")}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-[#D6CDC2]/30 pt-6">
            <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3 transition-all duration-300 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80">
              <Avatar className="ring-2 ring-[#B8915C]/20">
                {loading ? (
                  <Skeleton className="h-10 w-10 rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-[#B8915C]/10 text-[#B8915C]">
                      {user?.name?.[0] ?? "H"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>

              <div className="min-w-0 flex-1">
                {loading ? (
                  <>
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium text-[#2D2A24] dark:text-white">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-[#5A534A] dark:text-slate-400">
                      {user?.email}
                    </p>
                  </>
                )}
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                className="text-[#A69A8C] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-80">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ChatAssistant />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Loader2,
  CheckCheck,
  Filter,
  MoreVertical,
  Clock,
} from "lucide-react";
import Link from "next/link";

type NotificationType = "success" | "warning" | "info";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  action: { label: string; link: string };
}

const notifications: Notification[] = [
  {
    id: 1,
    type: "success",
    title: "Application Accepted",
    message:
      "Your application for Senior Frontend Developer at TechCorp has been accepted. Schedule your assessment now.",
    time: "2 hours ago",
    read: false,
    action: { label: "Schedule Assessment", link: "/candidate/applications" },
  },
  {
    id: 2,
    type: "info",
    title: "Interview Scheduled",
    message:
      "Your AI interview for Full Stack Engineer at InnovateLabs is scheduled for tomorrow at 2:00 PM.",
    time: "5 hours ago",
    read: false,
    action: { label: "View Details", link: "/candidate/applications" },
  },
  {
    id: 3,
    type: "warning",
    title: "Assessment Deadline Approaching",
    message:
      "Your assessment for Backend Developer position is due in 2 days. Complete it soon.",
    time: "1 day ago",
    read: true,
    action: { label: "Start Assessment", link: "/candidate/assessment" },
  },
  {
    id: 4,
    type: "success",
    title: "Offer Received",
    message:
      "Congratulations! CloudTech has extended an offer for the DevOps Engineer position.",
    time: "2 days ago",
    read: true,
    action: { label: "View Offer", link: "/candidate/applications" },
  },
  {
    id: 5,
    type: "info",
    title: "New Job Match",
    message: "We found 3 new jobs that match your profile. Check them out!",
    time: "3 days ago",
    read: true,
    action: { label: "Browse Jobs", link: "/candidate/jobs" },
  },
];

const typeConfig: Record<
  NotificationType,
  { icon: typeof CheckCircle; color: string; bg: string; label: string }
> = {
  success: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    label: "Success",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    label: "Information",
  },
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Instant loading - no delay
  useEffect(() => {
    setItems(notifications);
    setLoading(false);
  }, []);

  // GSAP entrance animations - no delays
  useEffect(() => {
    if (!loading && headerRef.current && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(headerRef.current, {
          y: -30,
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        });
        
        gsap.from(".notification-card", {
          y: 20,
          opacity: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.out",
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, filter]);

  const unreadCount = items.filter((n) => !n.read).length;
  const filteredItems = filter === "unread" ? items.filter((n) => !n.read) : items;

  const markAllAsRead = () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const markAsRead = (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const getTimeColor = (time: string) => {
    if (time.includes("hour") || time.includes("minute")) {
      return "text-emerald-600 dark:text-emerald-400";
    }
    if (time.includes("day") && !time.includes("2 days")) {
      return "text-amber-600 dark:text-amber-400";
    }
    return "text-slate-500 dark:text-slate-400";
  };

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      <div ref={containerRef} className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header with refined styling */}
        <div ref={headerRef} className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-[#B8915C] shadow-sm">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-serif text-3xl font-light text-[#2D2A24] dark:text-white">
              Notification Center
            </h1>
          </div>
          <p className="text-[#5A534A] dark:text-slate-400 text-sm max-w-md mx-auto">
            Stay updated with your applications, interviews, and opportunities
          </p>
        </div>

        {/* Action bar */}
        <div className="mb-6 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-2 border border-[#D6CDC2]/20 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" 
                ? "bg-[#B8915C] text-white hover:bg-[#A07A4A] shadow-md" 
                : "text-[#4A443C] hover:bg-[#F1E9E0] dark:text-slate-300"
              }
            >
              All
              <Badge variant="secondary" className="ml-2 bg-white/20 text-xs">
                {items.length}
              </Badge>
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
              className={filter === "unread"
                ? "bg-[#B8915C] text-white hover:bg-[#A07A4A] shadow-md"
                : "text-[#4A443C] hover:bg-[#F1E9E0] dark:text-slate-300"
              }
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
          
          {unreadCount > 0 && filter !== "unread" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-[#B8915C] hover:text-[#A07A4A] hover:bg-[#F1E9E0] dark:hover:bg-slate-800"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {loading ? (
            // Enhanced skeleton loaders
            [...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm animate-pulse"
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D6CDC2]/50 dark:bg-slate-700/50" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/3 bg-[#D6CDC2]/50 dark:bg-slate-700/50 rounded" />
                      <div className="h-3 w-2/3 bg-[#D6CDC2]/50 dark:bg-slate-700/50 rounded" />
                      <div className="flex justify-between">
                        <div className="h-3 w-20 bg-[#D6CDC2]/50 dark:bg-slate-700/50 rounded" />
                        <div className="h-8 w-24 bg-[#D6CDC2]/50 dark:bg-slate-700/50 rounded" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#B8915C]/10 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-[#B8915C]" />
                  </div>
                  <h3 className="font-serif text-xl text-[#2D2A24] dark:text-white mb-2">
                    All clear!
                  </h3>
                  <p className="text-[#5A534A] dark:text-slate-400 max-w-sm mx-auto">
                    {filter === "unread" 
                      ? "No unread notifications. Great job staying on top of things!"
                      : "You don't have any notifications at the moment. We'll notify you when something arrives."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredItems.map((notification, index) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;
                const isSelected = selectedId === notification.id;

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    transition={{ 
                      duration: 0.2,
                      delay: 0,
                      layout: { duration: 0.15 }
                    }}
                    whileHover={{ y: -2 }}
                    onHoverStart={() => setSelectedId(notification.id)}
                    onHoverEnd={() => setSelectedId(null)}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className="notification-card cursor-pointer"
                  >
                    <Card
                      className={`border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden ${
                        !notification.read 
                          ? "ring-1 ring-[#B8915C]/30" 
                          : "opacity-90"
                      }`}
                    >
                      {/* Status indicator */}
                      {!notification.read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#B8915C] rounded-r-full" />
                      )}
                      
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          {/* Icon with refined styling */}
                          <div className={`p-2.5 rounded-xl ${config.bg} transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1.5">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-[#2D2A24] dark:text-white">
                                  {notification.title}
                                </h3>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs border-none ${config.bg} ${config.color}`}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                              {!notification.read && (
                                <Badge className="bg-[#B8915C] text-white border-none text-xs px-2 py-0.5">
                                  New
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-[#5A534A] dark:text-slate-400 mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Clock className={`h-3.5 w-3.5 ${getTimeColor(notification.time)}`} />
                                <span className={`text-xs ${getTimeColor(notification.time)} font-medium`}>
                                  {notification.time}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                {notification.action && (
                                  <Link href={notification.action.link}>
                                    <Button
                                      size="sm"
                                      className="bg-[#B8915C] hover:bg-[#A07A4A] text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs"
                                    >
                                      {notification.action.label}
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#A69A8C] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <div className={`absolute inset-0 transition-transform duration-700 pointer-events-none`} />
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer summary for professional touch */}
        {!loading && filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-[#A69A8C] dark:text-slate-500">
              {filteredItems.length} notification{filteredItems.length !== 1 ? 's' : ''} • 
              Last updated {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
// components/notifications-dropdown.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCircle, Calendar, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: 1,
    type: "success",
    title: "Assessment Passed",
    message: "You passed the coding assessment for TechCorp.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "Interview Scheduled",
    message: "Your interview with InnovateLabs is scheduled for Mar 5 at 2:00 PM.",
    time: "Yesterday",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Assessment Due Soon",
    message: "Your Frontend Assessment for GrowthHackers is due in 2 days.",
    time: "2 days ago",
    read: true,
  },
];

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Button variant="ghost" size="sm" className="h-auto text-xs">
            Mark all as read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-96 overflow-y-auto">
          {notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                !notif.read && "bg-slate-50 dark:bg-slate-800/50"
              )}
            >
              <div className={cn(
                "p-1 rounded-full",
                notif.type === "success" && "bg-green-100 text-green-600",
                notif.type === "info" && "bg-blue-100 text-blue-600",
                notif.type === "warning" && "bg-yellow-100 text-yellow-600"
              )}>
                {notif.type === "success" && <CheckCircle className="h-4 w-4" />}
                {notif.type === "info" && <Calendar className="h-4 w-4" />}
                {notif.type === "warning" && <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{notif.title}</p>
                <p className="text-xs text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground">{notif.time}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-primary">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
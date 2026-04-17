"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date, time: string) => void;
}

export function ScheduleDialog({ open, onOpenChange, onSchedule }: ScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      onSchedule(selectedDate, selectedTime);
      setSelectedDate(undefined);
      setSelectedTime("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-[#2D2A24] dark:text-white">
            Schedule Assessment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start border-[#D6CDC2] text-[#4A443C]"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#B8915C]" />
                {selectedDate ? selectedDate.toDateString() : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>

          <div className="grid grid-cols-3 gap-2">
            {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(
              (time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className={
                    selectedTime === time
                      ? "bg-[#B8915C] hover:bg-[#9F7A4F]"
                      : "border-[#D6CDC2] text-[#4A443C]"
                  }
                >
                  {time}
                </Button>
              )
            )}
          </div>

          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime}
            className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
          >
            Confirm Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
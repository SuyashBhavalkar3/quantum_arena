"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onSave: () => void;
}

export default function ProfileHeader({ isEditing, setIsEditing, onSave }: ProfileHeaderProps) {
  return (
    <motion.div
      className="profile-header mb-8 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white mb-2 flex items-center gap-2">
          My Profile
        </h1>
        <p className="text-[#5A534A] dark:text-slate-400">
          Complete your profile to apply for jobs
        </p>
      </div>
      <div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={onSave}
              size="sm"
              className="bg-[#B8915C] hover:bg-[#9F7A4F]"
            >
              Save Changes
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="sm"
              className="border-[#D6CDC2] text-[#4A443C]"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
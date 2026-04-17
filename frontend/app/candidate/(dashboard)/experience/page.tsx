"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ExperienceFeed from "@/components/experience/ExperienceFeed";
import SubmitExperience from "@/components/experience/SubmitExperience";

export default function ExperiencePage() {
  const [showSubmit, setShowSubmit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <ExperienceFeed
        key={refreshKey}
        onSubmitClick={() => setShowSubmit(true)}
      />
      <AnimatePresence>
        {showSubmit && (
          <SubmitExperience
            onClose={() => setShowSubmit(false)}
            onSuccess={() => {
              setShowSubmit(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

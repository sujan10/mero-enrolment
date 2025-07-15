"use client";

import { useEffect } from "react";

export default function StagewiseWrapper() {
  useEffect(() => {
    // Only initialize in development mode
    if (process.env.NODE_ENV !== "development") return;

    const initStagewise = async () => {
      try {
        const { initToolbar } = await import("@stagewise/toolbar");
        
        initToolbar({
          plugins: [],
        });
      } catch (error) {
        console.warn("Stagewise toolbar initialization failed:", error);
      }
    };

    // Initialize after component mounts
    initStagewise();
  }, []);

  // This component doesn't render anything visible
  return null;
} 
"use client";

import { useEffect } from "react";

// Global flag to prevent multiple initializations
let stagewiseInitialized = false;

export default function StagewiseWrapper() {
  useEffect(() => {
    // Only initialize in development mode
    if (process.env.NODE_ENV !== "development") return;

    // Prevent multiple initializations
    if (stagewiseInitialized) return;

    const initStagewise = async () => {
      try {
        // Check if Stagewise is already loaded
        if (window.__STAGEWISE_INITIALIZED__) {
          console.log("Stagewise already initialized, skipping...");
          return;
        }

        const { initToolbar } = await import("@stagewise/toolbar");
        
        initToolbar({
          plugins: [],
        });

        // Mark as initialized
        stagewiseInitialized = true;
        window.__STAGEWISE_INITIALIZED__ = true;
        
        console.log("Stagewise toolbar initialized successfully");
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
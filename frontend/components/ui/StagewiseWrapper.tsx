"use client";

import { useEffect } from "react";

export default function StagewiseWrapper() {
  useEffect(() => {
    // Only initialize in development mode
    if (process.env.NODE_ENV !== "development") return;

    const initStagewise = async () => {
      try {
        console.log("Initializing Stagewise toolbar...");
        
        const { initToolbar } = await import("@stagewise/toolbar");
        
        initToolbar({
          plugins: [],
          // Add any additional configuration here
        });
        
        console.log("Stagewise toolbar initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Stagewise toolbar:", error);
      }
    };

    // Initialize after component mounts
    initStagewise();
  }, []);

  // This component doesn't render anything visible
  // The toolbar is injected into the DOM by the stagewise package
  return null;
} 
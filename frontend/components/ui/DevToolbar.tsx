"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card } from "./card";

export default function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 shadow-lg"
      >
        🛠️
      </Button>
      
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-64 p-4 shadow-xl">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Development Tools</h3>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Current page info:", {
                    url: window.location.href,
                    title: document.title,
                    timestamp: new Date().toISOString()
                  });
                }}
                className="w-full justify-start"
              >
                📊 Log Page Info
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const elements = document.querySelectorAll('*');
                  console.log("Page elements count:", elements.length);
                  console.log("React components:", Array.from(elements).filter(el => 
                    (el as any)._reactInternalFiber || (el as any)._reactInternalInstance
                  ).length);
                }}
                className="w-full justify-start"
              >
                🔍 Debug Elements
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  console.log("Storage cleared");
                }}
                className="w-full justify-start"
              >
                🗑️ Clear Storage
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 pt-2 border-t">
              Dev mode active
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 
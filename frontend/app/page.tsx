"use client";

import { Toaster } from 'react-hot-toast';
import WorkflowStepper from '../components/workflow/WorkflowStepper';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WorkflowStepper />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
} 
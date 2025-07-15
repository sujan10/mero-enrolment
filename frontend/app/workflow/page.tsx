"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../lib/store';
import { isAuthenticated } from '../../lib/auth';
import WorkflowStepper from '../../components/workflow/WorkflowStepper';

export default function WorkflowPage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <WorkflowStepper />
    </main>
  );
} 
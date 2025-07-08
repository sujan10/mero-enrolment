"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const WarnOnNavigate = () => {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Progress will be lost.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);

    // Next.js back/route change
    router.beforePopState(() => {
      return confirm("You will lose all unsaved progress and exit the app. Continue?");
    });

    return () => {
      window.removeEventListener("beforeunload", handler);
      // cannot remove beforePopState easily; push default true
      router.beforePopState(() => true);
    };
  }, [router]);

  return null;
};
export default WarnOnNavigate; 
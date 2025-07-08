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

    const popHandler = () => {
      if(!confirm("You will lose all unsaved progress and exit the app. Continue?")){
        router.push(router.asPath);
        return false;
      }
      return true;
    };
    window.addEventListener('popstate', popHandler);

    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener('popstate', popHandler);
    };
  }, [router]);

  return null;
};
export default WarnOnNavigate; 
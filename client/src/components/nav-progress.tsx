"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevPath = useRef(pathname);

  useEffect(() => {
    // Detect route change
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // Start progress
    setVisible(true);
    setProgress(20);

    timerRef.current = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(80), 300);

    // Complete
    const t3 = setTimeout(() => {
      setProgress(100);
      const t4 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(t4);
    }, 400);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, searchParams]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
      <div
        className="h-full bg-sift-amber transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 64; // px pulled before release triggers a refresh
const MAX_PULL = 96; // damped pull never exceeds this, even if you drag further

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  className?: string;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, className, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing) return;
    const el = containerRef.current;
    // Only start tracking a pull when the content is already scrolled to the top —
    // otherwise this would hijack normal downward scrolling mid-page.
    startY.current = el && el.scrollTop <= 0 ? e.touches[0].clientY : null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    e.preventDefault();
    setPull(Math.min(delta * 0.5, MAX_PULL));
  }

  async function onTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPull(0);
  }

  const indicatorOffset = (refreshing ? THRESHOLD : pull) - THRESHOLD;
  const contentOffset = refreshing ? THRESHOLD : pull;

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn("relative overflow-y-auto", className)}
      style={{ overscrollBehaviorY: "contain" }}
    >
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-center pointer-events-none"
        style={{ height: THRESHOLD, transform: `translateY(${indicatorOffset}px)`, transition: pull === 0 ? "transform 200ms" : undefined }}
      >
        <RefreshCw
          className={cn("w-5 h-5 text-[var(--cr-brand-600)]", refreshing && "animate-spin")}
          style={refreshing ? undefined : { transform: `rotate(${Math.min(pull / THRESHOLD, 1) * 360}deg)` }}
        />
      </div>
      <div
        style={{ transform: `translateY(${contentOffset}px)`, transition: pull === 0 ? "transform 200ms" : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

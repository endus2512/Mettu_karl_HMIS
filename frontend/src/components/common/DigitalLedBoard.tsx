'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_LED_SIGNAGE_CONFIG, type LedSignageConfig } from '@/lib/ledSignage';

interface DigitalLedBoardProps {
  config?: LedSignageConfig;
  variant?: 'hero' | 'preview';
  className?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 255, g: 184, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function DigitalLedBoard({
  config = DEFAULT_LED_SIGNAGE_CONFIG,
  variant = 'hero',
  className = '',
}: DigitalLedBoardProps): React.ReactElement {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const unitRef = useRef<HTMLSpanElement | null>(null);
  const offsetRef = useRef<number>(0);

  const [cavitySize, setCavitySize] = useState<{ w: number; h: number }>({
    w: variant === 'hero' ? 620 : 680,
    h: variant === 'hero' ? 84 : 92,
  });
  const [unitWidth, setUnitWidth] = useState<number>(600);

  // Track inner LED screen dimensions for responsive font sizing without ever altering outer box
  useEffect(() => {
    const screenEl = screenRef.current;
    if (!screenEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCavitySize({ w: Math.round(width), h: Math.round(height) });
        }
      }
    });
    ro.observe(screenEl);
    return () => ro.disconnect();
  }, []);

  // Measure single marquee segment width dynamically
  useEffect(() => {
    const unitEl = unitRef.current;
    if (!unitEl) return;
    const measure = () => {
      const w = unitEl.getBoundingClientRect().width;
      if (w > 0) setUnitWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(unitEl);
    return () => ro.disconnect();
  }, [config.message, config.fontScale, config.letterSpacing, cavitySize.h]);

  // Smooth requestAnimationFrame marquee loop supporting ultra-slow fine speeds
  useEffect(() => {
    let rafId = 0;
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (lastTime === null) {
        lastTime = now;
      }
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const uWidth = unitRef.current?.getBoundingClientRect().width || unitWidth || 400;
      const trackEl = trackRef.current;

      if (config.isPlaying && uWidth > 0) {
        const pxPerSec = 56 * Math.max(0.1, config.speed);
        if (config.direction === 'ltr') {
          offsetRef.current += dt * pxPerSec;
          while (offsetRef.current >= 0) {
            offsetRef.current -= uWidth;
          }
        } else {
          offsetRef.current -= dt * pxPerSec;
          while (offsetRef.current <= -uWidth) {
            offsetRef.current += uWidth;
          }
        }
      }

      if (trackEl) {
        trackEl.style.transform = `translate3d(${offsetRef.current.toFixed(2)}px, 0, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [config.isPlaying, config.speed, config.direction, unitWidth]);

  const rgb = useMemo(() => hexToRgb(config.colorHex), [config.colorHex]);
  const glowRatio = Math.max(0, Math.min(1, config.glowIntensity / 100));

  // Scale typography cleanly relative to fixed inner LED height (outer frame height stays locked)
  const fontSizePx = useMemo(() => {
    const base = cavitySize.h * 0.56 * config.fontScale;
    return Math.max(16, Math.round(base));
  }, [cavitySize.h, config.fontScale]);

  // Duplicate enough marquee units to always cover wide boards even for short text
  const repeatCount = useMemo(() => {
    const safeUnit = Math.max(unitWidth, 140);
    return Math.min(10, Math.max(3, Math.ceil((cavitySize.w * 2.4) / safeUnit)));
  }, [cavitySize.w, unitWidth]);

  const textShadowStyle = useMemo(() => {
    if (glowRatio <= 0.01) return 'none';
    const cCore = `rgba(255, 255, 255, ${(0.55 * glowRatio).toFixed(2)})`;
    const cMid = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.88 * glowRatio).toFixed(2)})`;
    const cWide = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.52 * glowRatio).toFixed(2)})`;
    const r1 = Math.round(4 + 5 * glowRatio);
    const r2 = Math.round(10 + 14 * glowRatio);
    const r3 = Math.round(18 + 26 * glowRatio);
    return `0 0 ${r1}px ${cCore}, 0 0 ${r2}px ${cMid}, 0 0 ${r3}px ${cWide}`;
  }, [rgb, glowRatio]);

  const outerDimensionsClass =
    variant === 'hero'
      ? 'w-[92vw] max-w-[362px] sm:max-w-[540px] lg:max-w-[660px] xl:max-w-[740px] h-[74px] sm:h-[88px] lg:h-[98px]'
      : 'w-full h-[94px] sm:h-[108px]';

  const displaySegment = `${config.message.trim() || 'METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL'}`;

  return (
    <div
      className={`relative select-none ${outerDimensionsClass} ${className}`}
      aria-label={`Digital LED Hospital Signboard: ${displaySegment}`}
    >
      {/* Physical Structural Wall-Mount Steel Brackets (hero mode anchors board flush to facade) */}
      {variant === 'hero' && (
        <>
          <div className="pointer-events-none absolute -bottom-2 left-[16%] h-2.5 w-3.5 rounded-b-sm bg-gradient-to-b from-[#1e2736] to-[#0b0f17] border-x border-b border-slate-400/35 shadow-md" />
          <div className="pointer-events-none absolute -bottom-2 right-[16%] h-2.5 w-3.5 rounded-b-sm bg-gradient-to-b from-[#1e2736] to-[#0b0f17] border-x border-b border-slate-400/35 shadow-md" />
        </>
      )}

      {/* Sleek Anodized Dark Aluminum & Carbon Outer Housing Bezel */}
      <div
        className="relative w-full h-full rounded-[10px] sm:rounded-[12px] p-[5px] sm:p-[7px] bg-gradient-to-b from-[#333d4f] via-[#1a212e] to-[#0c1018] border border-slate-300/30 ring-1 ring-black/80 shadow-[0_18px_40px_rgba(0,0,0,0.82),0_4px_12px_rgba(0,0,0,0.7)] flex flex-col"
        style={{
          boxShadow: `0 18px 40px rgba(0,0,0,0.84), 0 0 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.22 * glowRatio).toFixed(2)})`,
        }}
      >
        {/* Top Metallic Rain Hood Lip */}
        <div className="pointer-events-none absolute inset-x-3 top-[1px] h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Machined Corner Hardware Rivets */}
        <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-500/70 ring-1 ring-black/60" />
        <span className="pointer-events-none absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-500/70 ring-1 ring-black/60" />
        <span className="pointer-events-none absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-500/70 ring-1 ring-black/60" />
        <span className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-500/70 ring-1 ring-black/60" />

        {/* Recessed Fixed-Size LED Dot-Matrix Cavity (overflow-hidden prevents any layout resize) */}
        <div
          ref={screenRef}
          className="relative w-full flex-1 rounded-[5px] sm:rounded-[6px] overflow-hidden bg-[#03060c] border border-black/90 flex items-center"
          style={{
            boxShadow: `inset 0 3px 12px rgba(0,0,0,0.96), inset 0 0 22px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.16 * glowRatio).toFixed(2)})`,
          }}
        >
          {/* Ambient Back-Illuminated Phosphor Substrate */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.12 * glowRatio).toFixed(2)}) 0%, rgba(2, 5, 11, 0.92) 78%)`,
            }}
          />

          {/* Unlit Dark Diode Pitch Grid Background */}
          {config.showGridDots && (
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1.15px)',
                backgroundSize: '4px 4px',
              }}
            />
          )}

          {/* Continuous Marquee Track */}
          <div
            ref={trackRef}
            className="relative z-10 flex items-center whitespace-nowrap will-change-transform pl-4"
            style={{
              fontFamily:
                "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
              fontSize: `${fontSizePx}px`,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: `${config.letterSpacing}em`,
              color: config.colorHex,
              textShadow: textShadowStyle,
            }}
          >
            {Array.from({ length: repeatCount }).map((_, idx) => (
              <span
                key={idx}
                ref={idx === 0 ? unitRef : undefined}
                className="inline-flex items-center shrink-0 uppercase"
              >
                <span>{displaySegment}</span>
                <span
                  className="mx-6 sm:mx-8 inline-block opacity-85"
                  style={{ fontSize: `${Math.max(12, Math.round(fontSizePx * 0.65))}px` }}
                >
                  ◆
                </span>
              </span>
            ))}
          </div>

          {/* Physical LED Aperture Matrix Mask Over Letters (turns stroke pixels into glowing LED diodes) */}
          {config.showGridDots && (
            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at center, transparent 1.15px, rgba(2, 5, 10, 0.64) 1.55px)',
                backgroundSize: '4px 4px',
              }}
            />
          )}

          {/* Refresh Scanlines Overlay */}
          {config.showScanlines && (
            <div
              className="pointer-events-none absolute inset-0 z-30 opacity-60"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.34) 0px, rgba(0, 0, 0, 0.34) 1px, transparent 1px, transparent 3px)',
              }}
            />
          )}

          {/* Subtle Outer Glass Anti-Glare Edge Vignette */}
          <div className="pointer-events-none absolute inset-0 z-40 shadow-[inset_0_0_16px_rgba(0,0,0,0.85)] rounded-[5px]" />

          {/* Tiny Physical Power / Status LED Diode Indicator in Bottom-Right Frame Corner */}
          <div className="pointer-events-none absolute bottom-1 right-1.5 z-40 flex items-center gap-1 opacity-75">
            <span
              className={`w-1.5 h-1.5 rounded-full ${config.isPlaying ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: config.isPlaying ? '#10ff7a' : '#f59e0b',
                boxShadow: config.isPlaying ? '0 0 6px #10ff7a' : '0 0 6px #f59e0b',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

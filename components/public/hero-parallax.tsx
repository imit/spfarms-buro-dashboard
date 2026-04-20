"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Roxbury, NY coordinates
const LAT = 42.2962;
const LON = -74.5593;
const ELEVATION = "1,820 ft";

// WMO weather codes to human-readable keywords
function weatherKeyword(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Stormy";
  return "Clear";
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity?: number;
}

function DataRow({ label, value, blinking }: { label: string; value: string; blinking?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-1.5 border-b border-white/6 last:border-0">
      <span className="text-[11px] tracking-[0.15em] uppercase text-white/40 shrink-0">{label}</span>
      <span className={`font-mono text-sm text-white/90 tabular-nums text-right ${blinking ? "animate-pulse" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function HeroParallax() {
  const bgRef = useRef<HTMLDivElement>(null);
  const budRef = useRef<HTMLDivElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  // Update local time for Roxbury, NY (America/New_York)
  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/New_York",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "America/New_York",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather from Open-Meteo
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,relative_humidity_2m&temperature_unit=fahrenheit`
        );
        const data = await res.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
        });
      } catch {
        // Silently fail — hero still renders without weather
      }
    }
    fetchWeather();
  }, []);

  // Parallax scroll
  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (bgRef.current) {
            bgRef.current.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
          }
          if (budRef.current) {
            budRef.current.style.transform = `translate3d(0, ${scrollY * -0.1}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background sky layer */}
      <div
        ref={bgRef}
        className="absolute inset-0 will-change-transform"
        style={{ top: "-10%", bottom: "-10%" }}
      >
        <Image
          src="/assets/h-bg.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/10 to-black/50" />
      </div>

      {/* Bud layer — centered, on top of everything */}
      <div
        ref={budRef}
        className="absolute inset-0 flex items-center justify-center will-change-transform pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] lg:w-[440px] lg:h-[440px]">
          <Image
            src="/assets/i-bud.png"
            alt="Cannabis bud"
            fill
            priority
            className="object-contain drop-shadow-2xl"
            sizes="(max-width: 768px) 280px, (max-width: 1024px) 380px, 440px"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-30 flex flex-col justify-between min-h-screen px-6 lg:px-10 pt-28 pb-10 pointer-events-none">
        {/* Top: Headline */}
        <div className="max-w-5xl">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/50 mb-4">
            Micro-farm / Catskills, NY
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95] drop-shadow-lg">
            We grow
            <br />
            epic flower.
          </h1>
        </div>

        {/* Bottom: Data panel + CTA */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mt-auto">
          <div className="w-full lg:w-auto pointer-events-auto">
            <div className="backdrop-blur-md bg-white/5 border border-white/8 rounded-2xl p-5 w-full lg:w-[320px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40">
                  Live from farm
                </span>
              </div>

              <DataRow label="Location" value="Catskills, NY" />
              <DataRow label="Coordinates" value={`${LAT}°N, ${Math.abs(LON)}°W`} />
              <DataRow label="Elevation" value={ELEVATION} />
              {time && <DataRow label="Local time" value={time} blinking />}
              {date && <DataRow label="Date" value={date} />}
              {weather && (
                <>
                  <DataRow label="Conditions" value={weatherKeyword(weather.weatherCode)} />
                  <DataRow label="Temperature" value={`${weather.temperature}°F`} />
                  {weather.humidity !== undefined && (
                    <DataRow label="Humidity" value={`${weather.humidity}%`} />
                  )}
                </>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 mt-5">
              <Link
                href="/strains"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#431F13] px-7 py-3.5 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Browse strains
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
              <Link
                href="/wholesale"
                className="inline-flex items-center rounded-xl border border-white/20 text-white/80 px-7 py-3.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Become a partner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

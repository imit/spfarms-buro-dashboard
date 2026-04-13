"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Roxbury, NY coordinates
const LAT = 42.2962;
const LON = -74.5593;

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
}

export function HeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const budRef = useRef<HTMLDivElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [time, setTime] = useState("");

  // Update local time for Roxbury, NY (America/New_York)
  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/New_York",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather from Open-Meteo
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
        );
        const data = await res.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
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
            budRef.current.style.transform = `translate3d(0, ${scrollY * -0.15}px, 0)`;
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
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
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
      </div>

      {/* Bud layer */}
      <div
        ref={budRef}
        className="absolute inset-0 flex items-center justify-center will-change-transform"
      >
        <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] lg:w-[440px] lg:h-[440px]">
          <Image
            src="/assets/i-bud.png"
            alt="Cannabis bud"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 768px) 280px, (max-width: 1024px) 380px, 440px"
          />
        </div>
      </div>

      {/* Text overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-lg">
          We grow epic flower
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm md:text-base font-medium tracking-wide uppercase drop-shadow">
          {time && <span>{time}</span>}
          {weather && (
            <>
              <span>{weatherKeyword(weather.weatherCode)}</span>
              <span>{weather.temperature}°F</span>
            </>
          )}
        </div>
        <p className="text-sm md:text-base font-medium tracking-wide uppercase drop-shadow">
          Roxbury, New York
        </p>

        {/* Scalloped "Shop Now" button */}
        <Link href="/strains" className="group relative mt-8 inline-block">
          <svg
            viewBox="0 0 280 120"
            className="w-[240px] md:w-[290px] h-auto drop-shadow-xl"
            aria-hidden="true"
          >
            <path
              d="M 20 20 a 20 20 0 0 0 40 0 a 20 20 0 0 0 40 0 a 20 20 0 0 0 40 0 a 20 20 0 0 0 40 0 a 20 20 0 0 0 40 0 a 20 20 0 0 0 40 0 a 20 20 0 0 0 0 40 a 20 20 0 0 0 0 40 a 20 20 0 0 0 -40 0 a 20 20 0 0 0 -40 0 a 20 20 0 0 0 -40 0 a 20 20 0 0 0 -40 0 a 20 20 0 0 0 -40 0 a 20 20 0 0 0 -40 0 a 20 20 0 0 0 0 -40 a 20 20 0 0 0 0 -40 Z"
              fill="#3B1515"
              className="transition-colors group-hover:fill-[#4D2222]"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[#EBC430] text-lg md:text-2xl font-black tracking-widest drop-shadow">
            SHOP NOW
          </span>
        </Link>
      </div>
    </section>
  );
}

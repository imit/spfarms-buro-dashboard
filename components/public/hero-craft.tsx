"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Wind } from "lucide-react";
import { MetaText } from "./style";

/**
 * Public homepage hero — Catskills landscape with floating bud.
 *
 * - Full-width rounded panel, hero1.jpg as the background photo
 * - Floating bud anchored right-of-center on desktop, slightly lifted on mobile
 * - Location · time · weather meta block sits at bottom-center in white mono
 *   (lifted out of the top bar, where it used to live)
 *
 * Live time is America/New_York. Weather pulled from open-meteo for Roxbury, NY.
 * Renders a graceful placeholder until both have hydrated so the line doesn't
 * jump on first paint.
 */

const LAT = 42.2962;
const LON = -74.5593;

function weatherKeyword(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  if (code <= 99) return "Stormy";
  return "Clear";
}

function useLocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/New_York",
        }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useWeather() {
  const [w, setW] = useState<{ temp: number; code: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setW({
          temp: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return w;
}

export function HeroCraft() {
  const time = useLocalTime();
  const weather = useWeather();

  return (
    <section className="relative z-10 px-4 pt-2 md:px-8">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-sf-sky">
        {/* Aspect frame: tall on mobile, cinematic on desktop */}
        <div className="relative aspect-3/4 min-h-[520px] md:aspect-video md:min-h-[560px]">
          {/* Catskills landscape background */}
          <Image
            src="/assets/hero1.jpg"
            alt="Catskills landscape"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />

          {/* Floating bud — centered, scales up on desktop */}
          <div className="absolute left-1/2 top-1/2 w-[60%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 aspect-square md:w-[42%] md:max-w-[560px]">
            <Image
              src="/assets/i-bud.png"
              alt="Cannabis bud"
              fill
              priority
              className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
              sizes="(max-width: 768px) 60vw, (max-width: 1400px) 42vw, 560px"
            />
          </div>

          {/* Location · time · weather meta — bottom-center, white mono */}
          <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-white md:bottom-12">
            <MetaText size="md" className="drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
              Catskills, New York
            </MetaText>
            <div className="flex items-center gap-2 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
              <MetaText size="md">{time || "—"}</MetaText>
              <Wind className="size-3.5" strokeWidth={2} aria-hidden="true" />
              <MetaText size="md">
                {weather
                  ? `${weatherKeyword(weather.code).toUpperCase()} ${weather.temp}°F`
                  : "— —"}
              </MetaText>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

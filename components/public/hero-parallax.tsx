"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function HeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const budRef = useRef<HTMLDivElement>(null);

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
          <span>07:30</span>
          <span>Windy</span>
          <span>30C</span>
        </div>
        <p className="text-sm md:text-base font-medium tracking-wide uppercase drop-shadow">
          Catskills, New York
        </p>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

export interface CarouselSlide {
  id: number;
  url: string;
  titre?: string | null;
  description?: string | null;
}

interface Props {
  slides: CarouselSlide[];
}

export default function CarouselActu({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  // Défilement automatique toutes les 5 secondes (pause au survol)
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, paused, slides.length]);

  // Réinitialise si les slides changent
  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  // État vide
  if (slides.length === 0) {
    return (
      <div className="w-full aspect-[16/10] rounded-[18px] bg-[#141414] border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center gap-3 text-[#444]">
        <ImageIcon className="w-10 h-10" />
        <span className="text-[0.82rem]">Aucune image configurée</span>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div
      className="relative w-full aspect-[16/10] rounded-[18px] overflow-hidden group select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides avec fondu */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100 z-[1]" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={s.url}
            alt={s.titre || `Actualité ${i + 1}`}
            fill
            className="object-cover"
            unoptimized
            priority={i === 0}
          />
        </div>
      ))}

      {/* Dégradé bas pour le texte */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.8)] via-[rgba(0,0,0,0.15)] to-transparent z-[2] pointer-events-none" />

      {/* Légende */}
      {(slide.titre || slide.description) && (
        <div className="absolute bottom-0 left-0 right-0 z-[3] px-4 sm:px-5 pb-10 sm:pb-11 pointer-events-none">
          {slide.titre && (
            <div className="font-barlow-condensed font-black text-[1.05rem] sm:text-[1.25rem] uppercase text-white leading-[1.2] mb-[3px] drop-shadow-lg">
              {slide.titre}
            </div>
          )}
          {slide.description && (
            <div className="text-[0.76rem] sm:text-[0.82rem] text-[#ccc] drop-shadow">
              {slide.description}
            </div>
          )}
        </div>
      )}

      {/* Flèches (visibles au survol) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-[4] w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[rgba(0,0,0,0.55)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[rgba(0,0,0,0.8)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-[4] w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[rgba(0,0,0,0.55)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[rgba(0,0,0,0.8)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Points de navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[4] flex gap-[6px] items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Aller à l'image ${i + 1}`}
              className={`rounded-full transition-all duration-300 border-none cursor-pointer p-0 ${
                i === current
                  ? "w-5 h-[5px] bg-[#b91c0a]"
                  : "w-[5px] h-[5px] bg-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.6)]"
              }`}
            />
          ))}
        </div>
      )}

      {/* Compteur discret (en haut à droite) */}
      {slides.length > 1 && (
        <div className="absolute top-3 right-3 z-[4] bg-[rgba(0,0,0,0.5)] text-white text-[0.7rem] font-semibold px-2 py-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {current + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}

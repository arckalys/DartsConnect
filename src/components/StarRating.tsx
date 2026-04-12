"use client";

import { Star } from "lucide-react";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 20, readonly = false }: Props) {
  return (
    <div className="inline-flex gap-[2px]">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`bg-transparent border-none p-0 transition-all ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
        >
          <Star
            style={{ width: size, height: size }}
            className={`transition-colors ${
              star <= value
                ? "fill-[#f59e0b] text-[#f59e0b]"
                : "fill-transparent text-[#555]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

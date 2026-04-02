"use client";

import { useEffect, useRef } from "react";

export default function Dartboard() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current!;
    if (!svg) return;

    const ns = "http://www.w3.org/2000/svg";
    const cx = 250, cy = 250;
    const R = { frameOut: 248, out: 215, dblOut: 215, dblIn: 198, triOut: 135, triIn: 118, bullOut: 34, bullIn: 16 };
    const nums = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

    function pt(r: number, a: number): [number, number] {
      const rad = (a - 90) * Math.PI / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }

    function arcPath(r1: number, r2: number, s: number, e: number) {
      const [x1, y1] = pt(r1, s), [x2, y2] = pt(r2, s), [x3, y3] = pt(r2, e), [x4, y4] = pt(r1, e);
      return `M${x1},${y1} A${r1},${r1} 0 0,1 ${x4},${y4} L${x3},${y3} A${r2},${r2} 0 0,0 ${x2},${y2} Z`;
    }

    function add(tag: string, attrs: Record<string, string | number>) {
      const el = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
      svg!.appendChild(el);
      return el;
    }

    // Clear existing children (except defs)
    const defs = svg.querySelector("defs");
    while (svg.lastChild && svg.lastChild !== defs) svg.removeChild(svg.lastChild);

    add("circle", { cx, cy, r: R.frameOut, fill: "url(#frame)" });
    add("circle", { cx, cy, r: R.out, fill: "#1a1510" });

    for (let i = 0; i < 20; i++) {
      const s = i * 18 - 9, e = s + 18, light = i % 2 === 0;
      add("path", { d: arcPath(R.out, R.bullOut + 2, s, e), fill: light ? "url(#sisal)" : "url(#sisalDark)", stroke: "#0d0a06", "stroke-width": "0.8" });
    }
    for (let i = 0; i < 20; i++) {
      const s = i * 18 - 9, e = s + 18, red = i % 2 === 0;
      add("path", { d: arcPath(R.dblOut, R.dblIn, s, e), fill: red ? "#cc1111" : "#006633", stroke: "#0d0a06", "stroke-width": "0.5" });
    }
    for (let i = 0; i < 20; i++) {
      const s = i * 18 - 9, e = s + 18, light = i % 2 === 0;
      add("path", { d: arcPath(R.dblIn, R.triOut, s, e), fill: light ? "url(#sisal)" : "url(#sisalDark)", stroke: "#0d0a06", "stroke-width": "0.5" });
    }
    for (let i = 0; i < 20; i++) {
      const s = i * 18 - 9, e = s + 18, red = i % 2 === 0;
      add("path", { d: arcPath(R.triOut, R.triIn, s, e), fill: red ? "#cc1111" : "#006633", stroke: "#0d0a06", "stroke-width": "0.5" });
    }
    for (let i = 0; i < 20; i++) {
      const s = i * 18 - 9, e = s + 18, light = i % 2 === 0;
      add("path", { d: arcPath(R.triIn, R.bullOut + 2, s, e), fill: light ? "url(#sisal)" : "url(#sisalDark)", stroke: "#0d0a06", "stroke-width": "0.5" });
    }
    for (let i = 0; i < 20; i++) {
      const a = i * 18 - 9;
      const [x1, y1] = pt(R.bullOut + 2, a), [x2, y2] = pt(R.out, a);
      add("line", { x1, y1, x2, y2, stroke: "#0d0a06", "stroke-width": "1.2" });
    }
    [R.dblOut, R.dblIn, R.triOut, R.triIn].forEach(r =>
      add("circle", { cx, cy, r, fill: "none", stroke: "#0d0a06", "stroke-width": "1.5" })
    );
    add("circle", { cx, cy, r: R.out, fill: "none", stroke: "#0d0a06", "stroke-width": "2" });
    add("circle", { cx, cy, r: R.bullOut, fill: "url(#bullGreen)", stroke: "#0d0a06", "stroke-width": "1.5" });
    add("circle", { cx, cy, r: R.bullIn, fill: "url(#bullRed)", stroke: "#0d0a06", "stroke-width": "1" });
    add("circle", { cx, cy, r: 3, fill: "#ff4422" });

    nums.forEach((num, i) => {
      const [x, y] = pt(R.out + 17, i * 18);
      const t = document.createElementNS(ns, "text");
      Object.entries({
        x: String(x), y: String(y), "text-anchor": "middle", "dominant-baseline": "middle",
        "font-family": "Arial Black, sans-serif", "font-size": "17", "font-weight": "900", fill: "#f0e0c0"
      }).forEach(([k, v]) => t.setAttribute(k, v));
      t.textContent = String(num);
      svg.appendChild(t);
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      className="absolute right-[-100px] xs:right-[-110px] sm:right-[-120px] md:right-[-130px] top-1/2 -translate-y-[52%] -rotate-[18deg] w-[400px] xs:w-[500px] sm:w-[600px] md:w-[700px] lg:w-[820px] h-[400px] xs:h-[500px] sm:h-[600px] md:h-[700px] lg:h-[820px] opacity-40 xs:opacity-50 sm:opacity-60 md:opacity-65 lg:opacity-75 z-0 drop-shadow-[0_0_80px_rgba(232,34,10,0.25)] drop-shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sisal" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c8b89a" /><stop offset="40%" stopColor="#b8a882" /><stop offset="100%" stopColor="#8a7455" /></radialGradient>
        <radialGradient id="sisalDark" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2a2218" /><stop offset="60%" stopColor="#1a1510" /><stop offset="100%" stopColor="#0d0a06" /></radialGradient>
        <radialGradient id="frame" cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#3a2510" /><stop offset="50%" stopColor="#1e1208" /><stop offset="100%" stopColor="#0a0602" /></radialGradient>
        <radialGradient id="bullGreen" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#009944" /><stop offset="100%" stopColor="#005522" /></radialGradient>
        <radialGradient id="bullRed" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ee1111" /><stop offset="100%" stopColor="#990000" /></radialGradient>
      </defs>
    </svg>
  );
}

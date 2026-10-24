"use client";

import { useEffect, useRef } from "react";
import { createSignalScene, PART_LABELS } from "@/lib/signal";

const cityLinks = [
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];

const title = "mb-4 font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05]";
const text = "mb-6 max-w-[420px] text-muted md:text-lg";

function Chapter({ id, eyebrow, children }: { id: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div id={id} className="flex min-h-screen flex-col justify-end pb-[6vh] md:justify-center md:pb-0">
      <p className="mb-4 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
        <span className="size-1.5 rounded-full bg-accent" />
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

// the 3D bat-signal stays pinned on the right while the chapters scroll past on the left
export default function Story() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const cityLinesRef = useRef<SVGSVGElement>(null);
  const linkRefs = useRef<HTMLAnchorElement[]>([]);
  const aim = useRef(-1); // which menu link is hovered, -1 = none
  const replay = useRef(() => {});

  useEffect(() => {
    try {
      const scene = createSignalScene({
        canvas: canvasRef.current!,
        labelBox: labelsRef.current!,
        cityLines: cityLinesRef.current!,
        cityLinks: linkRefs.current,
        aim,
      });
      replay.current = scene.replay;
      return scene.destroy;
    } catch (err) {
      // usually no WebGL on this computer. the page still shows, just without the 3D part
      console.warn("3D scene didn't start", err);
    }
  }, []);

  return (
    <section id="top" className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-[radial-gradient(ellipse_at_68%_35%,#19202a_0%,var(--color-night)_65%)]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="3D model of a Bat-Signal"
          className="absolute top-[6vh] right-0 h-[55%] w-full cursor-grab touch-pan-y active:cursor-grabbing md:top-0 md:h-full md:w-[64%]"
        />

        <div ref={labelsRef} aria-hidden="true" className="leaders pointer-events-none absolute inset-0 opacity-0 max-md:hidden">
          <svg className="absolute inset-0 size-full">
            {PART_LABELS.map((l) => (
              <g key={l.title}>
                <line />
                <circle r="3" />
              </g>
            ))}
          </svg>
          {PART_LABELS.map((l) => (
            <div
              key={l.title}
              className={`part-label absolute top-0 left-0 border-accent px-2.5 font-mono text-[0.7rem] whitespace-nowrap text-muted ${l.dx < 0 ? "border-r-2 text-right" : "border-l-2"}`}
            >
              <b className="block font-medium tracking-widest text-ink uppercase">{l.title}</b>
              {l.note}
            </div>
          ))}
        </div>

        <svg ref={cityLinesRef} aria-hidden="true" className="leaders city-lines pointer-events-none absolute inset-0 size-full opacity-0 max-md:hidden">
          {cityLinks.map((link) => (
            <g key={link.href}>
              <line />
              <circle r="3" />
            </g>
          ))}
        </svg>

        <div className="absolute right-[6vw] bottom-8 flex flex-col items-end gap-2 font-mono text-[0.7rem] tracking-widest text-muted uppercase max-md:hidden">
          <button
            type="button"
            onClick={() => replay.current()}
            className="cursor-pointer border border-line px-3 py-1.5 text-ink uppercase hover:border-accent hover:text-accent"
          >
            ↻ Replay build
          </button>
          <span>Drag to rotate</span>
        </div>
      </div>

      <div className="relative -mt-[100vh] w-full px-5 md:w-[42%] md:pr-0 md:pl-[6vw]">
        <Chapter id="ch1" eyebrow="01 / Hello">
          <h1 className={title}>
            Good evening.
            <br />
            Welcome to my page.
          </h1>
          <p className={text}>
            I&apos;m Alfred. Scroll with me and I&apos;ll introduce you to Master Bryan and the things he builds.
          </p>
          <div className="flex flex-wrap gap-4 text-accent">
            <a href="https://github.com/bryan-njit" target="_blank" rel="noopener" className="hover:underline">GitHub</a>
            <a href="https://www.linkedin.com/in/bryanmuhia/" target="_blank" rel="noopener" className="hover:underline">LinkedIn</a>
            <a href="mailto:bm564@njit.edu" className="hover:underline">Email</a>
          </div>
        </Chapter>

        <Chapter id="ch2" eyebrow="02 / About">
          <h2 className={title}>Student by day.</h2>
          <p className={text}>
            Master Bryan studies computer science at NJIT. By night he works as a valet, the closest he
            gets to the Batmobile. In between, he turns what he learns into projects that actually run.
          </p>
        </Chapter>

        <Chapter id="ch3" eyebrow="03 / Process">
          <h2 className={title}>Every part has a job.</h2>
          <p className={text}>
            Much like this old lamp. An app is a stack of parts, the interface, the logic and the data,
            and he builds each one so they work together.
          </p>
        </Chapter>

        <Chapter id="ch4" eyebrow="04 / What he builds">
          <h2 className={title}>Built for when the city calls.</h2>
          <p className={text}>
            Web apps, live maps, AI tools and Android apps that people can rely on. Allow me to switch it on.
          </p>
        </Chapter>

        <Chapter id="ch5" eyebrow="05 / Explore">
          <h2 className={title}>Where to, sir?</h2>
          <p className={text}>Pick a part of the city and I&apos;ll show you around.</p>
          <ol className="max-w-[320px]">
            {cityLinks.map((link, i) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  ref={(el) => {
                    if (el) linkRefs.current[i] = el;
                  }}
                  onMouseEnter={() => (aim.current = i)}
                  onMouseLeave={() => (aim.current = -1)}
                  onFocus={() => (aim.current = i)}
                  onBlur={() => (aim.current = -1)}
                  className="flex items-baseline gap-4 border-b border-line py-2.5 font-display text-2xl hover:border-accent hover:text-accent focus-visible:text-accent"
                >
                  <span className="font-mono text-[0.7rem] text-muted">0{i + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ol>
        </Chapter>
      </div>
    </section>
  );
}

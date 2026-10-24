"use client";

import { useEffect, useState } from "react";

const links = ["About", "Projects", "Skills", "Experience", "Education", "Contact"];

export default function Header() {
  // which chapter of the 3D story is on screen
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    function onScroll() {
      const chapterHeight = document.getElementById("ch1")!.offsetHeight;
      setChapter(Math.min(Math.round(window.scrollY / chapterHeight), 4));
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-10 bg-linear-to-b from-night from-40% to-transparent">
      <nav className="flex items-center justify-between px-5 py-5 md:px-[6vw]">
        <a href="#top" className="font-display text-xl font-semibold uppercase tracking-widest">
          Bryan Muhia
        </a>

        <div className="hidden gap-3 font-mono text-xs xl:flex">
          {[1, 2, 3, 4, 5].map((n, i) => (
            <a key={n} href={`#ch${n}`} className={chapter === i ? "text-accent" : "text-muted"}>
              0{n}
            </a>
          ))}
        </div>

        <ul className="hidden gap-6 font-mono text-xs uppercase md:flex">
          {links.map((link) => (
            <li key={link}>
              <a href={`#${link.toLowerCase()}`} className="text-muted hover:text-accent">
                {link}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

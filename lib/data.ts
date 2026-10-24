// everything here comes from my resume

export const projects = [
  {
    name: "ParkSmart",
    url: "https://parksmart-five.vercel.app/",
    description:
      "A mobile-friendly map of NJIT's 7 parking lots that marks each one Open, Filling Up, Almost Full, or Full from simulated data that refreshes every 30 seconds. Pick a building and it ranks the lots by walking time, or use your location if you're already on campus. Bad sensor readings, like negative car counts, show the lot as \"Offline\" instead of a wrong number.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Leaflet.js", "Recharts"],
  },
  {
    name: "AI Flashcard Maker",
    url: "https://flashcard-project-dusky.vercel.app/",
    description:
      "Paste in class notes and get flip-card flashcards back. A Next.js API route sends the notes to the Claude API with a JSON schema, and the server checks every card before showing it. The API key stays on the server, with per-IP rate limiting and a 15,000-character input cap to keep costs down.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Claude API"],
  },
  {
    name: "Android Apps",
    url: null,
    description:
      "Three Kotlin apps for CodePath's Android course: a Wordle-style word game, a wishlist tracker, and an email inbox. They use RecyclerView lists with custom adapters, input validation, long-press delete, links that open in the browser, and a Load More button.",
    tech: ["Kotlin", "Android Studio"],
  },
];

export const skills = [
  { group: "Languages", items: ["Python", "Java", "Kotlin", "JavaScript", "TypeScript", "C", "C++", "SQL"] },
  { group: "Frameworks", items: ["React", "Next.js", "Tailwind CSS", "Leaflet.js", "Recharts"] },
  { group: "Tools", items: ["Android Studio", "Claude API", "Claude Code", "Git", "GitHub", "MySQL"] },
];

export const jobs = [
  {
    title: "Valet Parking Associate",
    company: "APC Hospitality",
    dates: "Aug 2026 – Present",
    description:
      "Park and bring back cars for residents and guests at a condo building while keeping track of every key. Work with coworkers and building staff on requests so traffic keeps moving.",
  },
  {
    title: "Sales Associate",
    company: "AutoZone",
    dates: "May 2025 – Aug 2026",
    description:
      "Helped 20–30 customers a day pick the right parts and figure out car problems in Jersey City. Kept a 1,000+ product inventory organized and trained new hires on customer service, inventory, and product knowledge.",
  },
];

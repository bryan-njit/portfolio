import Header from "@/components/Header";
import Section from "@/components/Section";
import Story from "@/components/Story";
import { jobs, projects, skills } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Header />
      <Story />

      <main className="mx-auto max-w-[720px] px-4 py-16 text-muted">
        <Section id="about" title="About">
          <p className="mb-3 max-w-[540px]">
            I&apos;m a Computer Science student at NJIT interested in software engineering and web
            development. I like building things and turning what I learn in class into real projects.
          </p>
          <p className="max-w-[540px]">
            I&apos;ve worked with Python, Java, Kotlin, JavaScript, TypeScript, and C++ through
            coursework, personal projects, and CodePath. I&apos;m looking for internship opportunities
            where I can grow as a developer.
          </p>
        </Section>

        <Section id="projects" title="Projects">
          <div className="grid gap-4">
            {projects.map((project, i) => (
              <div key={project.name} className="border border-l-[3px] border-line border-l-accent bg-panel p-5">
                <span className="font-mono text-[0.7rem] tracking-widest">CASE FILE 0{i + 1}</span>
                <h3 className="mb-2 font-display text-2xl font-semibold text-ink">
                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noopener" className="hover:text-accent">
                      {project.name} ↗
                    </a>
                  ) : (
                    project.name
                  )}
                </h3>
                <p className="mb-3">{project.description}</p>
                <ul className="flex flex-wrap gap-2 font-mono text-xs">
                  {project.tech.map((t) => (
                    <li key={t} className="border border-line px-2 py-0.5">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="skills" title="Skills">
          {skills.map((skill) => (
            <div key={skill.group} className="mb-5">
              <h3 className="mb-2 font-display text-lg font-semibold">{skill.group}</h3>
              <ul className="flex flex-wrap gap-2 text-sm text-ink">
                {skill.items.map((item) => (
                  <li key={item} className="border border-line bg-panel px-2.5 py-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="experience" title="Experience">
          {jobs.map((job) => (
            <div key={job.company} className="mb-5">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <h3 className="font-display text-xl font-semibold text-ink">
                  {job.title} · {job.company}
                </h3>
                <span className="font-mono text-xs">{job.dates}</span>
              </div>
              <p className="mt-2">{job.description}</p>
            </div>
          ))}
        </Section>

        <Section id="education" title="Education">
          <div className="mb-5">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <h3 className="font-display text-xl font-semibold text-ink">B.S. in Computer Science · NJIT</h3>
              <span className="font-mono text-xs">Expected December 2027</span>
            </div>
            <p className="mt-2">
              Relevant coursework: Data Structures &amp; Algorithms, Databases, Operating Systems,
              Intensive Programming in Linux, Programming Language Concepts (C++), Software
              Engineering, and Web Development.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">CodePath</h3>
            <p className="mt-2">Web101 (web development), TIP102 (interview prep), and AND102 (Android, in progress).</p>
          </div>
        </Section>

        <Section id="contact" title="Contact">
          <p className="mb-4 max-w-[480px]">
            I&apos;m currently looking for software engineering internships and opportunities to keep
            growing as a developer. Feel free to reach out.
          </p>
          <div className="flex flex-wrap gap-4 text-accent">
            <a href="mailto:bm564@njit.edu" className="hover:underline">bm564@njit.edu</a>
            <a href="https://www.linkedin.com/in/bryanmuhia/" target="_blank" rel="noopener" className="hover:underline">LinkedIn</a>
            <a href="https://github.com/bryan-njit" target="_blank" rel="noopener" className="hover:underline">GitHub</a>
          </div>
        </Section>
      </main>

      <footer className="mx-auto max-w-[720px] border-t border-line px-4 py-8 text-sm text-muted">
        <p>© 2026 Bryan Muhia</p>
      </footer>
    </>
  );
}

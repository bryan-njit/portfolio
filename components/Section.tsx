type Props = {
  id: string;
  title: string;
  children: React.ReactNode;
};

// one block of the page below the 3D part, with a "// TITLE" heading
export default function Section({ id, title, children }: Props) {
  return (
    <section id={id} className="mt-8 scroll-mt-20 border-t border-line pt-8 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-[0.12em] text-accent">
        <span className="text-muted">{"// "}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SimplePageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function SimplePageShell({
  eyebrow,
  title,
  description,
  children,
}: SimplePageShellProps) {
  return (
    <main id="content" className="section-shell py-16 sm:py-20">
      <section className="panel-glass relative overflow-hidden p-8 sm:p-10 lg:p-14">
        <div className="absolute left-0 top-6 h-40 w-40 rounded-full bg-radial-cobalt blur-3xl" />
        <div className="absolute right-0 top-6 h-40 w-40 rounded-full bg-radial-ember blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-5 text-balance text-4xl font-semibold text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {description}
          </p>
          <Link
            href="/#quote"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cobalt/30 hover:bg-white/[0.08]"
          >
            Build a quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 py-10">{children}</section>
    </main>
  );
}

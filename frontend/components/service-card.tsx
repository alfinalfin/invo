import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Boxes,
  Globe2,
  PackageCheck,
  Route,
  ShieldCheck,
  Snowflake,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";

import type { Service } from "@/data/site-content";

const iconMap: Record<string, LucideIcon> = {
  "same-day-courier": Zap,
  "next-day-delivery": Route,
  "full-day-hire": Truck,
  "half-day-hire": Truck,
  "import-coordination": ArrowRightLeft,
  "export-movements": Globe2,
  "multi-drop": Boxes,
  "two-person-delivery": Users,
  "temperature-controlled": Snowflake,
  "fragile-high-value": ShieldCheck,
  "contract-logistics": PackageCheck,
  "warehousing-cross-dock": Warehouse,
};

type ServiceCardProps = {
  service: Service;
};

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = iconMap[service.slug] || Truck;

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/5 p-5 shadow-aura transition duration-300 hover:-translate-y-1 hover:border-cobalt/30 hover:bg-white/[0.08] ${
        service.featured ? "lg:p-7" : ""
      }`}
    >
      <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-cobalt/20 blur-3xl transition duration-300 group-hover:bg-signalOrange/20" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cobalt">
              {service.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              {service.title}
            </h3>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cobalt">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          {service.description}
        </p>

        <div
          className="bg-slate-800/50 animate-pulse mt-6 aspect-video rounded-xl"
          role="img"
          aria-label={`${service.title} service placeholder image`}
        />

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
            {service.note}
          </p>
          <Link
            href="/#quote"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-cobalt/30 hover:bg-white/10"
          >
            Quote
          </Link>
        </div>
      </div>
    </article>
  );
}

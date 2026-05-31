import type { VisitInsights } from "@/features/visits/insights";
import { countryCodeToFlag } from "@/lib/utils";

export function VisitInsightsPanel({ insights }: { insights: VisitInsights }) {
  const yoyDelta = insights.visitsThisYear - insights.visitsLastYear;
  const yoyLabel =
    insights.visitsLastYear === 0
      ? insights.visitsThisYear > 0
        ? "First visits this year"
        : "No visits yet this year"
      : yoyDelta === 0
        ? "Same as last year"
        : yoyDelta > 0
          ? `+${yoyDelta} vs last year`
          : `${yoyDelta} vs last year`;

  const topYears = insights.visitsByYear.slice(0, 4);

  return (
    <section className="mt-6 space-y-4" aria-label="Travel insights">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Insights
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          title={`${insights.currentYear} visits`}
          value={String(insights.visitsThisYear)}
          detail={yoyLabel}
        />
        <InsightCard
          title="Month streak"
          value={String(insights.visitStreakMonths)}
          detail={
            insights.visitStreakMonths === 1
              ? "month with a logged visit"
              : "months in a row with visits"
          }
        />
        <InsightCard
          title="New countries"
          value={String(insights.newCountriesThisYear.length)}
          detail={`first visited in ${insights.currentYear}`}
        />
        <InsightCard
          title="Busiest years"
          value={
            topYears[0] ? String(topYears[0].count) : "—"
          }
          detail={
            topYears[0]
              ? `${topYears[0].year}${topYears[1] ? ` · ${topYears[1].year}: ${topYears[1].count}` : ""}`
              : "Log visits to see trends"
          }
        />
      </div>

      {insights.newCountriesThisYear.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            New this year
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {insights.newCountriesThisYear.map((c) => (
              <li
                key={c.code}
                className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-900 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {countryCodeToFlag(c.code)} {c.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function InsightCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}

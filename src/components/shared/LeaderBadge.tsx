/** Marks a student house leader (prefect). Purely cosmetic — leaders have no extra write powers. */
export function LeaderBadge() {
  return (
    <span className="chip border-gold/50 align-middle font-heading text-[9px] uppercase tracking-wider text-gold-light" title="House leader">
      Leader
    </span>
  );
}

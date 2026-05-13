import Link from "next/link";

export function getPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  pageParam?: string;
  preserveParams?: Record<string, number>;
};

export function PaginationLinks({
  basePath,
  currentPage,
  totalPages,
  pageParam = "page",
  preserveParams,
}: Props) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (preserveParams) {
      for (const [key, val] of Object.entries(preserveParams)) {
        if (val > 1) params.set(key, String(val));
      }
    }
    if (page > 1) params.set(pageParam, String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <PaginationItem
        href={buildHref(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </PaginationItem>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-white/30">…</span>
        ) : (
          <PaginationItem key={p} href={buildHref(p)} active={p === currentPage}>
            {p}
          </PaginationItem>
        )
      )}

      <PaginationItem
        href={buildHref(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </PaginationItem>
    </nav>
  );
}

function PaginationItem({
  href,
  active,
  disabled,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const base =
    "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors";
  const activeClass = "bg-[#ff7224] text-white";
  const normalClass = "text-white/50 hover:bg-white/[0.06] hover:text-white";
  const disabledClass = "pointer-events-none text-white/20";

  if (disabled) {
    return (
      <span className={`${base} ${disabledClass}`} aria-hidden="true">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`${base} ${active ? activeClass : normalClass}`}
    >
      {children}
    </Link>
  );
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}

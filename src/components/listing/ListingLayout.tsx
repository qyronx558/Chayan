import type { ReactNode } from "react"

interface ListingLayoutProps {
  filters: ReactNode
  children: ReactNode
}

/**
 * Flipkart-style listing shell: sticky facet rail on the left,
 * results and toolbar on the right. Collapses to one column on mobile.
 */
export function ListingLayout({ filters, children }: ListingLayoutProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="min-w-0">{filters}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

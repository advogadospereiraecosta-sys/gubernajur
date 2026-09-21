import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function PageHeader({
  backHref,
  title,
  subtitle,
  action,
}: {
  backHref?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

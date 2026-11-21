export function RouteLoading({shop = false}: {shop?: boolean}) {
 return <div className={shop ? 'shell page' : 'py-6'} data-route-loading="true" role="status" aria-live="polite">
  <p className="text-sm font-medium text-muted">Chargement de la page…</p>
  <div className="grid gap-4" aria-hidden="true"><div className="h-10 w-2/3 max-w-md rounded-control bg-surface"/>
   <div className="min-h-64 rounded-card border border-line bg-subtle"/>
  </div>
 </div>;
}

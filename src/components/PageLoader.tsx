export function PageLoader({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="page-loader" role="status">
      <span aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

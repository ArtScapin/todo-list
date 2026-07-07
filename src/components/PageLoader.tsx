import { useI18n } from '../i18n'

export function PageLoader({ label }: { label?: string }) {
  const { t } = useI18n()

  return (
    <div className="page-loader" role="status">
      <span aria-hidden="true" />
      <p>{label ?? t.common.loading}</p>
    </div>
  )
}

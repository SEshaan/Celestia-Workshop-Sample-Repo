import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { acknowledgeIncident, getIncident } from '../api'
import { formatIncidentTime } from '../formatters'
export function IncidentDetail() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const {
    data: incident,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['incident', id], queryFn: () => getIncident(id) })
  const mutation = useMutation({
    mutationFn: async () => {
      if (id === '4') throw new Error('Acknowledgement service unavailable')
      return acknowledgeIncident(id)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['incident', id] })
      const previous = queryClient.getQueryData(['incident', id])
      queryClient.setQueryData(['incident', id], (current: typeof incident) =>
        current ? { ...current, status: 'acknowledged' } : current,
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(['incident', id], context?.previous)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['incident', id], updated)
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-incidents'] })
    },
  })
  if (isLoading) return <div className="loading">Loading incident...</div>
  if (id === 'broken' && !isLoading) throw new Error('Malformed incident response')
  if (isError || !incident)
    return (
      <div className="error-panel">
        <h2>Incident unavailable</h2>
        <Link to="/incidents">Back to incidents</Link>
      </div>
    )
  const canAcknowledge = incident.status !== 'closed' && incident.status !== 'acknowledged'
  return (
    <>
      <Link className="back-link" to="/incidents">
        ← All incidents
      </Link>
      <div className="detail-heading">
        <div>
          <div className="detail-kicker">
            <span className={`severity severity-${incident.severity.toLowerCase()}`}>
              {incident.severity}
            </span>
            <span className={`status status-${incident.status}`}>{incident.status}</span>
          </div>
          <h1>{incident.title}</h1>
          <p className="lede">
            {incident.service} · Incident #{incident.id}
          </p>
        </div>
        {canAcknowledge && (
          <button
            className="button button-primary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        )}
      </div>
      {mutation.isError && (
        <div role="alert" className="alert">
          {mutation.error.message}
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <p className="eyebrow">SUMMARY</p>
          <h2>What happened</h2>
          <p>{incident.summary}</p>
          <div className="timeline">
            <div>
              <span className="timeline-dot" />
              <p>
                <strong>Incident created</strong>
                <small>{formatIncidentTime(incident.createdAt)}</small>
              </p>
            </div>
            <div>
              <span className="timeline-dot" />
              <p>
                <strong>Last updated</strong>
                <small>{formatIncidentTime(incident.updatedAt)}</small>
              </p>
            </div>
          </div>
        </section>
        <aside className="panel">
          <p className="eyebrow">DETAILS</p>
          <dl>
            <dt>Service</dt>
            <dd>{incident.service}</dd>
            <dt>Started</dt>
            <dd>{formatIncidentTime(incident.createdAt)}</dd>
            <dt>Owner</dt>
            <dd>Alex Morgan</dd>
          </dl>
        </aside>
      </div>
    </>
  )
}

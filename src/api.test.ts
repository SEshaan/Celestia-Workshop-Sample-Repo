import { afterEach, describe, expect, it } from 'vitest'
import { acknowledgeIncident, getIncident, getIncidents, resetApi } from './api'

afterEach(resetApi)

describe('incident API contract', () => {
  it('returns a paginated incident response', async () => {
    const response = await getIncidents(1)
    expect(response.page).toBe(1)
    expect(response.incidents).toHaveLength(4)
    expect(response.totalPages).toBe(2)
  })

  it('rejects acknowledgement for a closed incident', async () => {
    await expect(acknowledgeIncident('5')).rejects.toThrow('Only active incidents')
  })

  it('fetches and acknowledges Payment API latency incident (id 1)', async () => {
    const incident = await getIncident('1')
    expect(incident.id).toBe('1')
    expect(incident.title).toBe('Payment API latency')
    expect(incident.service).toBe('payments-api')
    expect(incident.status).toBe('open')

    const acknowledged = await acknowledgeIncident('1')
    expect(acknowledged.status).toBe('acknowledged')
    expect(acknowledged.updatedAt).toBeDefined()
  })
})

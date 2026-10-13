import { describe, expect, it } from 'vitest'
import { parseHash, taskLink } from './route'

describe('route', () => {
  it('parses the page and query', () => {
    const { path, params } = parseHash('#/tasks?search=Faire%20le%20lit')
    expect(path).toBe('tasks')
    expect(params.get('search')).toBe('Faire le lit')
    expect(parseHash('#/today').path).toBe('today')
    expect(parseHash('').path).toBe('')
  })

  it('round-trips titles with special characters', () => {
    const title = 'Purger / dépoussiérer les radiateurs & co ?'
    expect(parseHash(taskLink(title)).params.get('search')).toBe(title)
  })
})

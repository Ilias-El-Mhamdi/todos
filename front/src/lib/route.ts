/** "#/tasks?search=x" → { path: 'tasks', params } */
export function parseHash(hash: string): { path: string; params: URLSearchParams } {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  return { path, params: new URLSearchParams(query) }
}

/** Link to the task list, pre-filtered on a task's title. */
export function taskLink(title: string): string {
  return `#/tasks?${new URLSearchParams({ search: title })}`
}

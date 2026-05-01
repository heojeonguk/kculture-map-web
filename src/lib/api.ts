const getBase = () => typeof window !== 'undefined' ? window.location.origin : ''

export interface NotificationPayload {
  user_id: string
  type: string
  post_id: string | null
  from_user_name: string
  from_avatar_url?: string | null
  message: string
}

export const api = {
  notifications: {
    create: async (payload: NotificationPayload) => {
      const res = await fetch(`${getBase()}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return res.json()
    },
    list: async (userId: string) => {
      const res = await fetch(`${getBase()}/api/notifications?user_id=${userId}`)
      return res.json()
    },
    markRead: async (userId: string) => {
      const res = await fetch(`${getBase()}/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      return res.json()
    },
  },
  translate: async (text: string, targetLocale: string) => {
    const res = await fetch(`${getBase()}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLocale }),
    })
    return res.json()
  },
  aiSearch: async (query: string, locale: string) => {
    const res = await fetch(`${getBase()}/api/ai-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, locale }),
    })
    return res.json()
  },
}

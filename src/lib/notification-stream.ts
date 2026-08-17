type NotificationStreamController = ReadableStreamDefaultController<Uint8Array>

const clients = new Set<NotificationStreamController>()

export function addNotificationClient(controller: NotificationStreamController): () => void {
  clients.add(controller)
  return () => {
    clients.delete(controller)
  }
}

export function broadcastNotification(payload: unknown) {
  const encoder = new TextEncoder()
  const data = `data: ${JSON.stringify(payload)}\n\n`
  for (const controller of clients) {
    try {
      controller.enqueue(encoder.encode(data))
    } catch {
      clients.delete(controller)
    }
  }
}

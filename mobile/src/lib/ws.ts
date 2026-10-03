import { type ClientMsg, parseServerMsg, type ServerMsg } from "@justmate/protocol"

const url = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3001"

export type Socket = {
  send(msg: ClientMsg): void
  close(): void
}

export function openSocket(onMessage: (msg: ServerMsg) => void, demo?: "a" | "b"): Socket {
  const ws = new WebSocket(demo ? `${url}?demo=${demo}` : url)
  const pending: string[] = []

  ws.onopen = () => {
    for (const frame of pending.splice(0)) ws.send(frame)
  }

  ws.onmessage = (event) => {
    const msg = parseServerMsg(event.data)
    if (msg) onMessage(msg)
  }

  return {
    send(msg) {
      const frame = JSON.stringify(msg)
      if (ws.readyState === WebSocket.OPEN) ws.send(frame)
      else pending.push(frame)
    },
    close: () => ws.close(),
  }
}

import { type ClientMsg, parseServerMsg, type ServerMsg } from "@justmate/protocol"

import { apiURL } from "./auth-client"

const url = process.env.EXPO_PUBLIC_WS_URL ?? `${apiURL.replace(/^http/, "ws")}/ws`

export type Demo = "a" | "b"

export type Socket = {
  send(msg: ClientMsg): void
  close(): void
}

type Handlers = { onMessage: (msg: ServerMsg) => void; onClose: (code: number) => void }

export function openSocket({ onMessage, onClose }: Handlers, demo?: Demo): Socket {
  const ws = new WebSocket(demo ? `${url}?demo=${demo}` : url)
  const pending: string[] = []

  ws.onopen = () => {
    for (const frame of pending.splice(0)) ws.send(frame)
  }

  ws.onmessage = (event) => {
    const msg = parseServerMsg(event.data)
    if (msg) onMessage(msg)
  }

  ws.onclose = (event) => onClose(event.code)

  return {
    send(msg) {
      const frame = JSON.stringify(msg)
      if (ws.readyState === WebSocket.OPEN) ws.send(frame)
      else if (ws.readyState === WebSocket.CONNECTING) pending.push(frame)
    },
    close: () => ws.close(1000),
  }
}

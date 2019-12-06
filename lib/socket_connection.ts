import { EventEmitterMixin, IBaseEvents } from '@aperos/event-emitter'
import { ISocketMessage } from '@aperos/rpc-common'

export type SocketMessageCallback = (message?: ISocketMessage) => any

export interface ISocketMessageSendParams {
  message: ISocketMessage
}

export interface ISocketConnection {
  send(p: ISocketMessageSendParams): Promise<object>
}

export interface ISocketConnectionParams {
  serverUrl: string
}

class MessageSink {
  private callback: SocketMessageCallback

  constructor (callback: SocketMessageCallback) {
    this.callback = callback
  }

  capture (message?: ISocketMessage) {
    this.callback(message)
  }
}

export interface ISocketConnectionEvents extends IBaseEvents {
  readonly open: (conn: ISocketConnection) => void
  readonly response: (conn: ISocketConnection, m: ISocketMessage) => void
  readonly timeout: (conn: ISocketConnection, m: ISocketMessage) => void
}

export class BaseSocketConnection {}

export class SocketConnection
  extends EventEmitterMixin<ISocketConnectionEvents>(BaseSocketConnection)
  implements ISocketConnection {
  readonly serverUrl: string

  private isConnected = false
  private ws?: WebSocket

  private readonly sinkMap = new Map<number, MessageSink>()

  constructor (p: ISocketConnectionParams) {
    super()
    this.serverUrl = p.serverUrl
  }

  async send (p: ISocketMessageSendParams): Promise<object> {
    await this.ensureConnectionExists()
    return new Promise(resolve => {
      const t = setTimeout(() => {
        this.emit('timeout', this, p.message)
        resolve()
      }, p.message.ttl)
      this.sinkMap.set(
        p.message.id,
        new MessageSink(response => {
          clearTimeout(t)
          this.emit('response', this, response!)
          resolve(response)
        })
      )
      this.ws!.send(JSON.stringify(p.message))
    })
  }

  protected async ensureConnectionExists () {
    if (!this.isConnected) {
      await this.reconnect()
    }
  }

  protected async reconnect () {
    return new Promise((resolve, reject) => {
      let ws: WebSocket
      try {
        ws = new WebSocket(this.serverUrl)
        ws.addEventListener('close', () => {
          this.isConnected = false
        })
        ws.addEventListener('error', () => {
          reject()
        })
        ws.addEventListener('message', (event: MessageEvent) => {
          const response: ISocketMessage = JSON.parse(event.data)
          const sink = this.sinkMap.get(response.id)
          if (sink) {
            this.sinkMap.delete(response.id)
            sink.capture(response)
          }
        })
        ws.addEventListener('open', () => {
          this.isConnected = true
          this.ws = ws
          resolve()
          this.emit('open', this)
        })
      } catch (e) {
        reject(e.message)
      }
    })
  }
}

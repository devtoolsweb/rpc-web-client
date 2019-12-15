import { EventEmitterMixin } from '@aperos/event-emitter'
import {
  IRpcMessage,
  IRpcResponse,
  JsonRpcId,
  RpcResponse
} from '@aperos/rpc-common'
import { IRpcConnection, IRpcConnectionEvents } from './rpc_connection'

export type SocketMessageCallback = (message?: IRpcResponse) => any

export interface ISocketConnection extends IRpcConnection {}

export interface ISocketConnectionProps {
  messageTtl: number
  serverUrl: string
}

class MessageSink {
  private callback: SocketMessageCallback

  constructor (callback: SocketMessageCallback) {
    this.callback = callback
  }

  capture (r: IRpcResponse) {
    this.callback(r)
  }
}

export class BaseSocketConnection {}

export class SocketConnection
  extends EventEmitterMixin<IRpcConnectionEvents>(BaseSocketConnection)
  implements ISocketConnection {
  readonly messageTtl: number
  readonly serverUrl: string

  private isConnected = false
  private ws?: WebSocket

  private readonly sinkMap = new Map<JsonRpcId, MessageSink>()

  constructor (p: ISocketConnectionProps) {
    super()
    this.messageTtl = p.messageTtl || 0
    this.serverUrl = p.serverUrl
  }

  async send (message: IRpcMessage) {
    await this.ensureConnectionExists()
    const data = JSON.stringify(message)
    const id = message.id
    if (!!id) {
      return new Promise<IRpcResponse>(resolve => {
        const t = setTimeout(() => {
          this.emit('timeout', this, message)
          resolve()
        }, message.ttl)
        this.sinkMap.set(
          id,
          new MessageSink(m => {
            clearTimeout(t)
            const response = m as IRpcResponse
            this.emit('response', this, response)
            resolve(response)
          })
        )
        this.ws!.send(data)
      })
    } else {
      this.ws!.send(data)
      return new Promise<IRpcResponse>(resolve => {
        resolve(new RpcResponse({ id: 0 }))
      })
    }
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
          const response = JSON.parse(event.data) as IRpcResponse
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

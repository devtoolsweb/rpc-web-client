import { IRpcResponse, IRpcRequest, RpcRequest } from '@aperos/rpc-common'
import {
  EventEmitterMixin,
  IBaseEvents,
  ITypedEventEmitter,
  EventEmitterConstructor
} from '@aperos/event-emitter'

export interface IRpcConnectionEvent {
  comment?: string
  connection: IRpcConnection
  request?: IRpcRequest
  response?: IRpcResponse
}

export interface IRpcConnectionEvents extends IBaseEvents {
  readonly open: (event: IRpcConnectionEvent) => void
  readonly error: (event: IRpcConnectionEvent) => void
  readonly request: (event: IRpcConnectionEvent) => void
  readonly response: (event: IRpcConnectionEvent) => void
  readonly timeout: (event: IRpcConnectionEvent) => void
}

export interface IRpcConnection extends ITypedEventEmitter<IRpcConnectionEvents> {
  readonly messageTtl: number
  readonly serverUrl: string
  ping(): Promise<IRpcResponse>
  send(request: IRpcRequest): Promise<IRpcResponse>
}

export interface IRpcConnectionOpts {
  allowCors?: boolean
  messageTtl?: number
  serverUrl: string
}

export class BaseRpcConnection {}

export class RpcConnection
  extends EventEmitterMixin<IRpcConnectionEvents, EventEmitterConstructor<BaseRpcConnection>>(
    BaseRpcConnection
  )
  implements IRpcConnection {
  readonly allowCors: boolean
  readonly messageTtl: number
  readonly serverUrl: string

  constructor(p: IRpcConnectionOpts) {
    super()
    this.allowCors = p.allowCors || true
    this.messageTtl = p.messageTtl || 0
    this.serverUrl = p.serverUrl
  }

  async ping() {
    return await this.send(new RpcRequest({ id: 'auto', method: 'ping' }))
  }

  async send(_: IRpcRequest): Promise<IRpcResponse> {
    throw new Error('Not implemented')
  }
}

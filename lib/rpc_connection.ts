import { IRpcResponse, IRpcRequest } from '@aperos/rpc-common'
import {
  EventEmitterMixin,
  IBaseEvents,
  ITypedEventEmitter
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

export interface IRpcConnection
  extends ITypedEventEmitter<IRpcConnectionEvents> {
  readonly messageTtl: number
  readonly serverUrl: string
  send(request: IRpcRequest): Promise<IRpcResponse>
}

export interface IRpcConnectionOpts {
  allowCors?: boolean
  messageTtl?: number
  serverUrl: string
}

export class BaseRpcConnection {}

export class RpcConnection
  extends EventEmitterMixin<IRpcConnectionEvents>(BaseRpcConnection)
  implements IRpcConnection {
  readonly allowCors: boolean
  readonly messageTtl: number
  readonly serverUrl: string

  constructor (p: IRpcConnectionOpts) {
    super()
    this.allowCors = p.allowCors || false
    this.messageTtl = p.messageTtl || 0
    this.serverUrl = p.serverUrl
  }

  send (_: IRpcRequest): Promise<IRpcResponse> {
    throw new Error('Not implemented')
  }
}

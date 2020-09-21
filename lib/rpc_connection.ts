import { Constructor } from '@aperos/ts-goodies'
import { IRpcResponse, IRpcRequest, RpcRequest } from '@aperos/rpc-common'
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
  ping(): Promise<IRpcResponse>
  send(request: IRpcRequest): Promise<IRpcResponse>
}

export interface IRpcConnectionArgs {
  allowCors?: boolean
  messageTtl?: number
  serverUrl: string
}

export class BaseRpcConnection {}

export class RpcConnection
  extends EventEmitterMixin<
    IRpcConnectionEvents,
    Constructor<BaseRpcConnection>
  >(BaseRpcConnection)
  implements IRpcConnection {
  readonly allowCors: boolean
  readonly messageTtl: number
  readonly serverUrl: string

  constructor(args: IRpcConnectionArgs) {
    super()
    this.allowCors = args.allowCors || true
    this.messageTtl = args.messageTtl || 0
    this.serverUrl = args.serverUrl
  }

  async ping() {
    return await this.send(new RpcRequest({ id: 'auto', method: 'ping' }))
  }

  async send(_: IRpcRequest): Promise<IRpcResponse> {
    throw new Error('Not implemented')
  }
}

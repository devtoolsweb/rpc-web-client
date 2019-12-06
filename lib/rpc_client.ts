import {
  EventEmitterMixin,
  IBaseEvents,
  ITypedEventEmitter
} from '@aperos/event-emitter'
import {
  IRpcMessage,
  IRpcResult,
  RpcResult,
  ISocketMessage
} from '@aperos/rpc-common'
import { ISocketMessageSendParams, SocketConnection } from './socket_connection'

export interface IRpcMessageSendParams extends ISocketMessageSendParams {
  readonly message: IRpcMessage
}

export interface IRpcClientParams {
  readonly messageTtl?: number
  readonly serverUrl: string
}

export interface IRpcClientEvents extends IBaseEvents {
  readonly open: (client: IRpcClient) => void
  readonly message: (client: IRpcClient, message: ISocketMessage) => void
  readonly result: (client: IRpcClient, result: IRpcResult) => void
  readonly timeout: (client: IRpcClient, result: IRpcResult) => void
}

export interface IRpcClient extends ITypedEventEmitter<IRpcClientEvents> {
  readonly messageTtl: number
  send(p: IRpcMessageSendParams): Promise<object>
}

export class BaseRpcClient {}

export class RpcClient
  extends EventEmitterMixin<IRpcClientEvents>(BaseRpcClient)
  implements IRpcClient {
  readonly messageTtl: number

  private readonly connection: SocketConnection

  constructor (p: IRpcClientParams) {
    super()
    this.connection = new SocketConnection({ serverUrl: p.serverUrl })
    this.connection.on('open', () => this.emit('open', this))
    this.connection.on('timeout', (_conn, m: ISocketMessage) =>
      this.emit(
        'timeout',
        this,
        new RpcResult({
          comment: 'RPC message timeout',
          id: m.id,
          status: 'timeout'
        })
      )
    )
    this.messageTtl = p.messageTtl || -1
  }

  send (p: IRpcMessageSendParams): Promise<object> {
    this.emit('message', this, p.message)
    return this.connection.send(p)
  }
}

import { TestClass } from './test_class'
import { RpcHttpConnection, RpcWsConnection, IRpcConnection } from '../../lib'
const useWebSockets = true
const host = 'bb'

const logMessage = (message: string) => {
  const el = document.createElement('div')
  el.textContent = message
  document.getElementById('messages')!.appendChild(el)
}

window.addEventListener('load', async () => {
  if (useWebSockets) {
    logMessage('Using web sockets')
  }
  const connection: IRpcConnection = useWebSockets
    ? new RpcWsConnection({
        serverUrl: `ws://${host}:3001`
      })
    : new RpcHttpConnection({
        allowCors: true,
        serverUrl: `http://${host}:3002`
      })
  connection.on('error', event => {
    logMessage(`Connection error: ${event.comment}`)
  })
  connection.on('request', event => {
    logMessage(`Client sent a request: ${JSON.stringify(event.request)}`)
  })

  // console.log(connection)
  const tc = new TestClass({
    connection,
    domain: 'TestDomain',
    throwError: true
  })
  await testMethods(tc)
  setInterval(async () => {}, 2000)
})

const testMethods = async (tc: TestClass) => {
  try {
    const sum = await tc.calcSum({ a: Math.random(), b: Math.random() })
    logMessage(`calcSum(): ${sum}`)
    const hello = await tc.testMethod({ hello: 'hello' })
    logMessage(`testMethod(): ${hello}`)
    const n = await tc.getErrorResult()
    logMessage(`getErrorResult(): ${n}`)
  } catch (e) {
    logMessage(`Error: ${e.message}`)
  }

  try {
    await tc.methodWithException()
  } catch (e) {
    logMessage(`Error: ${e.message}`)
  }
}

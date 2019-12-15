import { TestClass } from './test_class'
import { SocketConnection } from '../../lib'

window.addEventListener('load', async () => {
  const connection = new SocketConnection({
    serverUrl: 'ws://localhost:3000'
  })
  connection.on('request', (_, r) => {
    console.log('Client sent a request:', r)
  })

  console.log(connection)
  const tc = new TestClass({ connection, domain: 'TestDomain' })

  setInterval(async () => {
    try {
      const result = await tc.testMethod({ hello: 'hello' })
      console.log(result)
    } catch (e) {
      console.log('Error:', e)
    }
  }, 2000)
})

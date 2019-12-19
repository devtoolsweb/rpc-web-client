import { TestClass } from './test_class'
// import { RpcWsConnection } from '../../lib'
import { RpcHttpConnection } from '../../lib'

window.addEventListener('load', async () => {
  // const connection = new RpcWsConnection({
  //   serverUrl: 'ws://localhost:3001'
  // })
  const connection = new RpcHttpConnection({
    allowCors: true,
    serverUrl: 'http://localhost:3002'
  })
  connection.on('error', event => {
    console.log('Connection error:', event.comment)
  })
  connection.on('request', event => {
    console.log('Client sent a request:', event.request)
  })

  console.log(connection)
  const tc = new TestClass({ connection, domain: 'TestDomain' })
  testMethods(tc)
  setInterval(async () => {}, 2000)
})

const testMethods = async (tc: TestClass) => {
  try {
    const sum = await tc.calcSum({ a: Math.random(), b: Math.random() })
    console.log('calcSum()', sum)
    const hello = await tc.testMethod({ hello: 'hello' })
    console.log('testMethod()', hello)
  } catch (e) {
    console.log('Error:', e)
  }
}

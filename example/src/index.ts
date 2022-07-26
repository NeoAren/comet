import { comet, Method, useCors, useRoute } from '../../src'


useCors({
  pathname: '/api',
  origins: [ 'http://localhost:3000', 'http://localhost:4000' ]
})

useRoute<{ foo: string }, { bar: string }>({
  method: Method.ALL,
  pathname: '/test',
  before: [
    event => {
      console.log('Before 1')
      return event.next()
    },
    event => {
      console.log('Before 2')
      event.reply.headers.set('x-powered-by', 'Comet')
      return event.next()
    }
  ],
  after: [
    event => {
      console.log('After 1', event.reply.body)
      return event.next()
    }
  ]
}, event => {
  console.log('Handler', event.cookies.get('foo'), event.params)
  event.reply.cookies.set('foo', 'bar', { httpOnly: true })
  return event.reply.ok({ success: true })
})

export default {
  fetch: comet({
    cookies: {
      limit: 32
    },
    cors: {
      origins: 'http://localhost:3000',
      methods: '*',
      headers: '*'
    },
    prefix: '/api'
  })
}

import { Body, Env, Params, Query, Method, Configuration } from './types'
import { Reply } from './reply'
import { Cookies } from './cookies'


export type EventInit = { [Property in Exclude<keyof Event, 'reply' | 'next'>]: Event[Property] }

export class Event<TEnv = Env, TBody = Body> {

  public readonly method: Method
  public readonly pathname: string
  public headers: Headers
  public cookies: Cookies
  public query: Query
  public params: Params
  public body: TBody

  public readonly request: Request
  public readonly env: TEnv
  public readonly ctx: ExecutionContext
  public readonly state?: DurableObjectState

  public readonly reply: Reply

  private constructor(init: EventInit) {
    this.method = init.method
    this.pathname = init.pathname
    this.headers = init.headers
    this.cookies = init.cookies
    this.query = init.query
    this.params = init.params
    this.body = init.body
    this.request = init.request
    this.env = init.env
    this.ctx = init.ctx
    this.state = init.state
    this.reply = new Reply()
  }

  public next(): Event {
    return this
  }

  public static async fromRequest(
    config: Configuration,
    request: Request,
    env: unknown,
    ctx: ExecutionContext,
    state?: DurableObjectState
  ): Promise<Event> {
    const url = new URL(request.url)
    const event = new Event({
      body: {},
      cookies: await Cookies.parse(request.headers, config),
      ctx,
      env,
      headers: request.headers,
      method: request.method as Method,
      params: {},
      pathname: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      request,
      state
    })
    if (event.method !== Method.GET) {
      switch (event.headers.get('content-type')?.split(';')[0]) {
        case 'application/json': {
          event.body = await request.json()
          break
        }
        case 'multipart/form-data': {
          const formData = await request.formData()
          event.body = Object.fromEntries(formData.entries())
          break
        }
        case 'application/x-www-form-urlencoded': {
          const text = await request.text()
          const entries = text.split('&').map(x => x.split('=').map(decodeURIComponent))
          event.body = Object.fromEntries(entries)
          break
        }
      }
    }
    return event
  }

  public static async toResponse(event: Event, config: Configuration): Promise<Response> {
    if (!event.reply.sent) {
      console.error('[Comet] No reply was sent for this event.')
      return new Response(null, { status: 500 })
    }
    const status = event.reply.status
    const headers = event.reply.headers
    await Cookies.serialize(event.reply.cookies, event.reply.headers, config)
    // Handle websocket response
    if (event.reply.body instanceof WebSocket) {
      return new Response(null, { status, headers, webSocket: event.reply.body })
    }
    // Handle stream response
    if (event.reply.body instanceof ReadableStream) {
      return new Response(event.reply.body, { status, headers })
    }
    // Handle json response
    let body: string | null = null
    if (event.reply.body) {
      headers.set('content-type', 'application/json')
      body = JSON.stringify(event.reply.body)
    }
    return new Response(body, { status, headers })
  }

}

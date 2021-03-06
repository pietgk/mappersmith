import MethodDescriptor from 'src/method-descriptor'
import Request from 'src/request'
import TimeoutMiddleware from 'src/middlewares/timeout'

describe('Middleware / Timeout', () => {
  let methodDescriptor, request, middleware

  beforeEach(() => {
    methodDescriptor = new MethodDescriptor({ method: 'get' })
    request = new Request(methodDescriptor)
    middleware = TimeoutMiddleware(100)()
  })

  it('exposes name', () => {
    expect(TimeoutMiddleware(100).name).toEqual('TimeoutMiddleware')
  })

  it('configures the timeout', async () => {
    const newRequest = await middleware.prepareRequest(() => Promise.resolve(request))
    expect(newRequest.timeout()).toEqual(100)
  })

  describe('when the timeout property is explicitly defined', () => {
    it('keeps the original timeout value', async () => {
      request = new Request(methodDescriptor, { timeout: 500 })
      const newRequest = await middleware.prepareRequest(() => Promise.resolve(request))
      expect(newRequest.timeout()).toEqual(500)
    })
  })
})

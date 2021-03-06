import Router from '../../../src/index'

describe('router.onReady', () => {
  it('should work', done => {
    const calls = []

    const router = new Router({
      mode: 'abstract',
      routes: [
        {
          path: '/a',
          component: {
            name: 'A',
            beforeRouteEnter: (to, from, next) => {
              setTimeout(() => {
                calls.push(2)
                next()
              }, 1)
            }
          }
        }
      ]
    })

    router.beforeEach((to, from, next) => {
      setTimeout(() => {
        calls.push(1)
        next()
      }, 1)
    })

    router.onReady(() => {
      expect(calls).toEqual([1, 2])
      // sync call when already ready
      router.onReady(() => {
        calls.push(3)
      })
      expect(calls).toEqual([1, 2, 3])
      done()
    })

    router.push('/a')
    expect(calls).toEqual([])
  })
})

describe('router.addRoutes', () => {
  it('should work', () => {
    const router = new Router({
      mode: 'abstract',
      routes: [
        { path: '/a', component: { name: 'A' }},
        {
          path: '/a1',
          name: 'A1ComponentName',
          component: { name: 'A1' },
          children: [
            {
              path: '/b1',
              component: { name: 'B1' },
              name: 'B1ComponentName'
            }
          ]
        }
      ]
    })

    router.push('/a')
    let components = router.getMatchedComponents()
    expect(components.length).toBe(1)
    expect(components[0].name).toBe('A')

    router.push('/b')
    components = router.getMatchedComponents()
    expect(components.length).toBe(0)

    router.addRoutes([
      { path: '/b', component: { name: 'B' }}
    ])
    components = router.getMatchedComponents()
    expect(components.length).toBe(1)
    expect(components[0].name).toBe('B')

    // make sure it preserves previous routes
    router.push('/a')
    components = router.getMatchedComponents()
    expect(components.length).toBe(1)
    expect(components[0].name).toBe('A')

    // nested routes existing children relation

    router.push('/b1')
    components = router.getMatchedComponents()
    expect(components.length).toBe(2)
    expect(components[0].name).toBe('A1')
    expect(components[1].name).toBe('B1')

    router.addRoutes([
      { path: '/c1', component: { name: 'C1' }, parent: '/b1' }
    ])

    // nested routes dynamic children relation

    router.push('/c1')
    components = router.getMatchedComponents()
    expect(components.length).toBe(3)
    expect(components[0].name).toBe('A1')
    expect(components[1].name).toBe('B1')
    expect(components[2].name).toBe('C1')

    router.push('/c')
    components = router.getMatchedComponents()
    expect(components.length).toBe(0)

    router.addRoutes([
      { path: '/c', component: { name: 'C' }, parent: '/b' }
    ])
    components = router.getMatchedComponents()
    expect(components.length).toBe(2)
    expect(components[0].name).toBe('B')
    expect(components[1].name).toBe('C')

    // nested routes asociate to parent name route
    router.push('/d')
    components = router.getMatchedComponents()
    expect(components.length).toBe(0)

    router.addRoutes([
      { path: '/d', component: { name: 'D' }, parent: 'A1ComponentName' }
    ])
    components = router.getMatchedComponents()
    expect(components.length).toBe(2)
    expect(components[0].name).toBe('A1')
    expect(components[1].name).toBe('D')

  })
})

describe('router.push/replace callbacks', () => {
  let calls = []
  let router, spy1, spy2

  const Foo = {
    beforeRouteEnter (to, from, next) {
      calls.push(3)
      setTimeout(() => {
        calls.push(4)
        next()
      }, 1)
    }
  }

  beforeEach(() => {
    calls = []
    spy1 = jasmine.createSpy('complete')
    spy2 = jasmine.createSpy('abort')

    router = new Router({
      routes: [
        { path: '/foo', component: Foo }
      ]
    })

    router.beforeEach((to, from, next) => {
      calls.push(1)
      setTimeout(() => {
        calls.push(2)
        next()
      }, 1)
    })
  })

  it('push complete', done => {
    router.push('/foo', () => {
      expect(calls).toEqual([1, 2, 3, 4])
      done()
    })
  })

  it('push abort', done => {
    router.push('/foo', spy1, spy2)
    router.push('/bar', () => {
      expect(calls).toEqual([1, 1, 2, 2])
      expect(spy1).not.toHaveBeenCalled()
      expect(spy2).toHaveBeenCalled()
      done()
    })
  })

  it('replace complete', done => {
    router.replace('/foo', () => {
      expect(calls).toEqual([1, 2, 3, 4])
      done()
    })
  })

  it('replace abort', done => {
    router.replace('/foo', spy1, spy2)
    router.replace('/bar', () => {
      expect(calls).toEqual([1, 1, 2, 2])
      expect(spy1).not.toHaveBeenCalled()
      expect(spy2).toHaveBeenCalled()
      done()
    })
  })
})

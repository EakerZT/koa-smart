import expect from 'expect';
import supertest from 'supertest';
import { Stores } from 'koa2-ratelimit';

import RDec from '../../routes/RouteDecorators';
import createserver from '../_createserver';
import { wait } from '../../utils/utils';

describe('RouteDecorator', () => {
  let request;
  let _server;

  before(async () => {
    _server = await createserver(); // createserver will return = app.listen()
    request = supertest.agent(_server);
  });
  after(async () => {
    _server.close();
  });

  describe('disabled', () => {
    it('should disabled all route when disable = true on Class Decorator', async () => {
      let res = await request.get('/disable/disabled/');
      expect(res.statusCode).toBe(404);
      res = await request.get('/disable/disabled/try-disable');
      expect(res.statusCode).toBe(404);
    });
    it('should enabled a class when pass disable = false on super call', async () => {
      const { statusCode } = await request.get('/disable/un-disabled');
      expect(statusCode).toBe(200);
    });
    it('should disabled a single route', async () => {
      const { statusCode } = await request.get('/disable/enabled/disabled');
      expect(statusCode).toBe(404);
    });
    it('should disable a class when pass disable = false on super call but disable it on a route', async () => {
      const { statusCode } = await request.get('/disable/un-disabled/disabled');
      expect(statusCode).toBe(404);
    });
    it('should enable a route class when pass disable = true on Class Decorator', async () => {
      const { statusCode } = await request.get('/disable/enabled');
      expect(statusCode).toBe(200);
      const res = await request.get('/disable/enabled/enabled2');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Path', () => {
    describe('_getRouteFromMethode', () => {
      it('should get the correct name of the path', async () => {
        expect(RDec._getRouteFromMethode('MyPath')).toBe('my-path');
        expect(RDec._getRouteFromMethode('myPath')).toBe('my-path');
        expect(RDec._getRouteFromMethode('my-path')).toBe('my-path');
        expect(RDec._getRouteFromMethode('MyPatH')).toBe('my-pat-h');
        expect(RDec._getRouteFromMethode('my-pathMyPathMy2')).toBe('my-path-my-path-my2');
      });
    });
    describe('routeBase', () => {
      it('should replace the base route when routeBase is set on decorator class', async () => {
        let res = await request.get('/path/path');
        expect(res.statusCode).toBe(200);
      });
      it('should tranforme function name to path', async () => {
        let res = await request.get('/path/path/my-path');
        expect(res.statusCode).toBe(200);
        res = await request.get('/path/path/mypath');
        expect(res.statusCode).toBe(200);
      });
      it('should tranforme class name to path and put it to routeBase', async () => {
        let res = await request.get('/path/base-path');
        expect(res.statusCode).toBe(200);
        res = await request.get('/path/base-path/my-path');
        expect(res.statusCode).toBe(200);
      });
      it('should custom a route path with path route decorator', async () => {
        let res = await request.get('/path/path/path-change');
        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('params', () => {
    it('should keep only elem in params decorator', async () => {
      const bodySend = {
        email: 'clientnew@new.com',
        password: 'password',
        notPermited: 'notPermited',
      };
      const { body, statusCode } = await request.post('/params').send(bodySend);

      expect(statusCode).toBeLessThan(400);
      expect(body.data.original).toEqual(bodySend);
      expect(body.data.checked).toEqual({
        email: 'clientnew@new.com',
        password: 'password',
      });
      expect(body.data.checked.notPermited).toBe(undefined);
    });
    it('should return 400 if required params are not send', async () => {
      const respKO = await request.post('/params').send({ password: 'password' });
      expect(respKO.statusCode).toBe(400);

      const respOK = await request.post('/params').send({ email: 'email' });
      expect(respOK.statusCode).toBeLessThan(400);
    });
  });

  describe('ratelimit', () => {
    beforeEach(async () => {
      Stores.Memory.cleanAll();      
    });

    it('should stop user when too much request are made', async () => {
      let res = await request.get('/rate-limit/min1max2');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/min1max2');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/min1max2');
      expect(res.statusCode).toBe(429);
    });

    it('should stop user only on a specific route', async () => {
      let res = await request.get('/rate-limit/min1max2');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/min1max2');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/min1max2');
      expect(res.statusCode).toBe(429);

      res = await request.get('/rate-limit/sec2max2');
      expect(res.statusCode).toBeLessThan(400);
    });

    it('should stop user when too much request are made et let him when time is past', async () => {
      let res = await request.get('/rate-limit/sec2max2');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/sec2max2');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/sec2max2');
      expect(res.statusCode).toBe(429);

      await wait(2000);
      res = await request.get('/rate-limit/sec2max2');
      expect(res.statusCode).toBeLessThan(400);
    });

    it('should allow multiple ratelimit', async () => {
      let res = await request.get('/rate-limit/min1max2-sec1max5');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/min1max2-sec1max5');
      expect(res.statusCode).toBeLessThan(400);
      res = await request.get('/rate-limit/min1max2-sec1max5');
      expect(res.statusCode).toBe(429);
    });
  });
});

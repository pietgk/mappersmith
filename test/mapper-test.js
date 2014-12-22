var expect = chai.expect;
var Mapper = Mappersmith.Mapper;

describe('Mapper', function() {
  var mapper,
      manifest,
      test,
      gateway;

  beforeEach(function() {
    manifest = {
      host: 'http://full-url',
      resources: {
        Book: {
          all:  {path: '/v1/books.json'},
          byId: {path: '/v1/books/{id}.json'},
          archived: '/v1/books/archived.json'
        },
        Photo: {
          byCategory: {path: '/v1/photos/{category}/all.json'},
          add: {method: 'post', path: '/v1/photos/create.json'}
        }
      }
    }

    test = {};
    test.gateway = function() {};
    test.gateway.prototype.get = function() {return this};
    test.gateway.prototype.success = function() {return this};
    test.gateway.prototype.call = function() {return this};

    sinon.spy(test, 'gateway');
    sinon.spy(test.gateway.prototype, 'get');
    sinon.spy(test.gateway.prototype, 'success');
    sinon.spy(test.gateway.prototype, 'call');

    gateway = test.gateway;
    mapper = new Mapper(manifest, gateway);
  });

  afterEach(function() {
    test.gateway.restore();
    test.gateway.prototype.get.restore();
    test.gateway.prototype.success.restore();
    test.gateway.prototype.call.restore();
  });

  describe('contructor', function() {
    it('holds a reference to manifest', function() {
      expect(mapper).to.have.property('manifest', manifest);
    });

    it('holds a reference to gateway', function() {
      expect(mapper).to.have.property('Gateway', gateway);
    });

    it('holds a reference to host', function() {
      expect(mapper).to.have.property('host', manifest.host);
    });
  });

  describe('#newGatewayRequest', function() {
    var method,
        fullUrl,
        path,
        params,
        callback;

    beforeEach(function() {
      method = 'get';
      fullUrl = 'http://full-url/path';
      path = 'path';
      params = {a: true};
      callback = function() {};
    });

    it('returns a function', function() {
      var output = typeof mapper.newGatewayRequest(method, path);
      expect(output).to.equals('function');
    });

    it('returns a configured gateway', function() {
      var request = mapper.newGatewayRequest(method, path);

      expect(request(params, callback)).to.be.an.instanceof(gateway);
      expect(gateway.prototype.success).to.have.been.calledWith(callback);
      expect(gateway.prototype.call).to.have.been.called;
      expect(gateway).to.have.been.calledWith(fullUrl + '?a=true', method);
    });

    describe('without params', function() {
      it('considers callback as the first argument', function() {
        var request = mapper.newGatewayRequest(method, path);

        expect(request(callback)).to.be.an.instanceof(gateway);
        expect(gateway.prototype.success).to.have.been.calledWith(callback);
        expect(gateway.prototype.call).to.have.been.called;
        expect(gateway).to.have.been.calledWith(fullUrl, method);
      });

      describe('with opts for gateway', function() {
        it('considers opts as the second argument', function() {
          var request = mapper.newGatewayRequest(method, path);
          var opts = {jsonp: true};

          expect(request(callback, opts)).to.be.an.instanceof(gateway);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
          expect(gateway.prototype.call).to.have.been.called;
          expect(gateway).to.have.been.calledWith(fullUrl, method, opts);
        });
      });
    });
  });

  describe('#urlFor', function() {
    describe('without params and query string', function() {
      describe('host and path with "/"', function() {
        it('returns host and path', function() {
          mapper.host = mapper.host + '/';
          expect(mapper.urlFor('/path')).to.equals('http://full-url/path');
        });
      });

      describe('host and path without "/"', function() {
        it('returns host and path', function() {
          expect(mapper.urlFor('path')).to.equals('http://full-url/path');
        });
      });

      describe('host with "/" and path without', function() {
        it('returns host and path', function() {
          mapper.host = mapper.host + '/';
          expect(mapper.urlFor('path')).to.equals('http://full-url/path');
        });
      });

      describe('host without "/" and path with', function() {
        it('returns host and path', function() {
          expect(mapper.urlFor('/path')).to.equals('http://full-url/path');
        });
      });
    });

    describe('with params in the path', function() {
      it('replaces params and returns host and path', function() {
        expect(mapper.urlFor('{a}/{b}', {a: 1, b: 2})).to.equals('http://full-url/1/2');
      });
    });

    describe('with query string in the path', function() {
      it('includes query string and returns host and path', function() {
        expect(mapper.urlFor('path', {a: 1, b: 2})).to.equals('http://full-url/path?a=1&b=2');
      });
    });

    describe('with query string and params in the path', function() {
      it('includes query string, replaces params and returns host and path', function() {
        expect(mapper.urlFor('{a}', {a: 1, b: 2})).to.equals('http://full-url/1?b=2');
      });
    });
  });

  describe('#build', function() {
    var result;

    beforeEach(function() {
      result = mapper.build();
    });

    it('returns an object', function() {
      expect(result).to.be.a('object');
    });

    it('creates the namespaces', function() {
      expect(result.Book).to.be.a('object');
      expect(result.Photo).to.be.a('object');
    });

    it('creates configured methods for each namespace', function() {
      expect(result.Book.all).to.be.a('function');
      expect(result.Book.byId).to.be.a('function');
      expect(result.Book.archived).to.be.a('function');
      expect(result.Photo.byCategory).to.be.a('function');
    });

    describe('when calling the created methods', function() {
      var callback, method;

      beforeEach(function() {
        callback = function() {};
        method = 'get';
      });

      describe('without params', function() {
        it('calls the gateway with the configured values', function() {
          var path = manifest.resources.Book.all.path;
          var url = mapper.urlFor(path);

          result.Book.all(callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });
      });

      describe('with query string', function() {
        it('calls the gateway with the configured values', function() {
          var path = manifest.resources.Book.all.path;
          var url = mapper.urlFor(path, {b: 2});

          result.Book.all({b: 2}, callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });
      });

      describe('with params', function() {
        it('calls the gateway with the configured values', function() {
          var path = manifest.resources.Book.byId.path;
          var url = mapper.urlFor(path, {id: 3});

          result.Book.byId({id: 3}, callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });
      });

      describe('with params and query string', function() {
        it('calls the gateway with the configured values', function() {
          var path = manifest.resources.Book.byId.path;
          var url = mapper.urlFor(path, {id: 3, d: 4});

          result.Book.byId({id: 3, d: 4}, callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });
      });

      describe('with non-default method', function() {
        it('calls the gateway with the configured values', function() {
          var path = manifest.resources.Photo.add.path;
          var url = mapper.urlFor(path);
          method = 'post';

          result.Photo.add(callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });
      });

      describe('with syntatic sugar for GET methods with no parameters', function() {
        it('calls the gateway with method GET', function() {
          var path = manifest.resources.Book.archived;
          var url = mapper.urlFor(path);
          console.log(url);

          result.Book.archived(callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });

        it('calls the gateway with query string', function() {
          var path = manifest.resources.Book.archived;
          var url = mapper.urlFor(path, {author: 'Daniel'});

          result.Book.archived({author: 'Daniel'}, callback);
          expect(gateway).to.have.been.calledWith(url, method);
          expect(gateway.prototype.success).to.have.been.calledWith(callback);
        });
      });
    });
  });
});

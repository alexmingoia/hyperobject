/*!
 * hyperobject
 * https://github.com/alexmingoia/hyperobject
 */

'use strict';

var expect = require('chai').expect;
var HyperObject = process.env.JSCOV ? require('../lib-cov/hyperobject') : require('../lib/hyperobject');

var node = {
  "@context": {
    "name": "http://xmlns.com/foaf/0.1/name",
    "homepage": {
      "@id": "http://xmlns.com/foaf/0.1/homepage",
      "@type": "@id"
    },
    "Person": "http://xmlns.com/foaf/0.1/Person"
  },
  "@id": "http://me.alexmingoia.com",
  "@type": "Person",
  "name": "Alex Mingoia",
  "homepage": "http://www.alexmingoia.com"
}

describe('hyperobject module', function() {
  it('exports HyperObject', function() {
    expect(HyperObject).to.be.a('function');
    expect(HyperObject).to.have.property('name', 'HyperObject');
  });
});

describe('HyperObject()', function() {
  it('creates new hyperobjects', function() {
    var object = HyperObject(node);
    expect(object).to.be.an('object');
    expect(object).to.be.an.instanceOf(HyperObject);
  });

  it('creates getters and setters for node terms', function() {
    var object = HyperObject(node);

    expect(object).to.have.property('name', 'Alex Mingoia');
    expect(object).to.have.property('homepage', 'http://www.alexmingoia.com');
  });

  it('cannot contain @value, @list, or @set keywords', function() {
    expect(function() {
      var object = HyperObject({ "@value": true });
    }).to.throw("JSON-LD node objects cannot contain @value, @list, or @set keywords.");
  });

  it('requires node object argument', function() {
    expect(function() {
      var object = HyperObject();
    }).to.throw("HyperObject requires `node` object argument.");
  });

  it('requires @id', function() {
    expect(function() {
      var object = HyperObject({});
    }).to.throw("HyperObject requires @id.");
  });
});

describe('HyperObject#term', function() {
  it('sets another HyperObject', function() {
    var nested = HyperObject(node);
    var object = HyperObject({
      '@id': 'other://object'
    });

    object.set('nested', nested);

    expect(object).to.have.property('nested', nested);
  });

  it('sets nested value', function() {
    var nested = HyperObject(node);
    var object = HyperObject({
      '@id': 'other://object'
    });

    object.set('nested1', nested);
    object.set('nested1.nested2', nested);

    expect(object).to.have.property('nested1', nested);
    expect(object.nested1).to.have.property('nested2', nested);
  });

  it('sets value object', function() {
    var object = HyperObject({
      "@context": {
        "name": {
          "@type": "foaf:name"
        }
      },
      '@id': 'other://object',
      "name": "Alex Miller",
      'title': {
        '@type': 'foaf:title',
        '@value': 'Supervisor'
      }
    });

    expect(object).to.have.property('title', 'Supervisor');

    object.title = "President";
    expect(object).to.have.property('title', 'President');
  });

  it('sets node object', function() {
    var object = HyperObject({
      "website": {
        "@id": "example.com"
      },
      '@id': 'some://object'
    });
    expect(object).to.have.property('website');
    expect(object.website).to.have.property('id', 'example.com');

    object.website = "example.org";
    expect(object).to.have.property('website');
    expect(object.website).to.have.property('id', 'example.org');
  });

  it('sets literal value', function() {
    var object = HyperObject({
      "@context": {
        "number": {
          "@id": "http://schema.org/Number"
        },
      },
      '@id': 'some://object',
      "number": 1
    });

    expect(object).to.have.property('number', 1);
    expect(object.get('number')).to.equal(1);
  });
});

describe('HyperObject#get', function() {
  it('returns value at given path', function() {
    var object = HyperObject(node);

    expect(object.get('name')).to.equal('Alex Mingoia');
  });

  it('returns value at nested path', function() {
    var object = HyperObject({
      '@id': 'http://schema.org/Book',
      'author': {
        '@context': {
          'person': 'http://schema.org/Person'
        },
        '@id': 'http://me.alexmingoia.com',
        'person:name': 'Alex Mingoia',
        'avatar': {
          '@id': 'http://example.org/avatar.png'
        }
      }
    });

    var author = object.get('author');
    expect(author).to.be.an('object');
    expect(author).to.have.property('name', 'Alex Mingoia');
    expect(author).to.have.property('avatar');
    expect(author.avatar).to.have.property('id', 'http://example.org/avatar.png');
  });
});

describe('HyperObject#define', function() {
  it("locates compact IRI's in @context", function() {
    expect(function() {
      var object = HyperObject({
        '@id': 'http://example.com/book',
        'book:author': 'http://example.com/author'
      });
    }).to.throw("Failed to locate compact IRI prefix in @context.");

    expect(function() {
      var object = HyperObject({
        '@context': {},
        '@id': 'http://example.com/book',
        'book:author': 'http://example.com/author'
      });
    }).to.throw("Failed to locate compact IRI prefix in @context.");
  });
});

describe('HyperObject#toJSON()', function() {
  it('returns JSON-LD serialization', function() {
    var object = HyperObject(node);

    expect(object).to.have.property('toJSON');
    expect(object.toJSON).to.be.a('function');

    var jsonld = object.toJSON();

    expect(jsonld).to.be.an('object');
    expect(jsonld).to.have.keys([
      '@context',
      '@id',
      '@type',
      'name',
      'homepage'
    ]);
  });

  it('returns JSON-LD serialization of nested HyperObjects', function() {
    var object = HyperObject(node);
    var nested = HyperObject({
      '@id': 'nested://object',
      'fullname': 'Jason Miller'
    });

    object.set('supervisor', nested);

    var jsonld = JSON.stringify(object);

    expect(jsonld).to.be.an('string');
    expect(jsonld).to.equal('{"@context":{"name":"http://xmlns.com/foaf/0.1/name","homepage":{"@id":"http://xmlns.com/foaf/0.1/homepage","@type":"@id"},"Person":"http://xmlns.com/foaf/0.1/Person"},"@id":"http://me.alexmingoia.com","@type":"Person","name":"Alex Mingoia","homepage":"http://www.alexmingoia.com","supervisor":{"@id":"nested://object","fullname":"Jason Miller"}}');
  });
});

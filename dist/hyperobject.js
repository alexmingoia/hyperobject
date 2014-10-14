!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.hyperobject=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * hyperobject
 * https://github.com/alexmingoia/hyperobject
 */

'use strict';

/**
 * This [JSON-LD](http://json-ld.org/):
 *
 * ```jsonld
 * {
 *   "@context": {
 *     "prop": "http://dbpedia.org/property/",
 *     "ontology": "http://dbpedia.org/ontology/"
 *   },
 *   "@id": "http://dbpedia.org/resource/Spike_Siegal",
 *   "@type": "ontology:ComicsCharacter",
 *   "prop:name": "Spike Spiegal",
 *   "prop:series": "Cowboy Bebop"
 * }
 * ```
 *
 * Becomes this hyperobject:
 *
 * ```javascript
 * { id: [Getter/Setter],
 *   type: [Getter/Setter],
 *   name: [Getter/Setter],
 *   series: [Getter/Setter] }
 * ```
 *
 * Hyperobjects can be nested:
 *
 * ```javascript
 * var post = new HyperObject({
 *   "@context": {
 *     "book": "http://schema.org/Book"
 *   }
 * });
 *
 * var user = new HyperObject({
 *   "@id": "http://dbpedia.org/resource/Niel_Stephensen"
 * });
 *
 * post.set('book:author', user);
 *
 * post.author.id === user.id; // => true
 * post.get('author.id') === user.get('id'); // => true
 * ```
 *
 * Hyperobjects can be used in functional style:
 *
 * ```javascript
 * var user = HyperObject(jsonld);
 *
 * user.set({
 *   firstName: "Spike"
 * });
 *
 * user.get('firstName');
 * ```
 *
 * Hyperobjects can be serialized back to JSON-LD:
 *
 * ```javascript
 * JSON.stringify(user);
 * ```
 *
 * @module hyperobject
 */

module.exports = HyperObject;

/**
 * Create a new `HyperObject` from given JSON-LD `node`.
 *
 * @alias module:hyperobject
 * @constructor
 * @param {Object} node triples encoded as JSON-LD node
 * @return {HyperObject}
 */

function HyperObject (node) {
  if (!(this instanceof HyperObject)) {
    return new HyperObject(node);
  }

  // Node objects cannot contain @value, @list, or @set keywords
  if (typeof node === 'object' && !(node instanceof Array)) {
    if (node['@value'] || node['@list'] || node['@set']) {
      throw new Error(
        "JSON-LD node objects cannot contain @value, @list, or @set keywords."
      );
    }
  } else {
    throw new Error("HyperObject requires `node` object argument.");
  }

  if (!node['@id']) {
    throw new Error("HyperObject requires @id.");
  }

  Object.defineProperties(this, {
    // Container for JSON-LD data.
    'jsonld': {
      value: node
    },
    // Value cache for fast and easy lookup.
    '@values': {
      value: {}
    }
  });

  // Create getters and setters for node terms (triple predicates).
  Object.keys(node).forEach(function(key) {
    if (key === '@id' || key === '@type' || key.charAt(0) !== '@') {
      var suffix = this.define(key, node[key]);
    }
  }, this);
}

/**
 * Get object value at given `path`.
 *
 * @param {String} path
 * @return {Mixed}
 */

HyperObject.prototype.get = function (path) {
  var keys = path.split('.');
  var cursor = this[keys[0]];

  if (keys.length > 1) {
    for (var i=1, l=keys.length; i<l; i++) {
      cursor = cursor[keys[i]];
    }
  }

  return cursor;
};

/**
 * Set object `value` at given `path`. If `path` is undefined it will be
 * set using {@link HyperObject#define}.
 *
 * @param {String} path
 * @param {Mixed} value HyperObject, node object, value object, or literal.
 * @return {Mixed}
 */

HyperObject.prototype.set = function (path, value) {
  var cursor = expand(path, this.jsonld);
  var jsonld = cursor.value;
  var context = cursor.parent['@context'] || {};

  switch (typeof value) {
    case 'number':
    case 'boolean':
    case 'string':
      if (jsonld) {
        // Node object.
        if (jsonld.id) {
          jsonld.id = value;
          value = jsonld;
        // Value object.
        } else if (jsonld['@value']) {
          jsonld['@value'] = value;
        }
      }
      break;
    // Node object.
    case 'object':
      if (!value['@value']) {
        if (value instanceof HyperObject) {
          jsonld = value;
        } else {
          value = jsonld = new HyperObject(value);
        }
      }
  }

  cursor.parent[cursor.key] = jsonld;

  // Cache value for fast and easy lookup.
  this['@values'][cursor.key] = value['@value'] || value;

  // Define new terms.
  if (typeof cursor.value === 'undefined') {
    this.define(path, value);
  }

  return value;
};

/**
 * Define Getter/Setter for JSON-LD node `term` and optional `value`.
 *
 * @param {String} term
 * @param {Mixed=} value
 * @return {String} returns term or term suffix
 */

HyperObject.prototype.define = function (term, value) {
  var prefix = ~term.indexOf(':') && term.split(':').shift();
  var suffix = term.split(':').pop().replace(/^@/, '');
  var context = this.jsonld['@context'];

  // Check if prefix exists in `@context`.
  if (prefix) {
    if (typeof context !== 'object' || !context[prefix]) {
      throw new Error("Failed to locate compact IRI prefix in @context.");
    }
  }

  Object.defineProperty(this, suffix, {
    enumerable: true,
    get: function () {
      return this['@values'][term];
    },
    set: function (value) {
      return this.set(term, value);
    }
  });

  this.set(term, value);

  return suffix;
};

/**
 * Return JSON-LD serialization.
 *
 * @return {Object} JSON-LD
 */

HyperObject.prototype.toJSON = function () {
  return this.jsonld;
};

/**
 * Expand given `path` and return `source`'s nested object value.
 *
 * Returns `undefined` if nested path cannot be resolved.
 *
 * @param {String} path
 * @param {Object} source
 * @return {Object(parent, key, value)}
 * @private
 */

function expand (path, source) {
  var keys = path.split('.');

  var cursor = {
    parent: source,
    key: keys[0],
    value: source[keys[0]]
  };

  if (keys.length > 1) {
    for (var i=1, l=keys.length; i<l; i++) {
      cursor.key = keys[i];
      cursor.parent = cursor.value;
      cursor.value = cursor.parent[keys[i]];
    }
  }

  return cursor;
}

},{}]},{},[1])(1)
});
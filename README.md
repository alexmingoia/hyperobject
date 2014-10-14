# hyperobject [![Build Status](http://img.shields.io/travis/alexmingoia/hyperobject.svg?style=flat)](http://travis-ci.org/alexmingoia/hyperobject) [![Code Coverage](http://img.shields.io/coveralls/alexmingoia/hyperobject.svg?style=flat)](https://coveralls.io/r/alexmingoia/hyperobject) [![NPM version](http://img.shields.io/npm/v/hyperobject.svg?style=flat)](https://www.npmjs.org/package/hyperobject) [![Dependency Status](http://img.shields.io/david/alexmingoia/hyperobject.svg?style=flat)](https://david-dm.org/alexmingoia/hyperobject)

> A simple object model for working with
> [Linked Data](https://en.wikipedia.org/wiki/Linked_data).

This [JSON-LD](http://json-ld.org/):

```jsonld
{
  "@context": {
    "prop": "http://dbpedia.org/property/",
    "ontology": "http://dbpedia.org/ontology/"
  },
  "@id": "http://dbpedia.org/resource/Spike_Siegal",
  "@type": "ontology:ComicsCharacter",
  "prop:name": "Spike Spiegal",
  "prop:series": "Cowboy Bebop"
}
```

Becomes this hyperobject:

```javascript
{ id: [Getter/Setter],
  type: [Getter/Setter],
  name: [Getter/Setter],
  series: [Getter/Setter] }
```

Hyperobjects can be nested:

```javascript
var post = new HyperObject({
  "@context": {
    "book": "http://schema.org/Book"
  }
});

var user = new HyperObject({
  "@id": "http://dbpedia.org/resource/Niel_Stephensen"
});

post.set('book:author', user);

post.author.id === user.id; // => true
post.get('author.id') === user.get('id'); // => true
```

Hyperobjects can be used in functional style:

```javascript
var user = HyperObject(jsonld);

user.set({
  firstName: "Spike"
});

user.get('firstName');
```

Hyperobjects can be serialized back to JSON-LD:

```javascript
JSON.stringify(user);
```



## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm install hyperobject
```
Install using [bower](http://bower.io/):

```sh
bower install hyperobject
```

Using browser script tag and global (UMD wrapper):

```html
// Available via window.hyperobject
<script src="dist/hyperobject.js"></script>
```

## API Reference
<a name="exp_module_hyperobject"></a>
##class: HyperObject ⏏
**Members**

* [class: HyperObject ⏏](#exp_module_hyperobject)
  * [new HyperObject(node)](#exp_new_module_hyperobject)
  * [hyperobject.get(path)](#module_hyperobject#get)
  * [hyperobject.set(path, value)](#module_hyperobject#set)
  * [hyperobject.define(term, [value])](#module_hyperobject#define)
  * [hyperobject.toJSON()](#module_hyperobject#toJSON)

<a name="exp_new_module_hyperobject"></a>
###new HyperObject(node)
Create a new `HyperObject` from given JSON-LD `node`.

**Params**

- node `Object` - triples encoded as JSON-LD node  

**Returns**: `HyperObject`  
<a name="module_hyperobject#get"></a>
###hyperobject.get(path)
Get object value at given `path`.

**Params**

- path `String`  

**Returns**: `Mixed`  
<a name="module_hyperobject#set"></a>
###hyperobject.set(path, value)
Set object `value` at given `path`. If `path` is undefined it will be
set using `HyperObject#define`.

**Params**

- path `String`  
- value `Mixed` - HyperObject, node object, value object, or literal.  

**Returns**: `Mixed`  
<a name="module_hyperobject#define"></a>
###hyperobject.define(term, [value])
Define Getter/Setter for JSON-LD node `term` and optional `value`.

**Params**

- term `String`  
- \[value\] `Mixed`  

**Returns**: `String` - returns term or term suffix  
<a name="module_hyperobject#toJSON"></a>
###hyperobject.toJSON()
Return JSON-LD serialization.

**Returns**: `Object` - JSON-LD  


## Contributing

Please submit all issues and pull requests to the [alexmingoia/hyperobject](http://github.com/alexmingoia/hyperobject) repository!

## Tests

Run tests using `npm test` or `gulp test`.

## Code coverage

Generate code coverage using `gulp coverage` and open `coverage.html` in your
web browser.

## Support

If you have any problem or suggestion please open an issue [here](https://github.com/alexmingoia/hyperobject/issues).

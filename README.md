Object Resolver
============

Object Resolver is a nodejs module for dealing with javascript Object/Array data types,
reaching into objects and generate a deep structure of the object with simple MongoDB-style query strings.

Installing
------------
    $ npm install object-resolver

Description
------------
Object Resolver class provides easy to use, chaining/callback API (getter, setter)
for operations with complex javascript types (arrays, objects) using simple string dot notation queries.
It used [MongoDB-style](http://www.mongodb.org/display/DOCS/Dot+Notation+%29Reaching+into+Objects%29) query syntax for reaching into objects and can create undefined properties
and deep structures on the fly.
ObjectResolver is designed as a nodejs module but can be also used in the client side javascript,
with only removing unnecessary "= module.exports" assignment in constructor.
Note: For async callbacks support please checkout 'async' branch.

Example
------------
```javascript
var ObjectResolver = require("./object-resolver"),
exampleObject = {},
resolver = new ObjectResolver();

// call with callback (error handling)
resolver.resolve(exampleObject)
    .update("a.b.0.c", 10, function (err, obj) {
        console.log(err); // null or string with error description "TypeError: cannot set property 'undefined' of number"
        console.log(obj); // updated object { a : { b : [{ c : 10 }] } }
    });

// chaining call
var result = resolver.resolve(exampleObject)
    .update("a.b.0.c", 10)
    .find("a.b.0"); // [{ c : 10 }]
```

License
------------
Copyright (c) 2012 Dmitry Poklonskiy &lt;dimik@ya.ru&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


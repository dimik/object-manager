/**
 * @fileOverview
 * Object Resolver class provides easy to use, chaining / asynchronous API (getter, setter)
 * for operations with complex javascript types (arrays, objects) using simple string dot notation queries.
 * It used mongodb-style query syntax for reaching into objects and can create undefined properties
 * and deep structures on the fly.
 * ObjectResolver is designed as a nodejs module but can be also used in the client side javascript,
 * with only removing unnecessary "= module.exports" assignment in constructor.
 * @see http://www.mongodb.org/display/DOCS/Dot+Notation+%28Reaching+into+Objects%29
 * @author <a href="mailto:dimik@ya.ru">Dmitry Poklonskiy</a>
 * @version 0.9
 * @example
 * var ObjectResolver = require("./object-resolver"),
 * exampleObject = {},
 * resolver = new ObjectResolver();
 *
 * // async call
 * resolver.resolve(exampleObject)
 *     .update("a.b.0.c", 10, function (err, obj) {
 *         console.log(err); // null or string with error description "TypeError: cannot set property 'undefined' of number"
 *         console.log(obj); // updated object { a : { b : [{ c : 10 }] } }
 *     });
 *
 * // sync chained call
 * var result = resolver.resolve(exampleObject)
 *     .update("a.b.0.c", 10)
 *     .find("a.b.0"); // [{ c : 10 }]
 */

/**
 * @constant
 */
var GETTER_TYPE_ERROR = "TypeError: Cannot read property '%s' of ",
    SETTER_TYPE_ERROR = "TypeError: Cannot set property '%s' of ";

/**
 * Create the ObjectResolver instance.
 * @class Provide methods for reaching into objects and insert the missing parts
 * using dot notation mongodb-style query string.
 * @name ObjectResolver
 * @param {String} [delim="."] Delimiter for the query string.
 */
var ObjectResolver = module.exports = function (delim) {
    this.delim = delim || ".";

    // Self-invoking constructor
    if(!(this instanceof ObjectResolver)) {
        return new ObjectResolver(delim);
    }
};

/**
 * Resolve query through context object.
 * @private
 * @function
 * @name resolveObjByPath
 * @param {Object|Array} obj Object which we want to resolve, it will always be this.ctx value.
 * @param {String[]} path Keys/indexes from query.
 * @param {Function} callback Will be called on resolving complete(fail).
 * @param {Boolean} upsert If requested object(s)/array(s) do not exist, insert one.
 * @returns {Object|Array} Link on the last but one object in query path.
 */
var resolveObjByPath = function (obj, path, callback, upsert) {
    var err = null,
        key,
        i = 0,
        len = path.length - 1; // We need last but one field value.

    for (; i < len; i++) {
        key = path[i];

        if("object" === typeof obj) {
            if("undefined" === typeof obj[key]) {
                if(upsert) {
                    obj[key] = isNaN(path[i + 1]) && {} || []; // If next key is an integer - create an array, else create an object.
                } else {
                    callback(err); // Not error, just return undefined.
                    return;
                }
            }
            obj = obj[key];
        } else {
            err = GETTER_TYPE_ERROR.replace('%s', key) + typeof obj;
            break;
        }
    }
    callback(err, !err && obj);
};

/**
 * ObjectResolver prototype.
 * @ignore
 * @private
 */
var ptp = ObjectResolver.prototype;

/**
 * Change context object which we resolve.
 * @function
 * @name ObjectResolver.resolve
 * @param {Object|Array} [ctx] Object which we want to resolve.
 * @returns {ObjectResolver} For chaining calls.
 */
ptp.resolve = function (ctx) {
    this.ctx = ctx || {};

    return this;
};

/**
 * Getter method of the ObjectResolver.
 * @function
 * @name ObjectResolver.find
 * @param {String} [query] Query string. If is not specified or an empty string - return resolved object.
 * @param {Function} [callback] Will be called with 2 params when resolving complete(fail):
 * 1. null or error description string
 * 2. value of the certain object[key] or undefined/false
 * @returns {ObjectResolver|Object} If callback is specified return 'this' for chaining calls,
 * else return resolved value (context object if path is empty string or not specified).
 */
ptp.find = function (query, callback) {
    if("function" === typeof query) callback = query, query = false; // Shift params if path not specified.

    var path = query && query.split(this.delim) || [],
        ctx = this.ctx,
        value;

    resolveObjByPath(ctx, path, function (err, obj) {
        var lastKey = path[path.length - 1];

        if(!err && "object" !== typeof obj) {
            err = GETTER_TYPE_ERROR.replace('%s', lastKey) + typeof obj;
        }
        value = !err && (lastKey ? obj[lastKey] : ctx);
        callback && callback(err, value);
    });

    return callback && this || value;
};

/**
 * Setter method of the ObjectResolver.
 * @function
 * @name ObjectResolver.update
 * @param {String} query Query string.
 * @param value What we want to assign.
 * @param {Function} [callback] Will be called with 2 params when assigning complete(fail):
 * 1. null or error description string
 * 2. updated object or false
 * @param {Boolean} [upsert=true] If requested object(s)/array(s) do not exist, insert one.
 * @returns {ObjectResolver} For chaining calls.
 */
ptp.update = function (query, value, callback, upsert) {
    if("boolean" === typeof callback) upsert = callback, callback = null; // Shift params if callback not specified.

    var path = query && query.split(this.delim) || [],
        upsert = "boolean" === typeof upsert ? upsert : true, // Upsert is true by default.
        ctx = this.ctx;

    resolveObjByPath(ctx, path, function (err, obj) {
        var lastKey = path[path.length - 1];

        if(!err) {
            // Only an object type can be indexed.
            if("object" === typeof obj && lastKey) {
                obj[lastKey] = value;
            } else {
                err = SETTER_TYPE_ERROR.replace('%s', lastKey) + typeof obj;
            }
        }
        callback && callback(err, !err && ctx);
    }, upsert);

    return this;
};


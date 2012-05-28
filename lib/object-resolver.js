/**
 * @fileOverview
 * Object Resolver class provides easy to use, chaining / async-callback API (getter, setter)
 * for operations with complex javascript types (arrays, objects) using simple string dot notation queries.
 * It used mongodb-style query syntax for reaching into objects and can create undefined properties
 * and deep structures on the fly.
 * ObjectResolver is designed as a nodejs module but can be also used in the client side javascript,
 * with only removing unnecessary "= module.exports" assignment in constructor.
 * Note: For async callbacks support please checkout 'async' branch.
 * @see http://www.mongodb.org/display/DOCS/Dot+Notation+%28Reaching+into+Objects%29
 * @author <a href="mailto:dimik@ya.ru">Dmitry Poklonskiy</a>
 * @version 0.9
 * @example
 * var ObjectResolver = require("object-resolver"),
 * exampleObject = {},
 * resolver = new ObjectResolver(exampleObject);
 *
 * // call with callback (errors handling)
 * resolver.update("a.b.0.c", 10, function (err, obj) {
 *     console.log(err); // null or string with error description "TypeError: cannot set property 'undefined' of number"
 *     console.log(obj); // updated object { a : { b : [{ c : 10 }] } }
 * });
 *
 * // chaining call
 * var result = resolver
 *     .update("a.b.0.c", 10)
 *     .find("a.b.0"); // [{ c : 10 }]
 */

/**
 * @constant
 */
var GETTER_ERROR = "Cannot read property '%s' of ",
    SETTER_ERROR = "Cannot set property '%s' of ";

/** 
 * Create the ObjectResolver instance.
 * @class Provide methods for reaching into objects and insert the missing parts
 * using dot notation mongodb-style query string.
 * @name ObjectResolver
 * @param {Object|Array} [ctx] Object which we want to resolve.
 * @param {String} [delim="."] Delimiter for the query string.
 */
var ObjectResolver = module.exports = function (ctx, delim) {
    "string" === typeof ctx && (delim = ctx, ctx = {}); // Shift params.

    this.ctx = ctx || {};
    this.delim = delim || ".";

    // Self-invoking constructor
    if(!(this instanceof ObjectResolver)) {
        return new ObjectResolver(delim);
    }   
};  

/**
 * Async function depends on VM
 * @private
 * @function
 * @name async
 * @param {Function} fn Will be called asynchronously.
 */
var async = process && process.nextTick ||
    function (fn) { return window.setTimeout(fn, 0) };

/** 
 * Resolve query through context object.
 * @private
 * @function
 * @name resolver
 * @param {Object|Array} obj Object which we want to resolve, it will always be this.ctx value.
 * @param {String[]} path Keys/indexes from query.
 * @param {Number} depth How deep does we go.
 * @param {Function} callback Will be called on resolving complete(fail).
 * @param {Boolean} upsert If requested object(s)/array(s) do not exist, insert one.
 * @returns {Object|Array} Link on the last but one object in query path.
 */
var resolver = function (obj, path, depth, callback, upsert) {
    var err = null, i, key;

    for (i = 0; i < depth; i++) {
        key = path[i];

        if(null != obj) {
            "undefined" === typeof obj[key] && upsert && (obj[key] = isNaN(path[i + 1]) && {} || []); // If next key is an integer
 - create an array, else create an object.
            if("undefined" === typeof (obj = obj[key])) {
                break;
            }   
        } else {
            err = new TypeError(GETTER_ERROR.replace('%s', key) + (null === obj && 'null' || typeof obj));
            break;
        }   
    }   
    if(callback) {
        async(function () {
            callback(err && String(err), !err && obj);
        }); 
    } else {
        return err || obj;
    }   
};

/**
 * ObjectResolver prototype.
 * @ignore
 * @private
 */
var ptp = ObjectResolver.prototype;

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
    "function" === typeof query && (callback = query, query = false); // Shift params if path not specified.

    var path = query && query.split(this.delim) || [],
        result = resolver(this.ctx, path, path.length, callback);

    if(result instanceof Error) {
        throw result;
    }

    return callback && this || result;
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
    "boolean" === typeof callback && (upsert = callback, callback = null); // Shift params if callback not specified.

    var path = query && query.split(this.delim) || [],
        depth = path.length - 1,
        lastKey = path[depth],
        upsert = "boolean" === typeof upsert ? upsert : true,
        ctx = this.ctx,
        result = callback || resolver(ctx, path, depth, callback, upsert),
        set = function (obj, key, val) {
            return null != obj && key ? obj[key] = val :
                new TypeError(SETTER_ERROR.replace('%s', key) + (null === obj && 'null' || typeof obj));
        };

    if(callback) {
        resolver(ctx, path, depth, function (err, obj) {
            err || (result = set(obj, lastKey, value)) instanceof Error && (err = String(result));
            callback(err, !err && ctx);
        }, upsert);
    } else {
        if(result instanceof Error || (result = set(result, lastKey, value)) instanceof Error) {
            throw result;
        }
    }

    return this;
};

/**
 * Apply function with object as context.
 * @function
 * @name ObjectResolver.apply
 * @param {String} query Query string.
 * @param {Function} fn Will be called with this = object, resolved through the query.
 * @param {Array} args Arguments for function call.
 */
ptp.apply = function (query, fn, args) {
    return fn.apply(this.find(query), args);
};

/**
 * Create a copy of the resolved object.
 * @function
 * @name ObjectResolver.copy
 * @param {String} query Query string.
 * @returns {Object|Boolean} Resolved copy or false.
 */
ptp.copy = function (query) {
    var result = this.find(query);

    return "object" === typeof result && JSON.parse(JSON.stringify(result));
};

/**
 * Create a mixin
 * @function
 * @name ObjectResolver.mixin
 * @param {String} query Query string.
 * @returns {Object} Mixin of the resolved
 */
ptp.mixin = function () {
    var query = arguments[0],
        ctx = this.find(query),
        result = {},
        hasOwn = Object.prototype.hasOwnProperty,
        extend = function (o1, o2) {
            for (var prop in o2) {
                hasOwn.call(o2, prop) && (o1[prop] = o2[prop]);
            }

            return o1;
        };

    for (var arg = 1; arg < arguments.length; arg++) {
        result = extend(result, arguments[arg]);
    }

    return extend(result, ctx);
};

var ObjectResolver = require('..');

exports.testIsConstructor = function (test) {
    test.equal(typeof ObjectResolver, 'function');

    test.done();
};

exports.testFind = function (test) {
    var r = new ObjectResolver(),
        obj = { a : { b : { c : [ 10 ] } } },
        ctx = r.resolve(obj);

    test.strictEqual(ctx.find('a.b.c.0'), 10, 'value of the a.b.c.0 !== 10');
    test.deepEqual(ctx.find(), obj, 'found obj is notDeepEqual with expected');
    test.strictEqual(ctx.find('b.c'), undefined, 'found unexpected value for non existed path');
    test.doesNotThrow(function () { ctx.find('b.c'); }, TypeError, 'find throws error');

    test.done();
};

exports.testFindAsync = function (test) {
    var r = new ObjectResolver(),
        obj = { a : { b : { c : [ 10 ] } } },
        ctx = r.resolve(obj);

    test.expect(3);

    test.ok(ctx.find('a.b.c.0', function (err, val) {
                test.ifError(err);
                test.strictEqual(val, 10, 'value of the a.b.c.0 !== 10');

                test.done();
        }) instanceof ObjectResolver
    );
};

exports.testUpdate = function (test) {
    var r = new ObjectResolver(),
        obj = { a : 5 },
        ctx = r.resolve(obj);

    test.deepEqual(ctx.update('b.c.0', 10).find(), { a : 5, b : { c : [10] } }, 'updated obj is notDeepEqual with expected');
    test.throws(function () { ctx.update('a.b.c.0', 10); }, TypeError, 'update doesNotThrow error');

    test.done();
};

var ObjectManager = require('..');

exports.testIsConstructor = function (test) {
    test.equal(typeof ObjectManager, 'function');

    test.done();
};

exports.testFind = function (test) {
    var ctx = { a : { b : { c : [ 10 ] } } },
        m = new ObjectManager(ctx);

    test.strictEqual(m.find('a.b.c.0'), 10, 'value of the a.b.c.0 !== 10');
    test.deepEqual(m.find(), ctx, 'found ctx is notDeepEqual with expected');
    test.strictEqual(m.find('b.c'), undefined, 'found unexpected value for non existed path');
    test.doesNotThrow(function () { m.find('b.c'); }, TypeError, 'find throws error');

    test.done();
};

exports.testFindAsync = function (test) {
    var ctx = { a : { b : { c : [ 10 ] } } },
        m = new ObjectManager(ctx);

    test.expect(3);

    test.ok(m.find('a.b.c.0', function (err, val) {
        test.ifError(err);
        test.strictEqual(val, 10, 'value of the a.b.c.0 !== 10');

        test.done();
    }) instanceof ObjectManager);
};

exports.testUpdate = function (test) {
    var m = new ObjectManager({ a : 5 });

    test.deepEqual(m.update('b.c.0', 10).find(), { a : 5, b : { c : [10] } }, 'updated ctx is notDeepEqual with expected');
    test.throws(function () { m.update('a.b.c.0', 10); }, TypeError, 'update doesNotThrow error');

    test.done();
};

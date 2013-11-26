var numeral = require('../../numeral');

exports.unformat = {
    setUp: function (callback) {
        numeral.zeroFormat('N/A');
        callback();
    },

    numbers: function (test) {
        test.expect(15);

        var tests = [
                ['10,000.123', 10000.123],
                ['-0.12345', -0.12345],
                ['23rd', 23],
                ['31st', 31],
                ['1.23t', 1230000000000],
                ['N/A', 0],
                [, 0],
                ['', 0],

                // Pass Through for Numbers
                [0, 0],
                [1, 1],
                [1.1, 1.1],
                [-0, 0],
                [-1, -1],
                [-1.1, -1.1]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numeral().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }
        test.strictEqual( numeral().setFormat('#,##0.00;(#,##0.00)').unformat('(0.12345)'), -0.12345 );

        test.done();
    },

    currency: function (test) {
        test.expect(2);

        test.strictEqual( numeral().unformat('$ 10,000.00'), 10000 );
        test.strictEqual( numeral().setFormat('¤#,##0.00;(¤#,##0.00)').unformat('($1.23m)'), -1230000 );

        test.done();
    },

    bytes: function (test) {
        test.expect(2);

        var tests = [
                ['100B', 100],
                ['3.154 TB', 3467859674006]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numeral().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    },

    percentages: function (test) {
        test.expect(1);

        var tests = [
                ['-76%', -0.76]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numeral().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    },

    time: function (test) {
        test.expect(1);

        var tests = [
                ['2:23:57', 8637]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numeral().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    }
};
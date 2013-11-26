var numeral = require('../../numeral');

// Manipulation is provided by Big.js library, which itself is very well covered with tests.
// These tests simply serve the purpose to see if the bindings work as expected

exports.manipulate = {

    add: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,1010],
                [0.5,3,3.5],
                [-100,200,100],
                [0.1,0.2,0.3]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.add(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' + ' + tests[i][1]);
        }

        test.done();
    },

    subtract: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,990],
                [0.5,3,-2.5],
                [-100,200,-300],
                [0.3,0.1,0.2]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.subtract(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' - ' + tests[i][1]);
        }

        test.done();
    },

    multiply: function (test) {
        test.expect(5);

        var tests = [
                [1000,10,10000],
                [0.5,3,1.5],
                [-100,200,-20000],
                [0.1,0.2,0.02],
                [123456789201921,1000,123456789201921000]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.multiply(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' * ' + tests[i][1]);
        }

        test.done();
    },

    divide: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,100],
                [0.5,3,0.16666666666666666],
                [-100,200,-0.5],
                [5.3,0.1,53]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.divide(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' / ' + tests[i][1]);
        }

        test.done();
    },

    power: function (test) {
        test.expect(1);

        var tests = [
                [10,10,10000000000],
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.power(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' power (' + tests[i][1] + ')');
        }

        test.done();
    },

    sqrt: function (test) {
        test.expect(2);

        var tests = [
                [4,2],
                [0.25,0.5],
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.sqrt();
            test.strictEqual(num.value(), tests[i][1], tests[i][0] + ' sqrt (' + tests[i][1] + ')');
        }

        test.done();
    },

    mod: function (test) {
        test.expect(1);

        var tests = [
                [9,3,3],
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.sqrt(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' % ' + tests[i][1]);
        }

        test.done();
    },

    round: function (test) {
        test.expect(4);

        var tests = [
                [1.35,1,0,1.3],
                [1.35,1,1,1.4],
                [-2.426346,4,2,-2.4263],
                [0.06922,2,1,0.07],
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            num.round(tests[i][1], tests[i][2]);
            test.strictEqual(num.value(), tests[i][3], tests[i][0] + ' round(' + tests[i][1] + ',' + tests[i][2] + ')');
        }

        test.done();
    }

};
var numeral = require('../../numeral'),
    et = require('../../locales/et');

// Load in estonian locale for testing local locale
numeral.locale('et', et).locale('en');

exports.misc = {

    value: function (test) {
        test.expect(5);

        var tests = [
                [1000, 1000],
                [0.5, 0.5],
                [, 0],
                ['1,000', 1000],
                ['not a number', 0]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            test.strictEqual(num.value(), tests[i][1], tests[i][1]);
        }

        test.done();
    },

    set: function (test) {
        test.expect(2);

        var tests = [
                [1000,1000],
                [-0.25,-0.25]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral().set(tests[i][0]);
            test.strictEqual(num.value(), tests[i][1], tests[i][0]);
        }

        test.done();
    },

    customZero: function (test) {
        test.expect(3);

        var tests = [
                [0,null,'0'],
                [0,'N/A','N/A'],
                [0,'','']
            ];

        for (var i = 0; i < tests.length; i++) {
            numeral.zeroFormat(tests[i][1]);
            test.strictEqual(numeral(tests[i][0]).format('0'), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    clone: function (test) {
        test.expect(4);

        var a = numeral(1000),
            b = numeral(a),
            c = a.clone(),
            aVal = a.value(),
            aSet = a.set(2000).value(),
            bVal = b.value(),
            cVal = c.add(10).value();

        test.strictEqual(aVal, 1000, 'Parent starting value');
        test.strictEqual(aSet, 2000, 'Parent set to 2000');
        test.strictEqual(bVal, 1000, 'Implicit clone unmanipulated');
        test.strictEqual(cVal, 1010, 'Explicit clone + 10');

        test.done();
    },

    isNumeral: function (test) {
        test.expect(2);

        var tests = [
                [numeral(),true],
                [1,false]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numeral.isNumeral(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    },


    locale: function(test) {
        test.expect(3);

        var num1 = numeral(10000.23).locale('et'),
            num2 = numeral(10000.23);

        test.strictEqual(num1.decimal(), '10 000,23', 'Changing instance locale should affect the instance\'s formats');
        test.strictEqual(num2.decimal(), '10,000.23', 'Changing instance locale should not affect other instances');
        test.strictEqual(numeral(10000.23).decimal(), '10,000.23', 'Changing instance locale should not affect global locale');

        test.done();

    },

    
    localeData: function(test) {
        test.expect(10);
        
        var cOld = 'USD',
            cNew = 'EUR',
            formatTestVal = function() { return numeral('100').format('$0,0') },
            oldCurrencyVal = '$100',
            newCurrencyVal = '€100';
        
        test.strictEqual(numeral.localeData().currency.local, cOld, 'Current locale currency is ' + cOld);
        test.strictEqual(numeral.localeData('en').currency.local, cOld, 'English locale currency is ' + cOld);
        
        numeral.localeData().currency.local = cNew;
        test.strictEqual(numeral.localeData().currency.local, cNew, 'Current locale currency is changed to ' + cNew);
        test.strictEqual(formatTestVal(), newCurrencyVal, 'Format uses new currency');
        
        numeral.localeData().currency.local = cOld;
        test.strictEqual(numeral.localeData().currency.local, 'USD', 'Current locale currency is reset to ' + cOld);
        test.strictEqual(formatTestVal(), oldCurrencyVal, 'Format uses old currency');
        
        numeral.localeData('en').currency.local = cNew;
        test.strictEqual(numeral.localeData().currency.local, cNew, 'English locale currency is changed to ' + cNew);
        test.strictEqual(formatTestVal(), newCurrencyVal, 'Format uses new currency');
        
        numeral.localeData('en').currency.local = cOld;
        test.strictEqual(numeral.localeData().currency.local, cOld, 'English locale currency is reset to ' + cOld);
        test.strictEqual(formatTestVal(), oldCurrencyVal, 'Format uses old currency');
        
        test.done();
    },


    difference: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,990],
                [0.5,3,2.5],
                [-100,200,300],
                [0.3,0.2,0.1]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            test.strictEqual(num.difference(tests[i][1]), tests[i][2], 'Difference between ' + tests[i][0] + ' and ' + tests[i][1]);
        }

        test.done();
    },


    rm: function (test) {

        test.expect(6);

        test.strictEqual( numeral(0.615).toFixed(2), '0.62', 'Default rounding mode should be 1' );

        test.strictEqual( numeral(0.615).rm(0).toFixed(2), '0.61' );
        test.strictEqual( numeral(0.615).rm(2).toFixed(2), '0.62' );
        test.strictEqual( numeral(0.615).rm(3).toFixed(2), '0.62' );

        numeral().rm(0);
        test.strictEqual( numeral(0.615).toFixed(2), '0.62', 'Changing instance rounding mode should not affect global rounding mode' );

        var num1 = numeral(0.615),
            num2 = numeral(0.615);

        num1.rm(0);
        test.strictEqual( num2.toFixed(2), '0.62', 'Changing instance rounding mode should not affect other instances' );

        test.done();
    },


    toFixed: function (test) {
        test.expect(6);

        var tests = [
                // num, decimals, result
                [1.23456,   2,  '1.23'],
                [0.567,     1,  '0.6'],
                [0.615,     2,  '0.62'],
                [-100.99,   0,  '-101'],
                [0.3231,    2,  '0.32'],
                [0.3,       2,  '0.30']
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            test.strictEqual(num.toFixed(tests[i][1]), tests[i][2], 'toFixed(' + tests[i][1] + ') should be ' + tests[i][2]);
        }

        test.done();
    },


    toPrecision: function (test) {
        test.expect(5);

        var tests = [
                [7,1,'7'],
                [7,2,'7.0'],
                [7,3,'7.00'],
                [-7,3,'-7.00'],
                [91,4,'91.00']
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            test.strictEqual(num.toPrecision(tests[i][1]), tests[i][2], 'toPrecision(' + tests[i][1] + ') should be ' + tests[i][2]);
        }

        test.done();
    },

    eq: function (test) {
        test.expect(3);

        var tests = [
                [7,7,true],
                [0.1,0.100000,true],
                [-5.1,5.1,false],
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numeral(tests[i][0]);
            test.strictEqual(num.eq(tests[i][1]), tests[i][2], 'Equality of ' + tests[i][1] + ' and ' + tests[i][2]);
        }

        test.done();        
    },


    gt: function (test) {
        test.ok(numeral(100).gt(99));
        test.done();
    },


    gte: function (test) {
        test.ok(numeral(100).gte(100));
        test.ok(numeral(100).gte(99));
        test.done();
    },


    lt: function (test) {
        test.ok(numeral(100).lt(101));
        test.done();
    },


    lte: function (test) {
        test.ok(numeral(100).lte(100));
        test.ok(numeral(100).lte(101));
        test.done();
    }
};
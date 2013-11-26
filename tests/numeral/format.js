var numeral = require('../../numeral');

exports.format = {
    default: function (test) {
        test.expect(1);

        numeral.setFormat('#,##0');

        test.strictEqual(numeral(10000).format(), '10,000', '#,##0');

        test.done();
    },

    value: function (test) {
        var tests = [
                '#,##0',
                '#,##0$',
                '#,##0%'
            ],
            value = 12345.6,
            n = numeral(value),
            format,
            i;

        test.expect(tests.length);
        
        for (i = 0; i < tests.length; i++) {
            format = n.format(test[i]);
            test.strictEqual(n.value(), value, 'value unchanged after format' + test[i]);
        }

        test.done();
    },

    numbers: function (test) {

        var tests = [
                [10000,     '#,##0',    '10,000'],
                [10000.23,  '#,##0',    '10,000'],

                [10000.23,      '#,##0.##',     '10,000.23'],
                [10000,         '#,##0.####',   '10,000'],
                [10000.23,      '#,##0.####',   '10,000.23'],
                [10000.2345,    '#,##0.####',   '10,000.2345'],

                [10000,         '#,##0.00',     '10,000.00'],
                [10000.23,      '#,##0.00',     '10,000.23'],
                [10000.2345,    '#,##0.00',     '10,000.23'],
                [10000.2345,    '#,##0.0000',   '10,000.2345'],


                [-10000,    '#,##0',            '-10,000'],
                [-10000,    '#,##0;(#,##0)',    '(10,000)'],
                [10000,     '#,##0;(#,##0)',    '10,000'],

                [0.5,   '#,##0',      '1'],
                [0.45,  '#,##0',      '0'],
                [0.5,   '#,##0.0',    '0.5'],
                
                [10000000,  '#,##,##0',     '1,00,00,000'],
                [10000000,  '#,####,##0',   '1,0000,000'],
            ],
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numeral(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    currency: function (test) {
        var tests = [
                [1000.234,'$#,##0.00','$1,000.23'],
                [1001,'$ #,##0.##','$ 1,001'],
                [1000.234,'#,##0.00 $','1,000.23 $'],
                [-1000.234,'$#,##0;($#,##0)','($1,000)'],
                [-1000.234,'#,##0$;(#,##0$)','(1,000$)'],
                [-1000.234,'$#,##0.00','-$1,000.23'],
            ], i, result;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            result = numeral(tests[i][0]).format(tests[i][1], { currency: 'USD' });
            test.strictEqual(result, tests[i][2], tests[i][1]);
        }

        test.done();
    },

    bytes: function (test) {
        var tests = [
                [100,'0','100B'],
                [1024*2,'0','2KB'],
                [1024*1024*5,'0','5MB'],
                [1024*1024*1024*7.343,'0.#','7.3GB'],
                [1024*1024*1024*1024*3.1536544,'0.###','3.154TB'],
                [1024*1024*1024*1024*1024*2.953454534534,'0','3PB']
            ], i, result;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            result = numeral(tests[i][0]).format(tests[i][1], { bytes: true });
            test.strictEqual(result, tests[i][2], tests[i][1]);
        }

        test.done();
    },

    percentages: function (test) {
        var tests = [
                [1,'0%','100%'],
                [0.974878234,'0.000%','97.488%'],
                [-0.43,'0 %','-43 %'],
                [0.43,'0.00%','43.00%'],
                [0.0043,'0.##\u2030','4.3\u2030']
            ], i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numeral(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    time: function (test) {
        var tests = [
                [25,'0:00:25'],
                [238,'0:03:58'],
                [63846,'17:44:06']
            ],
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numeral(tests[i][0]).time(), tests[i][1], tests[i][1]);
        }

        test.done();
    },
    
    rounding: function (test) {

        test.strictEqual( numeral(2280002).rm(0).format('0.00', { abbr: true }), '2.28m' );
        test.strictEqual( numeral(2280002).rm(3).format('0.00', { abbr: true }), '2.29m' );
        
        test.strictEqual( numeral(10000.23).rm(0).format('#,##0'), '10,000' );
        test.strictEqual( numeral(10000.23).rm(3).format('#,##0'), '10,001' );
        
        test.strictEqual( numeral(10000.234).rm(0).format('#,##0.00'), '10,000.23' );
        test.strictEqual( numeral(10000.234).rm(3).format('#,##0.00'), '10,000.24' );
        
        test.strictEqual( numeral(0.974878234).rm(0).format('0.000%'), '97.487%' );
        test.strictEqual( numeral(0.974878234).rm(3).format('0.000%'), '97.488%' );
        
        test.strictEqual( numeral(-0.433).rm(0).format('0 %'), '-43 %' );
        test.strictEqual( numeral(-0.433).rm(3).format('0 %'), '-44 %' );

        // Set rounding mode back to 1
        numeral.rm(1);
      
      test.done();
      
    },
};

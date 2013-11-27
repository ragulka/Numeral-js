/*! 
 * numeral.js locale configuration
 * locale : Estonian
 * author : Illimar Tambek : https://github.com/ragulka
 *
 * Note: in Estonian, abbreviations are always separated
 * from numbers with a space
 */
(function () {
    var locale = {
        symbols: {
            decimal:        ',',
            group:          ' ',
            list:           ';',
            zero:           '0',
            percent:        '%',
            plusSign:       '+',
            minusSign:      '-',
            exponential:    'E',
            permille:       '\u2030',
            infinity:       '\u221E',
            nan:            'NaN'
        },
        patterns: {
            decimal:    '#,##0.###',
            scientific: '#E0',
            percent:    '#,##0%',
            currency:   '#,##0.00 ¤',
            accounting: '#,##0.00 ¤;(#,##0.00 ¤)',
        },
        abbreviations: {
            thousand:   ' tuh',
            million:    ' mln',
            billion:    ' mld',
            trillion:   ' trl'
        },
        currency: {
            local: 'EUR',
            symbols: { AUD: 'A$', BRL: 'R$', CAD: 'CA$', CNY: 'CN\u00A5', EUR: '\u20AC', GBP: '\u00A3', HKD: 'HK$', ILS: '\u20AA', INR: '\u20B9', JPY: '\u00A5', KRW: '\u20A9', MXN: 'MX$', NZD: 'NZ$', THB: '\u0E3F', TWD: 'NT$', USD: '$', VND: '\u20AB', XAF: 'FCFA', XCD: 'EC$', XOF: 'CFA', XPF: 'CFPF' }
        },
        ordinal: function () { return '.'; }
    };

    // Node
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = locale;
    }
    // Browser
    if (typeof window !== 'undefined' && this.numeral && this.numeral.locale) {
        this.numeral.locale('et', locale);
    }
}());

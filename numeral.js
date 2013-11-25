/*!
 * numeral.js
 * version : 1.5.2
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

(function () {

    /************************************
        Constants
    ************************************/

    var numeral,
        VERSION = '1.5.2',
        // internal storage for locale config files
        locales = {},
        currentLocale = 'en',
        zeroFormat = null,
        defaultFormat = '0,0',
        // Internal storage for parsed pattern results
        patterns = {},
        currentPattern,

        // Constants used in parsing patterns
        ZERO =      '0',
        GROUP =     ',',
        DECIMAL =   '.',
        PERMILLE =  '\u2030',
        PERCENT =   '%',
        DIGIT =     '#',
        SEPARATOR = ';',
        EXPONENT =  'E',
        PLUS =      '+',
        MINUS =     '-',
        CURRENCY =  '\u00A4',
        DOLLAR =    '$',
        QUOTE =     '\'',

        // Should the usage of Ascii digits be enforced
        enforceAsciiDigits = false,

        // List of valid currencies
        currencies = ['ADP','AED','AFA','AFN','ALK','ALL','AMD','ANG','AOA','AOK','AON','AOR','ARA','ARL','ARM','ARP','ARS','ATS','AUD','AWG','AZM','AZN','BAD','BAM','BAN','BBD','BDT','BEC','BEF','BEL','BGL','BGM','BGN','BGO','BHD','BIF','BMD','BND','BOB','BOL','BOP','BOV','BRB','BRC','BRE','BRL','BRN','BRR','BRZ','BSD','BTN','BUK','BWP','BYB','BYR','BZD','CAD','CDF','CHE','CHF','CHW','CLE','CLF','CLP','CNX','CNY','COP','COU','CRC','CSD','CSK','CUC','CUP','CVE','CYP','CZK','DDM','DEM','DJF','DKK','DOP','DZD','ECS','ECV','EEK','EGP','ERN','ESA','ESB','ESP','ETB','EUR','FIM','FJD','FKP','FRF','GBP','GEK','GEL','GHC','GHS','GIP','GMD','GNF','GNS','GQE','GRD','GTQ','GWE','GWP','GYD','HKD','HNL','HRD','HRK','HTG','HUF','IDR','IEP','ILP','ILR','ILS','INR','IQD','IRR','ISJ','ISK','ITL','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRH','KRO','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LTL','LTT','LUC','LUF','LUL','LVL','LVR','LYD','MAD','MAF','MCF','MDC','MDL','MGA','MGF','MKD','MKN','MLF','MMK','MNT','MOP','MRO','MTL','MTP','MUR','MVP','MVR','MWK','MXN','MXP','MXV','MYR','MZE','MZM','MZN','NAD','NGN','NIC','NIO','NLG','NOK','NPR','NZD','OMR','PAB','PEI','PEN','PES','PGK','PHP','PKR','PLN','PLZ','PTE','PYG','QAR','RHD','ROL','RON','RSD','RUB','RUR','RWF','SAR','SBD','SCR','SDD','SDG','SDP','SEK','SGD','SHP','SIT','SKK','SLL','SOS','SRD','SRG','SSP','STD','SUR','SVC','SYP','SZL','THB','TJR','TJS','TMM','TMT','TND','TOP','TPE','TRL','TRY','TTD','TWD','TZS','UAH','UAK','UGS','UGX','USD','USN','USS','UYI','UYP','UYU','UZS','VEB','VEF','VND','VNN','VUV','WST','XAF','XAG','XAU','XBA','XBB','XBC','XBD','XCD','XDR','XEU','XFO','XFU','XOF','XPD','XPF','XPT','XRE','XSU','XTS','XUA','XXX','YDD','YER','YUD','YUM','YUN','YUR','ZAL','ZAR','ZMK','ZRN','ZRZ','ZWD','ZWL','ZWR'],
        
        // Check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    // Numeral prototype object
    function Numeral (number) {
        this._value = number;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed (value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;
            
        //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (roundingFunction(value * power) / power).toFixed(precision);

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumeral (n, format, roundingFunction) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, format, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumeral (n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (locales[currentLocale].delimiters.decimal !== '.') {
                    string = string.replace(/\./g,'').replace(locales[currentLocale].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + locales[currentLocale].abbreviations.thousand + '(?:\\)|(\\' + locales[currentLocale].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + locales[currentLocale].abbreviations.million + '(?:\\)|(\\' + locales[currentLocale].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + locales[currentLocale].abbreviations.billion + '(?:\\)|(\\' + locales[currentLocale].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + locales[currentLocale].abbreviations.trillion + '(?:\\)|(\\' + locales[currentLocale].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 0; power <= suffixes.length; power++) {
                    bytesMultiplier = (string.indexOf(suffixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                    if (bytesMultiplier) {
                        break;
                    }
                }

                // do some math to create our number
                n._value = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * (((string.split('-').length + Math.min(string.split('(').length-1, string.split(')').length-1)) % 2)? 1: -1) * Number(string.replace(/[^0-9\.]+/g, ''));

                // round if we are talking about bytes
                n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
            }
        }
        return n._value;
    }

    function formatCurrency (n, format, roundingFunction) {
        var prependSymbol = format.indexOf('$') <= 1 ? true : false,
            space = '',
            output;

        // check for space before or after currency
        if (format.indexOf(' $') > -1) {
            space = ' ';
            format = format.replace(' $', '');
        } else if (format.indexOf('$ ') > -1) {
            space = ' ';
            format = format.replace('$ ', '');
        } else {
            format = format.replace('$', '');
        }

        // format the number
        output = formatNumber(n._value, format, roundingFunction);

        // position the symbol
        if (prependSymbol) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                output.splice(1, 0, locales[currentLocale].currency.symbol + space);
                output = output.join('');
            } else {
                output = locales[currentLocale].currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + locales[currentLocale].currency.symbol);
                output = output.join('');
            } else {
                output = output + space + locales[currentLocale].currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage (n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);
        
        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime (n) {
        var hours = Math.floor(n._value/60/60),
            minutes = Math.floor((n._value - (hours * 60 * 60))/60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime (string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatNumber (value, format, roundingFunction) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            w,
            precision,
            thousands,
            d = '',
            neg = false;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        } else {
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (format.indexOf('(') > -1) {
                negP = true;
                format = format.slice(1, -1);
            } else if (format.indexOf('+') > -1) {
                signed = true;
                format = format.replace(/\+/g, '');
            }

            // see if abbreviation is wanted
            if (format.indexOf('a') > -1) {
                // check for space before abbreviation
                if (format.indexOf(' a') > -1) {
                    abbr = ' ';
                    format = format.replace(' a', '');
                } else {
                    format = format.replace('a', '');
                }

                if (abs >= Math.pow(10, 12)) {
                    // trillion
                    abbr = abbr + locales[currentLocale].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
                    // billion
                    abbr = abbr + locales[currentLocale].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
                    // million
                    abbr = abbr + locales[currentLocale].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
                    // thousand
                    abbr = abbr + locales[currentLocale].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            // see if we are formatting bytes
            if (format.indexOf('b') > -1) {
                // check for space before
                if (format.indexOf(' b') > -1) {
                    bytes = ' ';
                    format = format.replace(' b', '');
                } else {
                    format = format.replace('b', '');
                }

                for (power = 0; power <= suffixes.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (value >= min && value < max) {
                        bytes = bytes + suffixes[power];
                        if (min > 0) {
                            value = value / min;
                        }
                        break;
                    }
                }
            }

            // see if ordinal is wanted
            if (format.indexOf('o') > -1) {
                // check for space before
                if (format.indexOf(' o') > -1) {
                    ord = ' ';
                    format = format.replace(' o', '');
                } else {
                    format = format.replace('o', '');
                }

                ord = ord + locales[currentLocale].ordinal(value);
            }

            if (format.indexOf('[.]') > -1) {
                optDec = true;
                format = format.replace('[.]', '.');
            }

            w = value.toString().split('.')[0];
            precision = format.split('.')[1];
            thousands = format.indexOf(',');

            if (precision) {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }

                w = d.split('.')[0];

                if (d.split('.')[1].length) {
                    d = locales[currentLocale].delimiters.decimal + d.split('.')[1];
                } else {
                    d = '';
                }

                if (optDec && Number(d.slice(1)) === 0) {
                    d = '';
                }
            } else {
                w = toFixed(value, null, roundingFunction);
            }

            // format number
            if (w.indexOf('-') > -1) {
                w = w.slice(1);
                neg = true;
            }

            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + locales[currentLocale].delimiters.thousands);
            }

            if (format.indexOf('.') === 0) {
                w = '';
            }

            return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
        }
    }

    /**
     * Apply provided pattern, result are stored in the patterns object.
     *
     * @param {string} pattern String pattern being applied.
     */
    applyPattern = function(pattern) {
        pattern = pattern.replace(/ /g, '\u00a0');

        // Parse only if parsing results do not exist
        if (!patterns[pattern]) {
            var pos = [0],
                result = patterns[pattern] = {
                    maxIntDigits: 40,
                    minIntDigits: 1,
                    maxFracDigits: 3,
                    minFracDigits: 0,
                    minExpDigits: 0,
                    useSignForPositiveExp: false,
                    positivePrefix: '',
                    positiveSuffix: '',
                    negativePrefix: '-',
                    negativeSuffix: '',
                    groupingSize: 3,
                    groupingSize2: 0,
                    multiplier: 1,
                    decimalSeparatorAlwaysShown: false,
                    useExpNotation: false
                };

            result.positivePrefix = parseAffix(pattern, pos);
            var trunkStart = pos[0];
            parseTrunk(pattern, pos);
            var trunkLen = pos[0] - trunkStart;
            result.positiveSuffix = parseAffix(pattern, pos);
            
            if (pos[0] < pattern.length &&
                pattern.charAt(pos[0]) == SEPARATOR) {
                pos[0]++;
                result.negativePrefix = parseAffix(pattern, pos);
                // we assume this part is identical to positive part.
                // user must make sure the pattern is correctly constructed.
                pos[0] += trunkLen;
                result.negativeSuffix = parseAffix(pattern, pos);
            } else {
                // if no negative affix specified, they share the same positive affix
                result.negativePrefix = result.positivePrefix + result.negativePrefix;
                result.negativeSuffix += result.positiveSuffix;
            }
        }

        // Set the current pattern
        currentPattern = patterns[pattern];
    }

    /**
     * Parses affix (prefix or suffix) part of pattern.
     *
     * @param {string} pattern Pattern string that need to be parsed.
     * @param {Array.<number>} pos One element position array to set and receive
     *     parsing position.
     *
     * @return {string} Affix received from parsing.
     */
    parseAffix = function(pattern, pos) {
        var affix = '';
        var inQuote = false;
        var len = pattern.length;
        var result = patterns[pattern];

        for (; pos[0] < len; pos[0]++) {
            var ch = pattern.charAt(pos[0]);
            if (ch == QUOTE) {
                if (pos[0] + 1 < len &&
                    pattern.charAt(pos[0] + 1) == QUOTE) {
                    pos[0]++;
                    affix += '\''; // 'don''t'
                } else {
                    inQuote = !inQuote;
                }
                continue;
            }

            if (inQuote) {
                affix += ch;
            } else {
                switch (ch) {
                    case DIGIT:
                    case ZERO:
                    case GROUP:
                    case DECIMAL:
                    case SEPARATOR:
                        return affix;
                    case CURRENCY:
                        affix += ch;
                        break;
                    // Support providing $ in currency pattern instead of the default currency symbol
                    case DOLLAR:
                        affix += CURRENCY;
                        break;
                    case PERCENT:
                        if (result.multiplier != 1) {
                            throw Error('Too many percent/permill');
                        }
                        result.multiplier = 100;
                        affix += ch;
                        break;
                    case PERMILLE:
                        if (result.multiplier != 1) {
                            throw Error('Too many percent/permill');
                        }
                        result.multiplier = 1000;
                        affix += ch;
                        break;
                    default:
                        affix += ch;
                }
            }
        }

        return affix;
    }

    /**
     * Parses the trunk (main) part of a pattern.
     *
     * @param {string} pattern Pattern string that need to be parsed.
     * @param {Array.<number>} pos One element position array to set and receive
     *     parsing position.
     */
    parseTrunk = function(pattern, pos) {
        var decimalPos = -1;
        var digitLeftCount = 0;
        var zeroDigitCount = 0;
        var digitRightCount = 0;
        var groupingCount = -1;
        var groupingCount2 = -1;

        var result = patterns[pattern];

        var len = pattern.length;
        for (var loop = true; pos[0] < len && loop; pos[0]++) {
            var ch = pattern.charAt(pos[0]);
            switch (ch) {
                case DIGIT:
                    if (zeroDigitCount > 0) {
                        digitRightCount++;
                    } else {
                        digitLeftCount++;
                    }
                    if (groupingCount >= 0 && decimalPos < 0) {
                        groupingCount++;
                    }
                    break;
                case ZERO:
                    if (digitRightCount > 0) {
                        throw Error('Unexpected "0" in pattern "' + pattern + '"');
                    }
                    zeroDigitCount++;
                    if (groupingCount >= 0 && decimalPos < 0) {
                        groupingCount++;
                    }
                    break;
                case GROUP:
                    groupingCount2 = groupingCount;
                    groupingCount = 0;
                    break;
                case DECIMAL:
                    if (decimalPos >= 0) {
                        throw Error('Multiple decimal separators in pattern "' +
                            pattern + '"');
                    }
                    decimalPos = digitLeftCount + zeroDigitCount + digitRightCount;
                    break;
                case EXPONENT:
                    if (result.useExpNotation) {
                        throw Error('Multiple exponential symbols in pattern "' +
                            pattern + '"');
                    }
                    result.useExpNotation = true;
                    result.minExpDigits = 0;

                    // exponent pattern can have a optional '+'.
                    if ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) ==
                        PLUS) {
                        pos[0]++;
                        result.useSignForPositiveExp = true;
                    }

                    // Use lookahead to parse out the exponential part
                    // of the pattern, then jump into phase 2.
                    while ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) ==
                        ZERO) {
                        pos[0]++;
                        result.minExpDigits++;
                    }

                    if ((digitLeftCount + zeroDigitCount) < 1 ||
                        result.minExpDigits < 1) {
                        throw Error('Malformed exponential pattern "' + pattern + '"');
                    }
                    loop = false;
                    break;
                default:
                    pos[0]--;
                    loop = false;
                    break;
            }
        }

        if (zeroDigitCount == 0 && digitLeftCount > 0 && decimalPos >= 0) {
            // Handle '###.###' and '###.' and '.###'
            var n = decimalPos;
            if (n == 0) { // Handle '.###'
                n++;
            }
            digitRightCount = digitLeftCount - n;
            digitLeftCount = n - 1;
            zeroDigitCount = 1;
        }

        // Do syntax checking on the digits.
        if (decimalPos < 0 && digitRightCount > 0 ||
            decimalPos >= 0 && (decimalPos < digitLeftCount ||
                decimalPos > digitLeftCount + zeroDigitCount) ||
            groupingCount == 0) {
            throw Error('Malformed pattern "' + pattern + '"');
        }
        var totalDigits = digitLeftCount + zeroDigitCount + digitRightCount;

        result.maxFracDigits = decimalPos >= 0 ? totalDigits - decimalPos : 0;
        if (decimalPos >= 0) {
            result.minFracDigits = digitLeftCount + zeroDigitCount - decimalPos;
            if (result.minFracDigits < 0) {
                result.minFracDigits = 0;
            }
        }

        // The effectiveDecimalPos is the position the decimal is at or would be at
        // if there is no decimal. Note that if decimalPos<0, then digitTotalCount ==
        // digitLeftCount + zeroDigitCount.
        var effectiveDecimalPos = decimalPos >= 0 ? decimalPos : totalDigits;
        result.minIntDigits = effectiveDecimalPos - digitLeftCount;
        if (result.useExpNotation) {
            result.maxIntDigits = digitLeftCount + result.minIntDigits;

            // in exponential display, we need to at least show something.
            if (result.maxFracDigits == 0 && result.minIntDigits == 0) {
                result.minIntDigits = 1;
            }
        }

        result.groupingSize = Math.max(0, groupingCount);
        result.groupingSize2 = Math.max(0, groupingCount2);
        result.decimalSeparatorAlwaysShown = decimalPos == 0 ||
            decimalPos == totalDigits;
    }

    /**
     * Formats a Number to produce a string.
     *
     * @param {number} number The Number to be formatted.
     * @return {string} The formatted number string.
     */
    format = function(number, options) {
        if (isNaN(number)) {
            return locales[currentLocale].symbols.nan;
        }

        options = options || {};
        options.currency = options.currency || locales[currentLocale].currency.local;

        var parts = [];
        // in icu code, it is commented that certain computation need to keep the
        // negative sign for 0.
        var isNegative = number < 0.0 || number == 0.0 && 1 / number < 0.0;

        parts.push(subformatAffix( isNegative ? currentPattern.negativePrefix : currentPattern.positivePrefix, options));

        if (!isFinite(number)) {
            parts.push(locales[currentLocale].symbols.infinity);
        } else {
            number = Math.abs(number);

            number *= currentPattern.multiplier;

            // If we are dealing with abbreviations, select the correct
            // abbreviation and manipulate the number
            if (options.abbr) {
                var abbr = '';
                // When using abbreviations, minimum requried decimals should be 0
                options.minFracDigits = 0;

                if (number >= Math.pow(10, 12)) {
                    // trillion
                    abbr = abbr + locales[currentLocale].abbreviations.trillion;
                    number = number / Math.pow(10, 12);
                } else if (number < Math.pow(10, 12) && number >= Math.pow(10, 9)) {
                    // billion
                    abbr = abbr + locales[currentLocale].abbreviations.billion;
                    number = number / Math.pow(10, 9);
                } else if (number < Math.pow(10, 9) && number >= Math.pow(10, 6)) {
                    // million
                    abbr = abbr + locales[currentLocale].abbreviations.million;
                    number = number / Math.pow(10, 6);
                } else if (number < Math.pow(10, 6) && number >= Math.pow(10, 3)) {
                    // thousand
                    abbr = abbr + locales[currentLocale].abbreviations.thousand;
                    number = number / Math.pow(10, 3);
                }

            }

            // Format the number part
            currentPattern.useExponentialNotation ?
                subformatExponential(number, parts) :
                subformatFixed(number, currentPattern.minIntDigits, options.minFracDigits, options.maxFracDigits, parts);

            // Append the abbreviation
            if (options.abbr && abbr) {
                parts.push(abbr);
            }

        }

        parts.push(subformatAffix(isNegative ? currentPattern.negativeSuffix : currentPattern.positiveSuffix, options));

        return parts.join('');
    }

    /**
     * Formats affix part using current locale settings.
     *
     * @param {string} affix Value need to be formated.
     * @return The formatted affix
     */
    subformatAffix = function(affix, options) {
        var len = affix.length,
            currency = options.currency,
            parts = [];
        if (!affix.length) return '';

        for (i = 0; i < len; i++) {
            var ch = affix.charAt(i);
            switch (ch) {
                case PERCENT:
                    parts.push(locales[currentLocale].symbols.percent);
                break;
                case PERMILLE:
                    parts.push(locales[currentLocale].symbols.permille);
                break;
                case CURRENCY:
                    var symbol = currency;
                    if (!options.globalStyle && locales[currentLocale].currency.symbols && locales[currentLocale].currency.symbols.hasOwnProperty(currency)) {
                        symbol = locales[currentLocale].currency.symbols[currency];
                    }
                    parts.push(symbol);
                break;

                default:
                    parts.push(ch);
                    break;
            }
        }

        return parts.join('');
    }

    /**
     * Formats a Number in fraction format.
     *
     * @param {number} number Value need to be formated.
     * @param {number} minIntDigits Minimum integer digits.
     * @param {Array} parts This array holds the pieces of formatted string.
     *     This function will add its formatted pieces to the array.
     */
    subformatFixed = function(number, minIntDigits, minFracDigits, maxFracDigits, parts) {
        minFracDigits = minFracDigits >= 0 ? minFracDigits : currentPattern.minFracDigits;
        maxFracDigits = maxFracDigits >= 0 ? maxFracDigits : currentPattern.maxFracDigits;
        if (maxFracDigits < minFracDigits) maxFracDigits = minFracDigits;

        // Round the number
        var power = Math.pow(10, maxFracDigits),
            shiftedNumber = Math.round(number * power),
            intValue = number,
            fracValue = 0;

        if (isFinite(shiftedNumber)) {
            intValue = Math.floor(shiftedNumber / power);
            fracValue = Math.floor(shiftedNumber - intValue * power);
        }

        var fractionPresent = minFracDigits > 0 || fracValue > 0,
            intPart = '',
            translatableInt = intValue;

        while (translatableInt > 1E20) {
            // here it goes beyond double precision, add '0' make it look better
            intPart = '0' + intPart;
            translatableInt = Math.round(translatableInt / 10);
        }
        intPart = translatableInt + intPart;

        var decimal = locales[currentLocale].symbols.decimal,
            grouping = locales[currentLocale].symbols.group,
            zeroCode = enforceAsciiDigits ?
                48 /* ascii '0' */ :
                locales[currentLocale].symbols.zero.charCodeAt(0),
            digitLen = intPart.length;

        if (intValue > 0 || minIntDigits > 0) {
            for (var i = digitLen; i < minIntDigits; i++) {
                parts.push(String.fromCharCode(zeroCode));
            }

            for (var i = 0; i < digitLen; i++) {
                parts.push(String.fromCharCode(zeroCode + intPart.charAt(i) * 1));
                var cPos = digitLen - i;

                if (cPos > 1 && currentPattern.groupingSize > 0) {
                    if (currentPattern.groupingSize2 > 0 && cPos > currentPattern.groupingSize &&
                        (cPos - currentPattern.groupingSize) % currentPattern.groupingSize2 == 1) {
                        parts.push(grouping);
                    } else if (currentPattern.groupingSize2 == 0 &&
                        cPos % currentPattern.groupingSize == 1) {
                        parts.push(grouping);
                    }
                }
            }
        } else if (!fractionPresent) {
            // If there is no fraction present, and we haven't printed any
            // integer digits, then print a zero.
            parts.push(String.fromCharCode(zeroCode));
        }

        // Output the decimal separator if we always do so.
        if (currentPattern.decimalSeparatorAlwaysShown || fractionPresent) {
            parts.push(decimal);
        }

        var fracPart = '' + (fracValue + power);
        var fracLen = fracPart.length;
        while (fracPart.charAt(fracLen - 1) == '0' &&
            fracLen > minFracDigits + 1) {
            fracLen--;
        }

        for (var i = 1; i < fracLen; i++) {
            parts.push(String.fromCharCode(zeroCode + fracPart.charAt(i) * 1));
        }
    }

    /**
     * Formats exponent part of a Number.
     *
     * @param {number} exponent Exponential value.
     * @param {Array.<string>} parts The array that holds the pieces of formatted
     *     string. This function will append more formatted pieces to the array.
     * @private
     */
    addExponentPart = function(exponent, parts) {
        parts.push(locales[currentLocale].symbols.exponential);

        if (exponent < 0) {
            exponent = -exponent;
            parts.push(locales[currentLocale].symbols.minus);
        } else if (currentPattern.useSignForPositiveExp) {
            parts.push(locales[currentLocale].symbols.plus);
        }

        var exponentDigits = '' + exponent,
            zeroChar = enforceAsciiDigits ? '0' : locales[currentLocale].symbols.zero;
        
        for (var i = exponentDigits.length; i < currentPattern.minExpDigits; i++) {
            parts.push(zeroChar);
        }
        parts.push(exponentDigits);
    }

    /**
     * Formats Number in exponential format.
     *
     * @param {number} number Value need to be formated.
     * @param {Array.<string>} parts The array that holds the pieces of formatted
     *     string. This function will append more formatted pieces to the array.
     * @private
     */
    subformatExponential = function(number, minFracDigits, maxFracDigits, parts) {
        if (number == 0.0) {
            subformatFixed(number, currentPattern.minIntDigits, minFracDigits, maxFracDigits, parts);
            addExponentPart(0, parts);
            return;
        }

        var exponent = Math.floor(Math.log(number) / Math.log(10));
        number /= Math.pow(10, exponent);

        var minIntDigits = currentPattern.minIntDigits;
        if (currentPattern.maxIntDigits > 1 &&
            currentPattern.maxIntDigits > currentPattern.minIntDigits) {
            // A repeating range is defined; adjust to it as follows.
            // If repeat == 3, we have 6,5,4=>3; 3,2,1=>0; 0,-1,-2=>-3;
            // -3,-4,-5=>-6, etc. This takes into account that the
            // exponent we have here is off by one from what we expect;
            // it is for the format 0.MMMMMx10^n.
            while ((exponent % currentPattern.maxIntDigits) != 0) {
                number *= 10;
                exponent--;
            }
            minIntDigits = 1;
        } else {
            // No repeating range is defined; use minimum integer digits.
            if (currentPattern.minIntDigits < 1) {
                exponent++;
                number /= 10;
            } else {
                exponent -= currentPattern.minIntDigits - 1;
                number *= Math.pow(10, currentPattern.minIntDigits - 1);
            }
        }
        subformatFixed(number, minIntDigits, parts);
        addExponentPart(exponent, parts);
    }

    /**
     * Parses text string to produce a Number.
     *
     * This method attempts to parse text starting from position "opt_pos" if it
     * is given. Otherwise the parse will start from the beginning of the text.
     * When opt_pos presents, opt_pos will be updated to the character next to where
     * parsing stops after the call. If an error occurs, opt_pos won't be updated.
     *
     * @param {string} text The string to be parsed.
     * @param {string} currency Optional currency.
     * @param {boolean} strict Whether to bail out when encountering an unknown character.
     * @return {number} Parsed number. This throws an error if the text cannot be
     *     parsed.
     */
    unformat = function(text, options) {
        var pos = 0,
            ret = NaN;

        // we don't want to handle 2 kind of spaces in parsing, normalize it to nbsp
        text = text.replace(/ /g, '\u00a0');

        // Check if we are dealing with positive or negative prefixes
        var positivePrefix = subformatAffix(currentPattern.positivePrefix, options),
            negativePrefix = subformatAffix(currentPattern.negativePrefix, options),
            gotPositive = text.indexOf(positivePrefix) == pos,
            gotNegative = text.indexOf(negativePrefix) == pos;

        // Check for the longest match of the two
        if (gotPositive && gotNegative) {
            if (positivePrefix.length > negativePrefix.length) {
                gotNegative = false;
            } else if (positivePrefix.length < negativePrefix.length) {
                gotPositive = false;
            }
        }

        if (gotPositive) {
            pos += positivePrefix.length;
        } else if (gotNegative) {
            pos += negativePrefix.length;
        }

        // Process digits or Infinity, find decimal position
        if (text.indexOf(locales[currentLocale].symbols.infinity, pos) == pos) {
            pos += locales[currentLocale].symbols.infinity.length;
            ret = Infinity;
        } else {
            ret = unformatNumber(text, pos, options.strict);
        }

        // Check if we are dealing with suffixes
        if (gotPositive) {
            var positiveSuffix = subformatAffix(currentPattern.positiveSuffix, options);
            if (!(text.indexOf(positiveSuffix, pos) == pos)) {
                return NaN;
            }
            pos += positiveSuffix.length;
        } else if (gotNegative) {
            var negativeSuffix = subformatAffix(currentPattern.negativeSuffix, options);
            if (!(text.indexOf(negativeSuffix, pos) == pos)) {
                return NaN;
            }
            pos += negativeSuffix.length;
        }

        return gotNegative ? -ret : ret;
    }

    /**
     * This function will parse a "localized" text into a Number. It needs to
     * handle locale specific decimal, grouping, exponent and digits.
     *
     * @param {string} text The text that need to be parsed.
     * @param {number} pos  In/out parsing position. In case of failure,
     *    pos value won't be changed.
     * @param {boolean} strict Whether to bail out when encountering an unknown character.
     * @return {number} Number value, or NaN if nothing can be parsed.
     * @private
     */
    unformatNumber = function(text, pos, strict) {
        var sawDecimal = false,
            sawExponent = false,
            sawDigit = false,
            scale = 1,
            decimal = locales[currentLocale].symbols.decimal,
            grouping = locales[currentLocale].symbols.group,
            expChar = locales[currentLocale].symbols.exponential;

        var normalizedText = '';
        for (; pos < text.length; pos++) {
            var ch = text.charAt(pos);
            var digit = getDigit(ch);
            if (digit >= 0 && digit <= 9) {
                normalizedText += digit;
                sawDigit = true;
            } else if (ch == decimal.charAt(0)) {
                if (sawDecimal || sawExponent) {
                    break;
                }
                normalizedText += '.';
                sawDecimal = true;
            } else if (ch == grouping.charAt(0) &&
                ('\u00a0' != grouping.charAt(0) ||
                    pos + 1 < text.length &&
                    getDigit(text.charAt(pos + 1)) >= 0)) {
                // Got a grouping character here. When grouping character is nbsp, need
                // to make sure the character following it is a digit.
                if (sawDecimal || sawExponent) {
                    break;
                }
                continue;
            } else if (ch == expChar.charAt(0)) {
                if (sawExponent) {
                    break;
                }
                normalizedText += 'E';
                sawExponent = true;
            } else if (ch == '+' || ch == '-') {
                normalizedText += ch;
            } else if (ch == locales[currentLocale].symbols.percent.charAt(0)) {
                if (scale != 1) {
                    break;
                }
                scale = 100;
                if (sawDigit) {
                    pos++; // eat this character if parse end here
                    break;
                }
            } else if (ch == locales[currentLocale].symbols.permille.charAt(0)) {
                if (scale != 1) {
                    break;
                }
                scale = 1000;
                if (sawDigit) {
                    pos++; // eat this character if parse end here
                    break;
                }
            } else {
                if (strict) break;
            }
        }
        return parseFloat(normalizedText) / scale;
    }

    /**
     * Returns the digit value of current character. The character could be either
     * '0' to '9', or a locale specific digit.
     *
     * @param {string} ch Character that represents a digit.
     * @return {number} The digit value, or -1 on error.
     */
    getDigit = function(ch) {
        var code = ch.charCodeAt(0);
        // between '0' to '9'
        if (48 <= code && code < 58) {
            return code - 48;
        } else {
            var zeroCode = locales[currentLocale].symbols.zero.charCodeAt(0);
            return zeroCode <= code && code < zeroCode + 10 ? code - zeroCode : -1;
        }
    }    

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            input = 0;
        } else if (!Number(input)) {
            input = numeral.fn.unformat(input);
        }

        return new Numeral(Number(input));
    };

    // version number
    numeral.version = VERSION;

    // compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // This function will load locales and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    numeral.locale = function (key, values) {
        if (!key) {
            return currentLocale;
        }

        if (key && !values) {
            if(!locales[key]) {
                throw new Error('Unknown locale : ' + key);
            }
            currentLocale = key;
        }

        if (values || !locales[key]) {
            loadLocale(key, values);
        }

        return numeral;
    };
    
    // This function provides access to the loaded locale data.  If
    // no arguments are passed in, it will simply return the current
    // global locale object.
    numeral.localeData = function (key) {
        if (!key) {
            return locales[currentLocale];
        }
        
        if (!locales[key]) {
            throw new Error('Unknown locale : ' + key);
        }
        
        return locales[key];
    };

    numeral.locale('en', {
        symbols: {
            decimal:        '.',
            group:          ',',
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
            currency:   '\u00A4#,##0.00',
            accounting: '\u00A4#,##0.00;(\u00A4#,##0.00)'
        },
        abbreviations: {
            thousand:   'k',
            million:    'm',
            billion:    'b',
            trillion:   't'
        },
        currency: {
            local: 'USD',
            symbols: { AUD: 'A$', BRL: 'R$', CAD: 'CA$', CNY: 'CN\u00A5', EUR: '\u20AC', GBP: '\u00A3', HKD: 'HK$', ILS: '\u20AA', INR: '\u20B9', JPY: '\u00A5', KRW: '\u20A9', MXN: 'MX$', NZD: 'NZ$', THB: '\u0E3F', TWD: 'NT$', USD: '$', VND: '\u20AB', XAF: 'FCFA', XCD: 'EC$', XOF: 'CFA', XPF: 'CFPF' }
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        }        
    });

    numeral.zeroFormat = function (format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numeral.defaultFormat = function (format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    /************************************
        Helpers
    ************************************/

    function loadLocale(key, values) {
        locales[key] = values;
    }

    function inArray(array, value) {
        for (i=0; i < array.length; i++) {
            if (array[i] == value) return true;
        }
        return false;
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
      Array.prototype.reduce = function(callback, opt_initialValue){
        'use strict';
        if (null === this || 'undefined' === typeof this) {
          // At the moment all modern browsers, that support strict mode, have
          // native implementation of Array.prototype.reduce. For instance, IE8
          // does not support strict mode, so this check is actually useless.
          throw new TypeError(
              'Array.prototype.reduce called on null or undefined');
        }
        if ('function' !== typeof callback) {
          throw new TypeError(callback + ' is not a function');
        }
        var index, value,
            length = this.length >>> 0,
            isValueSet = false;
        if (1 < arguments.length) {
          value = opt_initialValue;
          isValueSet = true;
        }
        for (index = 0; length > index; ++index) {
          if (this.hasOwnProperty(index)) {
            if (isValueSet) {
              value = callback(value, this[index], index, this);
            }
            else {
              value = this[index];
              isValueSet = true;
            }
          }
        }
        if (!isValueSet) {
          throw new TypeError('Reduce of empty array with no initial value');
        }
        return value;
      };
    }

    
    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function (prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
        return mp > mn ? mp : mn;
        }, -Infinity);
    }        


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (pattern, options) {
            pattern = pattern || 'decimal';
            options = options || {};

            // Look up pattern from locale
            if (pattern in locales[currentLocale].patterns) {
                pattern = locales[currentLocale].patterns[pattern];
            }

            // Apply pattern and format
            applyPattern(pattern);
            return format(this.value(), options);
        },

        abbr : function(pattern, options) {
            options = options || {};
            options.abbr = true;
            return this.format(pattern, options);
        },

        currency: function (currency, options) {
            currency = currency || locales[currentLocale].currency.local;
            options = options || {};

            if (!inArray( currencies, currency )) {
                throw Error('Unknown currency: ' + currency);
            }
            options.currency = currency;
            return this.format('currency', options);
        },

        percent: function (options) {
            return this.format('percent', options);
        },

        permille: function (options) {
            return this.format('percent', options);
        },

        bytes: function (options) {
            return this.format('bytes', options);
        },

        ordinal: function (options) {
            return this.format('ordinal', options);
        },

        unformat : function (input, options) {
            options = options || {};
            options.currency = options.currency || locales[currentLocale].currency.local;
            return unformat(input, currency);
        },

        setFormat: function(pattern) {
            applyPattern(pattern);
        },

        value : function () {
            return this._value;
        },

        valueOf : function () {
            return this._value;
        },

        set : function (value) {
            this._value = Number(value);
            return this;
        },

        add : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;            
            return this;
        },

        multiply : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) * (curr * corrFactor) /
                    (corrFactor * corrFactor);
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);            
            return this;
        },

        difference : function (value) {
            return Math.abs(numeral(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numeral
    ************************************/

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numeral;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `numeral` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['numeral'] = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }

}).call(this);

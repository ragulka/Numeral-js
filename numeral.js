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

    var root = this,
        numeral,
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

        // List of byte units
        byteUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],

        // List of abbreviations powers
        powers = {
            thousand:   Math.pow(10, 3),
            million:    Math.pow(10, 6),
            billion:    Math.pow(10, 9),
            trillion:   Math.pow(10, 12),
        },

        Big = root.Big,
        
        // Check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);

    // Require Big, if we're on the server, and it's not already present.
    if (!Big && (typeof require !== 'undefined')) Big = require('big.js');


    /************************************
        Constructor
    ************************************/

    // Numeral prototype object
    function Numeral (number) {
        this._value = new Big(number);
    }

    /************************************
        Parsing
    ************************************/

    /**
     * Apply provided pattern, result are stored in the patterns object.
     *
     * @param {string} pattern String pattern being applied.
     */
    function applyPattern (pattern) {
        pattern = pattern.replace(/ /g, '\u00a0');

        // Parse only if parsing results do not exist
        if (!patterns[pattern]) {
            var pos = [0],
                trunkStart,
                trunkLen,
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
            trunkStart = pos[0];
            parseTrunk(pattern, pos);
            trunkLen = pos[0] - trunkStart;
            result.positiveSuffix = parseAffix(pattern, pos);
            
            if (pos[0] < pattern.length &&
                pattern.charAt(pos[0]) === SEPARATOR) {
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
        currentPattern = pattern;
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
    function parseAffix (pattern, pos) {
        var affix = '',
            inQuote = false,
            len = pattern.length,
            result = patterns[pattern],
            ch;

        for (; pos[0] < len; pos[0]++) {
            ch = pattern.charAt(pos[0]);
            if (ch === QUOTE) {
                if (pos[0] + 1 < len &&
                    pattern.charAt(pos[0] + 1) === QUOTE) {
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
                        if (result.multiplier !== 1) {
                            throw new Error('Too many percent/permill');
                        }
                        result.multiplier = 100;
                        affix += ch;
                        break;
                    case PERMILLE:
                        if (result.multiplier !== 1) {
                            throw new Error('Too many percent/permill');
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
    function parseTrunk (pattern, pos) {
        var decimalPos = -1,
            digitLeftCount = 0,
            zeroDigitCount = 0,
            digitRightCount = 0,
            groupingCount = -1,
            groupingCount2 = -1,
            result = patterns[pattern],
            len = pattern.length,
            loop = true,
            ch,
            n,
            totalDigits,
            effectiveDecimalPos;

        for (loop = true; pos[0] < len && loop; pos[0]++) {
            ch = pattern.charAt(pos[0]);
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
                        throw new Error('Unexpected "0" in pattern "' + pattern + '"');
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
                        throw new Error('Multiple decimal separators in pattern "' +
                            pattern + '"');
                    }
                    decimalPos = digitLeftCount + zeroDigitCount + digitRightCount;
                    break;
                case EXPONENT:
                    if (result.useExpNotation) {
                        throw new Error('Multiple exponential symbols in pattern "' +
                            pattern + '"');
                    }
                    result.useExpNotation = true;
                    result.minExpDigits = 0;

                    // exponent pattern can have a optional '+'.
                    if ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) === PLUS) {
                        pos[0]++;
                        result.useSignForPositiveExp = true;
                    }

                    // Use lookahead to parse out the exponential part
                    // of the pattern, then jump into phase 2.
                    while ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) === ZERO) {
                        pos[0]++;
                        result.minExpDigits++;
                    }

                    if ((digitLeftCount + zeroDigitCount) < 1 ||
                        result.minExpDigits < 1) {
                        throw new Error('Malformed exponential pattern "' + pattern + '"');
                    }
                    loop = false;
                    break;
                default:
                    pos[0]--;
                    loop = false;
                    break;
            }
        }

        if (zeroDigitCount === 0 && digitLeftCount > 0 && decimalPos >= 0) {
            // Handle '###.###' and '###.' and '.###'
            n = decimalPos;
            if (n === 0) { // Handle '.###'
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
            groupingCount === 0) {
            throw new Error('Malformed pattern "' + pattern + '"');
        }
        totalDigits = digitLeftCount + zeroDigitCount + digitRightCount;

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
        effectiveDecimalPos = decimalPos >= 0 ? decimalPos : totalDigits;
        result.minIntDigits = effectiveDecimalPos - digitLeftCount;
        if (result.useExpNotation) {
            result.maxIntDigits = digitLeftCount + result.minIntDigits;

            // in exponential display, we need to at least show something.
            if (result.maxFracDigits === 0 && result.minIntDigits === 0) {
                result.minIntDigits = 1;
            }
        }

        result.groupingSize = Math.max(0, groupingCount);
        result.groupingSize2 = Math.max(0, groupingCount2);
        result.decimalSeparatorAlwaysShown = decimalPos === 0 || decimalPos === totalDigits;
    }

    /************************************
        Formatting
    ************************************/    

    /**
     * Formats a Number to produce a string.
     *
     * @param {number} number The Number to be formatted.
     * @return {string} The formatted number string.
     */
    function format (number, options) {
        var parts = [],
            isNegative,
            abbr = '',
            bytes = '',
            ordinal = '',
            power,
            min,
            max;

        if (isNaN(number)) {
            return locales[currentLocale].symbols.nan;
        }

        if (number === 0 && zeroFormat !== null) {
            return zeroFormat;
        }

        options = options || {};
        options.currency = options.currency || locales[currentLocale].currency.local;

        // in icu code, it is commented that certain computation need to keep the
        // negative sign for 0.
        isNegative = number < 0.0 || number === 0.0 && 1 / number < 0.0;

        parts.push(subformatAffix( isNegative ? patterns[currentPattern].negativePrefix : patterns[currentPattern].positivePrefix, options));

        if (!isFinite(number)) {
            parts.push(locales[currentLocale].symbols.infinity);
        } else {
            number = Math.abs(number);

            number *= patterns[currentPattern].multiplier;

            // If we are dealing with abbreviations, select the correct
            // abbreviation and manipulate the number
            if (options.abbr) {
                // When using abbreviations, minimum requried decimals should be 0
                options.minFracDigits = 0;

                if (number >= powers.trillion) {
                    // trillion
                    abbr = abbr + locales[currentLocale].abbreviations.trillion;
                    number = new Big( number ).divide( powers.trillion ).toString();
                } else if (number < powers.trillion && number >= powers.billion) {
                    // billion
                    abbr = abbr + locales[currentLocale].abbreviations.billion;
                    number = new Big( number ).divide( powers.billion ).toString();
                } else if (number < powers.billion && number >= powers.million) {
                    // million
                    abbr = abbr + locales[currentLocale].abbreviations.million;
                    number = new Big( number ).divide( powers.million ).toString();
                } else if (number < powers.million && number >= powers.thousand) {
                    // thousand
                    abbr = abbr + locales[currentLocale].abbreviations.thousand;
                    number = new Big( number ).divide( powers.thousand ).toString();
                }
            }

            // See if we are formatting bytes
            if (options.bytes) {
                for (power = 0; power <= byteUnits.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (number >= min && number < max) {
                        bytes = bytes + byteUnits[power];
                        if (min > 0) {
                            number = new Big( number ).divide( min ).toString();
                        }
                        break;
                    }
                }
            }

            // See if ordinal is wanted
            if (options.ordinal) {
                ordinal = '' + locales[currentLocale].ordinal(number);
            }

            // Format the number part
            if (patterns[currentPattern].useExponentialNotation) {
                subformatExponential(number, parts);
            } else {
                subformatFixed(number, patterns[currentPattern].minIntDigits, options.minFracDigits, options.maxFracDigits, parts);
            }

            // Append the abbreviation
            if (options.abbr && abbr)
                parts.push(abbr);

            // Append the byte unit
            if (options.bytes && bytes)
                parts.push(bytes);

            // Append the ordinal
            if (options.ordinal && ordinal)
                parts.push(ordinal);

        }

        parts.push(subformatAffix(isNegative ? patterns[currentPattern].negativeSuffix : patterns[currentPattern].positiveSuffix, options));

        return parts.join('');
    }

    /**
     * Formats affix part using current locale settings.
     *
     * @param {string} affix Value need to be formated.
     * @return The formatted affix
     */
    function subformatAffix (affix, options) {
        var len = affix.length,
            currency = options.currency,
            parts = [],
            ch,
            symbol,
            i;

        if (!affix.length) return '';

        for (i = 0; i < len; i++) {
            ch = affix.charAt(i);
            switch (ch) {
                case PERCENT:
                    parts.push(locales[currentLocale].symbols.percent);
                break;
                case PERMILLE:
                    parts.push(locales[currentLocale].symbols.permille);
                break;
                case CURRENCY:
                    symbol = currency;
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
    function subformatFixed (number, minIntDigits, minFracDigits, maxFracDigits, parts) {
        // Determine minimum and maximum digits
        minFracDigits = minFracDigits >= 0 ? minFracDigits : patterns[currentPattern].minFracDigits;
        maxFracDigits = maxFracDigits >= 0 ? maxFracDigits : patterns[currentPattern].maxFracDigits;
        if (maxFracDigits < minFracDigits) maxFracDigits = minFracDigits;

        // Round the number
        var power = Math.pow(10, maxFracDigits),
            shiftedNumber = new Big( number ).times( power ).round().toString(),
            intValue = number,
            fracValue = 0,
            fractionPresent,
            intPart = '',
            translatableInt = intValue,
            decimal = locales[currentLocale].symbols.decimal,
            grouping = locales[currentLocale].symbols.group,
            zeroCode = enforceAsciiDigits ? 48 /* ascii '0' */ : locales[currentLocale].symbols.zero.charCodeAt(0),
            digitLen,
            i,
            cPos,
            fracPart,
            fracLen;

        if (isFinite(shiftedNumber)) {
            intValue = Math.floor(new Big( shiftedNumber ).div( power ).toString());
            fracValue = Math.floor(new Big(shiftedNumber).minus( new Big(intValue).times(power) ).toString());
        }

        fractionPresent = minFracDigits > 0 || fracValue > 0;

        while (translatableInt > 1E20) {
            // here it goes beyond double precision, add '0' make it look better
            intPart = '0' + intPart;
            translatableInt = Math.round(new Big( translatableInt ).div( 10 ).toString());
        }

        intPart = translatableInt + intPart;
        digitLen = intPart.length;


        if (intValue > 0 || minIntDigits > 0) {
            for (i = digitLen; i < minIntDigits; i++) {
                parts.push(String.fromCharCode(zeroCode));
            }

            for (i = 0; i < digitLen; i++) {
                parts.push(String.fromCharCode(zeroCode + intPart.charAt(i) * 1));
                cPos = digitLen - i;

                if (cPos > 1 && patterns[currentPattern].groupingSize > 0) {
                    if (patterns[currentPattern].groupingSize2 > 0 && cPos > patterns[currentPattern].groupingSize &&
                        (cPos - patterns[currentPattern].groupingSize) % patterns[currentPattern].groupingSize2 === 1) {
                        parts.push(grouping);
                    } else if (patterns[currentPattern].groupingSize2 === 0 &&
                        cPos % patterns[currentPattern].groupingSize === 1) {
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
        if (patterns[currentPattern].decimalSeparatorAlwaysShown || fractionPresent) {
            parts.push(decimal);
        }

        fracPart = '' + (fracValue + power);
        fracLen = fracPart.length;
        while (fracPart.charAt(fracLen - 1) === '0' &&
            fracLen > minFracDigits + 1) {
            fracLen--;
        }

        for (i = 1; i < fracLen; i++) {
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
    function addExponentPart (exponent, parts) {
        var exponentDigits = '' + exponent,
            zeroChar = enforceAsciiDigits ? '0' : locales[currentLocale].symbols.zero,
            i;

        parts.push(locales[currentLocale].symbols.exponential);

        if (exponent < 0) {
            exponent = -exponent;
            parts.push(locales[currentLocale].symbols.minus);
        } else if (patterns[currentPattern].useSignForPositiveExp) {
            parts.push(locales[currentLocale].symbols.plus);
        }

        for (i = exponentDigits.length; i < patterns[currentPattern].minExpDigits; i++) {
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
    function subformatExponential (number, minFracDigits, maxFracDigits, parts) {
        if (number === 0.0) {
            subformatFixed(number, patterns[currentPattern].minIntDigits, minFracDigits, maxFracDigits, parts);
            addExponentPart(0, parts);
            return;
        }

        var exponent = Math.floor(Math.log(number) / Math.log(10)),
            minIntDigits = patterns[currentPattern].minIntDigits;
        
        number /= Math.pow(10, exponent);

        if (patterns[currentPattern].maxIntDigits > 1 &&
            patterns[currentPattern].maxIntDigits > patterns[currentPattern].minIntDigits) {
            // A repeating range is defined; adjust to it as follows.
            // If repeat == 3, we have 6,5,4=>3; 3,2,1=>0; 0,-1,-2=>-3;
            // -3,-4,-5=>-6, etc. This takes into account that the
            // exponent we have here is off by one from what we expect;
            // it is for the format 0.MMMMMx10^n.
            while ((exponent % patterns[currentPattern].maxIntDigits) !== 0) {
                number *= 10;
                exponent--;
            }
            minIntDigits = 1;
        } else {
            // No repeating range is defined; use minimum integer digits.
            if (patterns[currentPattern].minIntDigits < 1) {
                exponent++;
                number /= 10;
            } else {
                exponent -= patterns[currentPattern].minIntDigits - 1;
                number *= Math.pow(10, patterns[currentPattern].minIntDigits - 1);
            }
        }
        subformatFixed(number, minIntDigits, parts);
        addExponentPart(exponent, parts);
    }

    /**
     * Format seconds into H:m:s format
     *
     * @param {number} number Number (seconds) to be formatted.
     * @return {string} time Time-representation of the number.
     */
    function formatTime (number) {
        var hours = Math.floor(number/60/60),
            minutes = Math.floor((number - (hours * 60 * 60))/60),
            seconds = Math.round(number - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
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
    function unformat (text, options) {
        var pos = 0,
            ret = NaN,
            positivePrefix,
            negativePrefix,
            positiveSuffix,
            negativeSuffix,
            gotPositive,
            gotNegative;

        // We don't want to handle 2 kind of spaces in parsing, normalize it to nbsp
        text = typeof text !== 'undefined' ? String(text) : '';
        text = text.replace(/ /g, '\u00a0');

        // Check if we are dealing with time?
        if (text.indexOf(':') > -1) {
            return unformatTime(text);
        }

        if (text === zeroFormat) {
            return 0;
        }

        // Check if we are dealing with positive or negative prefixes
        positivePrefix = subformatAffix(patterns[currentPattern].positivePrefix, options);
        negativePrefix = subformatAffix(patterns[currentPattern].negativePrefix, options);
        gotPositive = text.indexOf(positivePrefix) === pos;
        gotNegative = text.indexOf(negativePrefix) === pos;

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
        if (text.indexOf(locales[currentLocale].symbols.infinity, pos) === pos) {
            pos += locales[currentLocale].symbols.infinity.length;
            ret = Infinity;
        } else {          
            ret = unformatNumber(text, pos, options.strict);
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
    function unformatNumber (text, pos, strict) {
        var sawDecimal = false,
            sawExponent = false,
            sawDigit = false,
            scale = 1,
            bytesMultiplier = 1,
            powerMultiplier = 1,
            decimal = locales[currentLocale].symbols.decimal,
            grouping = locales[currentLocale].symbols.group,
            expChar = locales[currentLocale].symbols.exponential,
            power,
            key,
            regex,
            normalizedText,
            ch,
            digit,
            result;

        // Check if we are dealing with bytes
        for (power = byteUnits.length; power >= 0; power--) {
            if (text.indexOf(byteUnits[power]) > -1) {
                bytesMultiplier = new Big(1024).pow(power).toFixed();
                break;
            }
        }

        // Check if we are dealing with abbreviations
        for (key in locales[currentLocale].abbreviations) {
            regex = new RegExp('[^a-zA-Z]' + locales[currentLocale].abbreviations[key] + '(?:\\)?)?$');
            if (text.match(regex)) {
                powerMultiplier = powers[key];
                break;
            }
        }       


        normalizedText = '';
        for (; pos < text.length; pos++) {
            ch = text.charAt(pos);
            digit = getDigit(ch);
            if (digit >= 0 && digit <= 9) {
                normalizedText += digit;
                sawDigit = true;
            } else if (ch === decimal.charAt(0)) {
                if (sawDecimal || sawExponent) {
                    break;
                }
                normalizedText += '.';
                sawDecimal = true;
            } else if (ch === grouping.charAt(0) &&
                ('\u00a0' !== grouping.charAt(0) ||
                    pos + 1 < text.length &&
                    getDigit(text.charAt(pos + 1)) >= 0)) {
                // Got a grouping character here. When grouping character is nbsp, need
                // to make sure the character following it is a digit.
                if (sawDecimal || sawExponent) {
                    break;
                }
                continue;
            } else if (ch === expChar.charAt(0)) {
                if (sawExponent) {
                    break;
                }
                normalizedText += 'E';
                sawExponent = true;
            } else if (ch === '+' || ch === '-') {
                normalizedText += ch;
            } else if (ch === locales[currentLocale].symbols.percent.charAt(0)) {
                if (scale !== 1) {
                    break;
                }
                scale = 100;
                if (sawDigit) {
                    pos++; // eat this character if parse end here
                    break;
                }
            } else if (ch === locales[currentLocale].symbols.permille.charAt(0)) {
                if (scale !== 1) {
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

        normalizedText = isNaN(normalizedText) || normalizedText.length < 1 ? 0 : normalizedText;
        result = new Big(normalizedText).div(scale).times(bytesMultiplier).times(powerMultiplier).toString();
        
        // Round up, if we are dealing with bytes
        if (bytesMultiplier > 1) { result = Math.ceil(result); }

        // Convert result to number
        return Number(result);
    }

    /**
     * Returns the digit value of current character. The character could be either
     * '0' to '9', or a locale specific digit.
     *
     * @param {string} ch Character that represents a digit.
     * @return {number} The digit value, or -1 on error.
     */
    function getDigit (ch) {
        var code = ch.charCodeAt(0),
            zeroCode = locales[currentLocale].symbols.zero.charCodeAt(0);
            
        // between '0' to '9'
        if (48 <= code && code < 58) {
            return code - 48;
        } else {
            return zeroCode <= code && code < zeroCode + 10 ? code - zeroCode : -1;
        }
    }

    /**
     * Parse formatted time into number (seconds)
     *
     * @param {string} text The text that needs to be parsed.
     * @return {number} seconds Parsed time in seconds.
     */
    function unformatTime (text) {
        var timeArray = text.split(':'),
            seconds = 0;
        // Turn hours and minutes into seconds and add them all up
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

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (!currentPattern) applyPattern(locales[currentLocale].patterns.decimal);

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

    // custom zero format
    numeral.zeroFormat = function(format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
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
            accounting: '\u00A4#,##0.00;(\u00A4#,##0.00)',
            bytes:      '#,##0.###B',
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

    /************************************
        Helpers
    ************************************/

    function loadLocale(key, values) {
        locales[key] = values;
    }

    function inArray(array, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === value) return true;
        }
        return false;
    }


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        // FORMATTING

        format : function (pattern, options) {
            var previousPattern = '' + currentPattern,
                result;

            pattern = pattern || (currentPattern || 'decimal');
            options = options || {};

            // Look up pattern from locale
            if (pattern in locales[currentLocale].patterns) {
                pattern = locales[currentLocale].patterns[pattern];
            }

            // Apply pattern and format
            applyPattern(pattern);
            result = format(this.value(), options);
            // Restore the previous pattern
            if (previousPattern) applyPattern(previousPattern);
            return result;
        },

        decimal: function (options) {
            return this.format('decimal', options);
        },

        currency: function (currency, options) {
            currency = currency || locales[currentLocale].currency.local;
            options = options || {};

            if (!inArray( currencies, currency )) {
                throw new Error('Unknown currency: ' + currency);
            }
            options.currency = currency;
            return this.format('currency', options);
        },

        percent: function (options) {
            return this.format('percent', options);
        },        

        ordinal: function (options) {
            options = options || {};
            options.ordinal = true;
            return this.format(null, options);
        },

        abbr : function(pattern, options) {
            options = options || {};
            options.abbr = true;
            return this.format(pattern, options);
        },

        bytes: function(options) {
            options = options || {};
            options.bytes = true;            
            return this.format(null, options);
        },

        time: function() {
            return formatTime( this.value() );
        },

        unformat : function (input, options) {
            options = options || {};
            options.currency = options.currency || locales[currentLocale].currency.local;
            return unformat(input, options);
        },

        setFormat: function(pattern) {
            applyPattern(pattern);
            return this;
        },

        zeroFormat: function(format) {
            numeral.zeroFormat(format);
            return this;
        },

        // VALUE

        set : function (value) {
            this._value = new Big(value);
            return this;
        }

    };

    // GETTING VALUE

    numeral.fn.toString = function() {
        return this._value.toString();
    };

    numeral.fn.value = numeral.fn.valueOf = function() {
        return Number(this.toString());
    };

    // MANIPULATIONS 

    numeral.fn.plus = numeral.fn.add = function (value) {
        this._value = this._value.plus(value);
        return this;
    };

    numeral.fn.minus = numeral.fn.subtract = function (value) {
        this._value = this._value.minus(value);
        return this;
    };

    numeral.fn.times = numeral.fn.multiply = function (value) {
        this._value = this._value.times(value);
        return this;
    };

    numeral.fn.div = numeral.fn.divide = function (value) {
        this._value = this._value.div(value);
        return this;
    };

    numeral.fn.pow = numeral.fn.power = function (value) {
        this._value = this._value.pow(value);
        return this;
    };

    numeral.fn.sqrt = function() {
        this._value = this._value.sqrt();
        return this;
    };

    numeral.fn.mod = numeral.fn.modulo = function (value) {
        this._value = this._value.mod(value);
        return this;
    };

    numeral.fn.round = function(dp, rm) {
        this._value = this._value.round(dp, rm);
        return this;
    };

    // UTILITY FUNCTIONS
    numeral.fn.diff = numeral.fn.difference = function (value) {
        return Number(this._value.minus(value).abs().toString());
    };

    numeral.fn.cmp = numeral.fn.compare = function(value) {
        return this._value.cmp(value);
    };

    numeral.fn.eq = numeral.fn.equal = function(value) {
        return this._value.eq(value);
    };

    numeral.fn.gt = function(value) {
        return this._value.gt(value);
    };

    numeral.fn.gte = function(value) {
        return this._value.gte(value);
    };

    numeral.fn.lt = function(value) {
        return this._value.lt(value);
    };

    numeral.fn.lte = function(value) {
        return this._value.lte(value);
    };

    numeral.fn.toFixed = function(dp) {
        return this._value.toFixed(dp);
    };

    numeral.fn.toPrecision = function(sd) {
        return this._value.toPrecision(sd);
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
        root.numeral = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }

}).call(this);

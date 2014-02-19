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
        root = this,
        
        // internal storage for locale config files
        locales = {},
        zeroFormat = null,
        
        // Internal storage for parsed pattern results
        patterns = {},

        // Check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

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

        Big = root.Big;

    // Require Big, if we're on the server, and it's not already present.
    if (!Big && (typeof require !== 'undefined')) { Big = require('big.js'); }


    /************************************
        Constructors
    ************************************/

    function Locale() {

    }

    // Numeral prototype object
    function Numeral (number) {
        this._value = new Big(number);
    }

    /************************************
        Parsing
    ************************************/

    /**
     * Get pattern definition for the provided pattern.
     *
     * @param {string} pattern String pattern.
     * @return {object} Pattern definition.
     */
    function getPatternDefiniton (pattern) {
        // If the definition does not exist, parse the pattern
        if (!patterns[pattern]) {
            return parsePattern(pattern);
        }

        return patterns[pattern];
    }

    /**
     * Parse provided pattern, result are stored in the patterns object.
     *
     * @param {string} pattern String pattern being applied.
     * @return {object} Pattern definition.
     */
    function parsePattern (pattern) {
        var pos = [0],
            trunkStart,
            trunkLen,
            result = patterns[pattern] = {
                key: pattern,
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
            result.negativePrefix = result.negativePrefix + result.positivePrefix;
            result.negativeSuffix += result.positiveSuffix;
        }

        return result;
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
    function format (number, config) {
        var pattern = config.pattern,
            locale = config.locale,
            parts = [],
            isNegative = number < 0.0 || number === 0.0 && 1 / number < 0.0, // in icu code, it is commented that certain computation need to keep the negative sign for 0
            abbr = '',
            bytes = '',
            ordinal = '',
            power,
            min,
            max;

        if (isNaN(number)) {
            return locale.symbols.nan;
        }

        if (number === 0 && zeroFormat !== null) {
            return zeroFormat;
        }

        if (pattern.maxFracDigits < pattern.minFracDigits) {
            pattern.maxFracDigits = pattern.minFracDigits;
        }

        parts.push(subformatAffix( isNegative ? pattern.negativePrefix : pattern.positivePrefix, config));

        if (!isFinite(number)) {
            parts.push(locale.symbols.infinity);
        } else {
            number = Math.abs(number);
            number *= config.pattern.multiplier;

            // If we are dealing with abbreviations, select the correct
            // abbreviation and manipulate the number
            if (config.abbr) {
                // When using abbreviations, minimum requried decimals should be 0
                config.pattern.minFracDigits = 0;
                if (number >= powers.trillion) {
                    // trillion
                    abbr = abbr + locale.abbreviations.trillion;
                    number = new Big( number ).div( powers.trillion ).toString();
                } else if (number < powers.trillion && number >= powers.billion) {
                    // billion
                    abbr = abbr + locale.abbreviations.billion;
                    number = new Big( number ).div( powers.billion ).toString();
                } else if (number < powers.billion && number >= powers.million) {
                    // million
                    abbr = abbr + locale.abbreviations.million;
                    number = new Big( number ).div( powers.million ).toString();
                } else if (number < powers.million && number >= powers.thousand) {
                    // thousand
                    abbr = abbr + locale.abbreviations.thousand;
                    number = new Big( number ).div( powers.thousand ).toString();
                }
            }

            // See if we are formatting bytes
            if (config.bytes) {
                for (power = 0; power <= byteUnits.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (number >= min && number < max) {
                        bytes = bytes + byteUnits[power];
                        if (min > 0) {
                            number = new Big( number ).div( min ).toString();
                        }
                        break;
                    }
                }
            }

            // See if ordinal is wanted
            if (config.ordinal) {
                ordinal = '' + locale.ordinal(number);
            }

            // Format the number part
            if (pattern.useExponentialNotation) {
                subformatExponential(number, parts, config);
            } else {
                subformatFixed(number, parts, config);
            }

            // Append the abbreviation
            if (config.abbr && abbr) {
                parts.push(abbr);
            }

            // Append the byte unit
            if (config.bytes && bytes) {
                parts.push(bytes);
            }

            // Append the ordinal
            if (config.ordinal && ordinal) {
                parts.push(ordinal);
            }

        }

        parts.push(subformatAffix(isNegative ? pattern.negativeSuffix : pattern.positiveSuffix, config));

        return parts.join('');
    }

    /**
     * Formats affix part using current locale settings.
     *
     * @param {string} affix Value need to be formated.
     * @return The formatted affix
     */
    function subformatAffix (affix, config) {
        var len = affix.length,
            currency = config.currency,
            locale = config.locale,
            parts = [],
            symbol,
            ch,
            i;

        if (!affix.length) {
            return '';
        }

        for (i = 0; i < len; i++) {
            ch = affix.charAt(i);
            switch (ch) {
                case PERCENT:
                    parts.push(locale.symbols.percent);
                break;
                case PERMILLE:
                    parts.push(locale.symbols.permille);
                break;
                case CURRENCY:
                    symbol = currency;
                    if (!config.globalStyle && locale.currency.symbols && locale.currency.symbols.hasOwnProperty(currency)) {
                        symbol = locale.currency.symbols[currency];
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
    function subformatFixed (number, parts, config) {
        var pattern = config.pattern,
            minIntDigits = pattern.minIntDigits,
            minFracDigits = pattern.minFracDigits,
            maxFracDigits = pattern.maxFracDigits,
            power = Math.pow(10, maxFracDigits),
            shiftedNumber = new Big( number ).times( power ).round().toString(),
            intValue = number,
            fracValue = 0,
            fractionPresent,
            intPart = '',
            translatableInt,
            decimal = config.locale.symbols.decimal,
            grouping = config.locale.symbols.group,
            zeroCode = enforceAsciiDigits ? 48 /* ascii '0' */ : config.locale.symbols.zero.charCodeAt(0),
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
        translatableInt = intValue;

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

                if (cPos > 1 && pattern.groupingSize > 0) {
                    if (pattern.groupingSize2 > 0 && cPos > pattern.groupingSize &&
                        (cPos - pattern.groupingSize) % pattern.groupingSize2 === 1) {
                        parts.push(grouping);
                    } else if (pattern.groupingSize2 === 0 &&
                        cPos % pattern.groupingSize === 1) {
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
        if (pattern.decimalSeparatorAlwaysShown || fractionPresent) {
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
    function addExponentPart (exponent, parts, config) {
        var symbols = config.locale.symbols,
            exponentDigits = '' + exponent,
            zeroChar = enforceAsciiDigits ? '0' : symbols.zero,
            i;

        parts.push(symbols.exponential);

        if (exponent < 0) {
            exponent = -exponent;
            parts.push(symbols.minus);
        } else if (config.pattern.useSignForPositiveExp) {
            parts.push(symbols.plus);
        }

        for (i = exponentDigits.length; i < config.pattern.minExpDigits; i++) {
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
    function subformatExponential (number, parts, config) {
        var minIntDigits = config.pattern.minIntDigits,
            maxIntDigits = config.pattern.maxIntDigits,
            minFracDigits = config.pattern.minFracDigits,
            maxFracDigits = config.pattern.maxFracDigits,
            exponent;

        if (number === 0.0) {
            subformatFixed(number, parts, config);
            addExponentPart(0, parts, config);
            return;
        }

        exponent = Math.floor(Math.log(number) / Math.log(10));
        number /= Math.pow(10, exponent);

        if (maxIntDigits > 1 &&
            maxIntDigits > minIntDigits) {
            // A repeating range is defined; adjust to it as follows.
            // If repeat == 3, we have 6,5,4=>3; 3,2,1=>0; 0,-1,-2=>-3;
            // -3,-4,-5=>-6, etc. This takes into account that the
            // exponent we have here is off by one from what we expect;
            // it is for the format 0.MMMMMx10^n.
            while ((exponent % maxIntDigits) !== 0) {
                number *= 10;
                exponent--;
            }
            minIntDigits = 1;
        } else {
            // No repeating range is defined; use minimum integer digits.
            if (minIntDigits < 1) {
                exponent++;
                number /= 10;
            } else {
                exponent -= minIntDigits - 1;
                number *= Math.pow(10, minIntDigits - 1);
            }
        }
        config.pattern.minIntDigits = minIntDigits;
        subformatFixed(number, parts, config);
        addExponentPart(exponent, parts, config);
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
    function unformat (text, config) {
        var pos = 0,
            ret = NaN,
            pattern = config.pattern,
            symbols = config.locale.symbols,
            positivePrefix,
            negativePrefix,
            positiveSuffix,
            negativeSuffix,
            gotPositive,
            gotNegative;

        // We don't want to handle 2 kind of spaces in parsing, normalize nbsp to whitespace
        text = text === undefined ? '' : String(text);
        text = text.replace(/\u00a0/g, ' ');


        // Check if we are dealing with time?
        if (text.indexOf(':') > -1) {
            return unformatTime(text);
        }

        if (text === zeroFormat) {
            return 0;
        }

        // Check if we are dealing with positive or negative prefixes
        positivePrefix = subformatAffix(pattern.positivePrefix, config);
        negativePrefix = subformatAffix(pattern.negativePrefix, config);
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
        if (text.indexOf(symbols.infinity, pos) === pos) {
            pos += symbols.infinity.length;
            ret = Infinity;
        } else {
            ret = unformatNumber(text, pos, config);
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
    function unformatNumber (text, pos, config) {
        var sawDecimal = false,
            sawExponent = false,
            sawDigit = false,
            scale = 1,
            bytesMultiplier = 1,
            powerMultiplier = 1,
            locale = config.locale,
            decimal = locale.symbols.decimal,
            grouping = locale.symbols.group,
            expChar = locale.symbols.exponential,
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
        for (key in locale.abbreviations) {
            regex = new RegExp('[^a-zA-Z]' + locale.abbreviations[key] + '(?:\\)?)?$');
            if (text.match(regex)) {
                powerMultiplier = powers[key];
                break;
            }
        }

        normalizedText = '';
        for (; pos < text.length; pos++) {
            ch = text.charAt(pos);
            digit = getDigit(ch, config);
            if (digit >= 0 && digit <= 9) {
                normalizedText += digit;
                sawDigit = true;
            } else if (ch === decimal.charAt(0)) {
                if (sawDecimal || sawExponent) {
                    break;
                }
                normalizedText += '.';
                sawDecimal = true;
            } else if (ch === grouping.charAt(0) && (' ' !== grouping.charAt(0) || pos + 1 < text.length && getDigit(text.charAt(pos + 1), config) >= 0)) {
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
            } else if (ch === locale.symbols.percent.charAt(0)) {
                if (scale !== 1) {
                    break;
                }
                scale = 100;
                if (sawDigit) {
                    pos++; // eat this character if parse end here
                    break;
                }
            } else if (ch === locale.symbols.permille.charAt(0)) {
                if (scale !== 1) {
                    break;
                }
                scale = 1000;
                if (sawDigit) {
                    pos++; // eat this character if parse end here
                    break;
                }
            } else {
                if (config.strict) {
                    break;
                }
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
    function getDigit (ch, config) {
        var code = ch.charCodeAt(0),
            zeroCode = config.locale.symbols.zero.charCodeAt(0);
            
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

    numeral = function (input, pattern, rm, locale, strict) {
        locale = locale || numeral.fn._locale.abbr;
        pattern = pattern || numeral.fn._pattern.key;

        this._locale = getLocaleDefinition(locale);
        this._pattern = getPatternDefiniton(pattern);
        this._rm = rm || Big['RM'];


        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (input === 0 || input === undefined) {
            input = 0;
        } else if (!Number(input)) {
            input = numeral.fn.unformat(input);
        }

        return new Numeral(Number(input));
    };

    // Version number
    numeral.version = VERSION;

    // Compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // Set rounding mode
    numeral.roundingMode = numeral.rm = function(rm) {
        if (rm === undefined) {
            return numeral.fn._rm;
        } else {
            numeral.fn._rm = rm;
            return this;
        }
    };

    // Set current pattern
    numeral.pattern = function(key) {
        if (key === undefined) {
            return numeral.fn._pattern;
        } else {
            numeral.fn._pattern = getPatternDefiniton(key);
            return this;
        }
    };

    // Set custom zero format
    numeral.zeroFormat = function(format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    // This function will load locales and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    numeral.locale = function (key, values) {
        var r;
        if (!key) {
            return numeral.fn._locale.abbr;
        }
        if (values) {
            loadLocale(normalizeLocale(key), values);
        } else if (values === null) {
            unloadLocale(key);
            key = 'en';
        } else if (!locales[key]) {
            getLocaleDefinition(key);
        }
        r = numeral.fn._locale = getLocaleDefinition(key);
        return r.abbr;
    };

    // returns locale data
    numeral.localeData = function (key) {
        if (key && key._locale && key._locale.abbr) {
            key = key._locale.abbr;
        }
        return getLocaleDefinition(key);
    };

    /************************************
        Helpers
    ************************************/

    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty('toString')) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty('valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function inArray (array, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === value) { return true; }
        }
        return false;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function setRoundingMode (rm) {
        Big['RM'] = !isNaN(Number(rm)) ? Number(rm) : Big['RM'];
        return Big['RM'];
    }

    // Helper function to call Big's function while setting the rounding
    // mode before and after getting the result
    function callBigFunc (num, method, arg) {
        var prevRm = Big['RM'],
            result;
        setRoundingMode(num._rm);
        result = num._value[method](arg);
        setRoundingMode(prevRm);
        return result;
    }

    // Helper function to prepare the environment (pattern and locale) 
    // before running a function
    function prepareEnv (num, pattern, config, cb) {
        var prevRm = Big['RM'],
            rm,
            result;

        // Setup basic configuration
        config = config || {};
        config.locale = num._locale;
        config.currency = config.currency || num._locale.currency.local;
        
        // Get pattern definition
        pattern = pattern || num._pattern.key;
        pattern = num._locale.patterns[pattern] ? num._locale.patterns[pattern] : pattern;
        config.pattern = getPatternDefiniton(pattern);

        // Set rounding mode
        rm = config.rm || num._rm;
        setRoundingMode(rm);

        // Run callback
        result = cb(config);

        // Restore previous settings
        setRoundingMode(prevRm);

        if (config.set) {
            num.set( result );
        }

        return result;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }


    /************************************
        Locales
    ************************************/

    // Loads a locale definition into the `locales` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the locale file module.  As a convenience,
    // this function also returns the locale values.
    function loadLocale(key, values) {
        values.abbr = key;
        locales[key] = values;
        return locales[key];
    }

    // Remove a locale from the `locales` cache. Mostly useful in tests.
    function unloadLocale(key) {
        delete locales[key];
    }

    // Determines which locale data to use and returns it.
    //
    // With no parameters, it will return the global locale.  If you
    // pass in a locale key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // numeral.locale.
    function getLocaleDefinition(key) {
        var i = 0, j, locale, next, split,
            get = function (k) {
                if (!locales[k] && hasModule) {
                    try {
                        require('./locales/' + k);
                    } catch (e) { }
                }
                return locales[k];
            };

        if (!key) {
            return numeral.fn._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = get(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        // pick the locale from the array
        // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        // substring from most specific to least, but move to the next array item if it's a more
        // specific variant than the current root
        while (i < key.length) {
            split = normalizeLocale(key[i]).split('-');
            j = split.length;
            next = normalizeLocale(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = get(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return numeral.fn._locale;
    }


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (pattern, options) {
            var self = this;
            // See peab liikuma kutsuvasse funktsiooni //            
            return prepareEnv(this, pattern, options, function (config) {
                return format(self.value(), config);
            });
        },

        unformat : function (input, options) {
            return prepareEnv(this, null, options, function (config) {
                return unformat(input, config);
            });
        },

        decimal: function (options) {
            return this.format('decimal', options);
        },

        currency: function (currency, options) {
            currency = currency || this._locale.currency.local;
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

        pattern: function(key) {
            if (key === undefined) {
                return this._pattern;
            } else {
                this._pattern = getPatternDefiniton(key);
                return this;
            }
        },

        zeroFormat: function(format) {
            numeral.zeroFormat(format);
            return this;
        },

        set : function (value) {
            this._value = new Big(value);
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            if (key === undefined) {
                return this._locale;
            } else {
                this._locale = getLocaleDefinition(key);
                return this;
            }
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
        rm = Number(rm) >= 0 ? Number(rm) : this._rm;
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

    numeral.fn.toFixed = function(decimals) {
        return callBigFunc(this, 'toFixed', decimals);
    };

    numeral.fn.toPrecision = function(digits) {
        return callBigFunc(this, 'toPrecision', digits);
    };

    numeral.fn.rm = numeral.fn.roundingMode = function(rm) {
        this._rm = !isNaN(Number(rm)) ? Number(rm) : this._rm;
        return this;
    };

    /************************************
        Default Locale & pattern
    ************************************/

    // Set default locale
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
            currency:   '¤#,##0.00',
            accounting: '¤#,##0.00;(¤#,##0.00)'
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
    numeral.pattern(locales['en'].patterns.decimal);

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
        global.numeral = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }

}).call(this);

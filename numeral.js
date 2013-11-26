/*!
 * numeral.js
 * version : 1.5.2
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

(function () {

    /************************************
        Embedded Big
    ************************************/

    (function ( global ) {
        'use strict';

        /*
          big.js v2.4.1
          A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
          https://github.com/MikeMcl/big.js/
          Copyright (c) 2012 Michael Mclaughlin <M8ch88l@gmail.com>
          MIT Expat Licence
        */

        /****************************** EDITABLE DEFAULTS **********************************/


        // The default values below must be integers within the stated ranges (inclusive).

        /*
         * The maximum number of decimal places of the results of methods involving
         * division, i.e. 'div' and 'sqrt', and 'pow' with negative exponents.
         */
        Big['DP'] = 20;                                  // 0 to MAX_DP

        /*
         * The rounding mode used when rounding to the above decimal places.
         *
         * 0 Round towards zero (i.e. truncate, no rounding).               (ROUND_DOWN)
         * 1 Round to nearest neighbour. If equidistant, round up.          (ROUND_HALF_UP)
         * 2 Round to nearest neighbour. If equidistant, to even neighbour. (ROUND_HALF_EVEN)
         * 3 Round away from zero.                                          (ROUND_UP)
         */
        Big['RM'] = 1;                                   // 0, 1, 2 or 3

            // The maximum value of 'Big.DP'.
        var MAX_DP = 1E6,                                // 0 to 1e+6

            // The maximum magnitude of the exponent argument to the 'pow' method.
            MAX_POWER = 1E6,                             // 1 to 1e+6

            /*
             * The exponent value at and beneath which 'toString' returns exponential notation.
             * Javascript's Number type: -7
             * -1e+6 is the minimum recommended exponent value of a Big.
             */
            TO_EXP_NEG = -7,                             // 0 to -1e+6

            /*
             * The exponent value at and above which 'toString' returns exponential notation.
             * Javascript's Number type: 21
             * 1e+6 is the maximum recommended exponent value of a Big, though there is no
             * enforcing or checking of a limit.
             */
            TO_EXP_POS = 21,                             // 0 to 1e+6


        /***********************************************************************************/

            P = Big.prototype,
            isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
            ONE = new Big(1);


        // CONSTRUCTOR


        /*
         * The exported function.
         * Create and return a new instance of a Big object.
         *
         * n {number|string|Big} A numeric value.
         */
        function Big( n ) {
            var i, j, nL,
                x = this;

            // Enable constructor usage without new.
            if ( !(x instanceof Big) ) {
                return new Big( n )
            }

            // Duplicate.
            if ( n instanceof Big ) {
                x['s'] = n['s'];
                x['e'] = n['e'];
                x['c'] = n['c'].slice();
                return
            }

            // Minus zero?
            if ( n === 0 && 1 / n < 0 ) {
                n = '-0'
            // Ensure 'n' is string and check validity.
            } else if ( !isValid.test(n += '') ) {
                throwErr( NaN )
            }

            // Determine sign.
            x['s'] = n.charAt(0) == '-' ? ( n = n.slice(1), -1 ) : 1;

            // Decimal point?
            if ( ( i = n.indexOf('.') ) > -1 ) {
                n = n.replace( '.', '' )
            }

            // Exponential form?
            if ( ( j = n.search(/e/i) ) > 0 ) {

                // Determine exponent.
                if ( i < 0 ) {
                    i = j
                }
                i += +n.slice( j + 1 );
                n = n.substring( 0, j )

            } else if ( i < 0 ) {

                // Integer.
                i = n.length
            }

            // Determine leading zeros.
            for ( j = 0; n.charAt(j) == '0'; j++ ) {
            }

            if ( j == ( nL = n.length ) ) {

                // Zero.
                x['c'] = [ x['e'] = 0 ]
            } else {

                // Determine trailing zeros.
                for ( ; n.charAt(--nL) == '0'; ) {
                }

                x['e'] = i - j - 1;
                x['c'] = [];

                // Convert string to array of digits (without leading and trailing zeros).
                for ( i = 0; j <= nL; x['c'][i++] = +n.charAt(j++) ) {
                }
            }
        }


        // PRIVATE FUNCTIONS


        /*
         * Round Big 'x' to a maximum of 'dp' decimal places using rounding mode
         * 'rm'. (Called by 'div', 'sqrt' and 'round'.)
         *
         * x {Big} The Big to round.
         * dp {number} Integer, 0 to MAX_DP inclusive.
         * rm {number} 0, 1, 2 or 3 ( ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP )
         * [more] {boolean} Whether the result of division was truncated.
         */
        function rnd( x, dp, rm, more ) {
            var xc = x['c'],
                i = x['e'] + dp + 1;

            if ( rm === 1 ) {
                // 'xc[i]' is the digit after the digit that may be rounded up.
                more = xc[i] >= 5
            } else if ( rm === 2 ) {
                more = xc[i] > 5 || xc[i] == 5 && ( more || i < 0 || xc[i + 1] != null || xc[i - 1] & 1 )
            } else if ( rm === 3 ) {
                more = more || xc[i] != null || i < 0
            } else if ( more = false, rm !== 0 ) {
                throwErr( '!Big.RM!' )
            }

            if ( i < 1 || !xc[0] ) {
                x['c'] = more
                  // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                  ? ( x['e'] = -dp, [1] )
                  // Zero.
                  : [ x['e'] = 0 ];
            } else {

                // Remove any digits after the required decimal places.
                xc.length = i--;

                // Round up?
                if ( more ) {

                    // Rounding up may mean the previous digit has to be rounded up and so on.
                    for ( ; ++xc[i] > 9; ) {
                        xc[i] = 0;

                        if ( !i-- ) {
                            ++x['e'];
                            xc.unshift(1)
                        }
                    }
                }

                // Remove trailing zeros.
                for ( i = xc.length; !xc[--i]; xc.pop() ) {
                }
            }

            return x
        }


        /*
         * Throw a BigError.
         *
         * message {string} The error message.
         */
        function throwErr( message ) {
            var err = new Error( message );
            err['name'] = 'BigError';

            throw err
        }


        // PROTOTYPE/INSTANCE METHODS


        /*
         * Return a new Big whose value is the absolute value of this Big.
         */
        P['abs'] = function () {
            var x = new Big(this);
            x['s'] = 1;

            return x
        };


        /*
         * Return
         * 1 if the value of this 'Big' is greater than the value of 'Big' 'y',
         * -1 if the value of this 'Big' is less than the value of 'Big' 'y', or
         * 0 if they have the same value.
        */
        P['cmp'] = function ( y ) {
            var xNeg,
                x = this,
                xc = x['c'],
                yc = ( y = new Big( y ) )['c'],
                i = x['s'],
                j = y['s'],
                k = x['e'],
                l = y['e'];

            // Either zero?
            if ( !xc[0] || !yc[0] ) {
                return !xc[0] ? !yc[0] ? 0 : -j : i
            }

            // Signs differ?
            if ( i != j ) {
                return i
            }
            xNeg = i < 0;

            // Compare exponents.
            if ( k != l ) {
                return k > l ^ xNeg ? 1 : -1
            }

            // Compare digit by digit.
            for ( i = -1,
                  j = ( k = xc.length ) < ( l = yc.length ) ? k : l;
                  ++i < j; ) {

                if ( xc[i] != yc[i] ) {
                    return xc[i] > yc[i] ^ xNeg ? 1 : -1
                }
            }

            // Compare lengths.
            return k == l ? 0 : k > l ^ xNeg ? 1 : -1
        };


        /*
         * Return a new Big whose value is the value of this Big divided by the
         * value of Big 'y', rounded, if necessary, to a maximum of 'Big.DP'
         * decimal places using rounding mode 'Big.RM'.
         */
        P['div'] = function ( y ) {
            var x = this,
                dvd = x['c'],
                dvs = ( y = new Big(y) )['c'],
                s = x['s'] == y['s'] ? 1 : -1,
                dp = Big['DP'];

            if ( dp !== ~~dp || dp < 0 || dp > MAX_DP ) {
                throwErr( '!Big.DP!' )
            }

            // Either 0?
            if ( !dvd[0] || !dvs[0] ) {

                // Both 0?
                if ( dvd[0] == dvs[0] ) {
                    throwErr( NaN )
                }

                // 'dvs' is 0?
                if ( !dvs[0] ) {
                    // Throw +-Infinity.
                    throwErr( s / 0 )
                }

                // 'dvd' is 0. Return +-0.
                return new Big( s * 0 )
            }

            var dvsL, dvsT, next, cmp, remI,
                dvsZ = dvs.slice(),
                dvdI = dvsL = dvs.length,
                dvdL = dvd.length,
                rem = dvd.slice( 0, dvsL ),
                remL = rem.length,
                quo = new Big(ONE),
                qc = quo['c'] = [],
                qi = 0,
                digits = dp + ( quo['e'] = x['e'] - y['e'] ) + 1;

            quo['s'] = s;
            s = digits < 0 ? 0 : digits;

            // Create version of divisor with leading zero.
            dvsZ.unshift(0);

            // Add zeros to make remainder as long as divisor.
            for ( ; remL++ < dvsL; rem.push(0) ) {
            }

            do {

                // 'next' is how many times the divisor goes into the current remainder.
                for ( next = 0; next < 10; next++ ) {

                    // Compare divisor and remainder.
                    if ( dvsL != ( remL = rem.length ) ) {
                        cmp = dvsL > remL ? 1 : -1
                    } else {
                        for ( remI = -1, cmp = 0; ++remI < dvsL; ) {

                            if ( dvs[remI] != rem[remI] ) {
                                cmp = dvs[remI] > rem[remI] ? 1 : -1;
                                break
                            }
                        }
                    }

                    // Subtract divisor from remainder (if divisor < remainder).
                    if ( cmp < 0 ) {

                        // Remainder cannot be more than one digit longer than divisor.
                        // Equalise lengths using divisor with extra leading zero?
                        for ( dvsT = remL == dvsL ? dvs : dvsZ; remL; ) {

                            if ( rem[--remL] < dvsT[remL] ) {

                                for ( remI = remL;
                                      remI && !rem[--remI];
                                      rem[remI] = 9 ) {
                                }
                                --rem[remI];
                                rem[remL] += 10
                            }
                            rem[remL] -= dvsT[remL]
                        }
                        for ( ; !rem[0]; rem.shift() ) {
                        }
                    } else {
                        break
                    }
                }

                // Add the 'next' digit to the result array.
                qc[qi++] = cmp ? next : ++next;

                // Update the remainder.
                rem[0] && cmp
                  ? ( rem[remL] = dvd[dvdI] || 0 )
                  : ( rem = [ dvd[dvdI] ] )

            } while ( ( dvdI++ < dvdL || rem[0] != null ) && s-- );

            // Leading zero? Do not remove if result is simply zero (qi == 1).
            if ( !qc[0] && qi != 1) {

                // There can't be more than one zero.
                qc.shift();
                quo['e']--;
            }

            // Round?
            if ( qi > digits ) {
                rnd( quo, dp, Big['RM'], rem[0] != null )
            }

            return quo
        }


        /*
         * Return true if the value of this Big is equal to the value of Big 'y',
         * otherwise returns false.
         */
        P['eq'] = function ( y ) {
            return !this.cmp( y )
        };


        /*
         * Return true if the value of this Big is greater than the value of Big 'y',
         * otherwise returns false.
         */
        P['gt'] = function ( y ) {
            return this.cmp( y ) > 0
        };


        /*
         * Return true if the value of this Big is greater than or equal to the
         * value of Big 'y', otherwise returns false.
         */
        P['gte'] = function ( y ) {
            return this.cmp( y ) > -1
        };


        /*
         * Return true if the value of this Big is less than the value of Big 'y',
         * otherwise returns false.
         */
        P['lt'] = function ( y ) {
            return this.cmp( y ) < 0
        };


        /*
         * Return true if the value of this Big is less than or equal to the value
         * of Big 'y', otherwise returns false.
         */
        P['lte'] = function ( y ) {
             return this.cmp( y ) < 1
        };


        /*
         * Return a new Big whose value is the value of this Big minus the value
         * of Big 'y'.
         */
        P['minus'] = function ( y ) {
            var d, i, j, xLTy,
                x = this,
                a = x['s'],
                b = ( y = new Big( y ) )['s'];

            // Signs differ?
            if ( a != b ) {
                return y['s'] = -b, x['plus'](y)
            }

            var xc = x['c'].slice(),
                xe = x['e'],
                yc = y['c'],
                ye = y['e'];

            // Either zero?
            if ( !xc[0] || !yc[0] ) {

                // 'y' is non-zero?
                return yc[0]
                  ? ( y['s'] = -b, y )
                  // 'x' is non-zero?
                  : new Big( xc[0]
                    ? x
                    // Both are zero.
                    : 0 )
            }

            // Determine which is the bigger number.
            // Prepend zeros to equalise exponents.
            if ( a = xe - ye ) {
                d = ( xLTy = a < 0 ) ? ( a = -a, xc ) : ( ye = xe, yc );

                for ( d.reverse(), b = a; b--; d.push(0) ) {
                }
                d.reverse()
            } else {

                // Exponents equal. Check digit by digit.
                j = ( ( xLTy = xc.length < yc.length ) ? xc : yc ).length;

                for ( a = b = 0; b < j; b++ ) {

                    if ( xc[b] != yc[b] ) {
                        xLTy = xc[b] < yc[b];
                        break
                    }
                }
            }

            // 'x' < 'y'? Point 'xc' to the array of the bigger number.
            if ( xLTy ) {
                d = xc, xc = yc, yc = d;
                y['s'] = -y['s']
            }

            /*
             * Append zeros to 'xc' if shorter. No need to add zeros to 'yc' if shorter
             * as subtraction only needs to start at 'yc.length'.
             */
            if ( ( b = -( ( j = xc.length ) - yc.length ) ) > 0 ) {

                for ( ; b--; xc[j++] = 0 ) {
                }
            }

            // Subtract 'yc' from 'xc'.
            for ( b = yc.length; b > a; ){

                if ( xc[--b] < yc[b] ) {

                    for ( i = b; i && !xc[--i]; xc[i] = 9 ) {
                    }
                    --xc[i];
                    xc[b] += 10
                }
                xc[b] -= yc[b]
            }

            // Remove trailing zeros.
            for ( ; xc[--j] == 0; xc.pop() ) {
            }

            // Remove leading zeros and adjust exponent accordingly.
            for ( ; xc[0] == 0; xc.shift(), --ye ) {
            }

            if ( !xc[0] ) {

                // n - n = +0
                y['s'] = 1;

                // Result must be zero.
                xc = [ye = 0]
            }

            return y['c'] = xc, y['e'] = ye, y
        };


        /*
         * Return a new Big whose value is the value of this Big modulo the
         * value of Big 'y'.
         */
        P['mod'] = function ( y ) {
            y = new Big( y );
            var c,
                x = this,
                i = x['s'],
                j = y['s'];

            if ( !y['c'][0] ) {
                throwErr( NaN )
            }

            x['s'] = y['s'] = 1;
            c = y.cmp( x ) == 1;
            x['s'] = i, y['s'] = j;

            return c
              ? new Big(x)
              : ( i = Big['DP'], j = Big['RM'],
                Big['DP'] = Big['RM'] = 0,
                  x = x['div'](y),
                    Big['DP'] = i, Big['RM'] = j,
                      this['minus']( x['times'](y) ) )
        };


        /*
         * Return a new Big whose value is the value of this Big plus the value
         * of Big 'y'.
         */
        P['plus'] = function ( y ) {
            var d,
                x = this,
                a = x['s'],
                b = ( y = new Big( y ) )['s'];

            // Signs differ?
            if ( a != b ) {
                return y['s'] = -b, x['minus'](y)
            }

            var xe = x['e'],
                xc = x['c'],
                ye = y['e'],
                yc = y['c'];

            // Either zero?
            if ( !xc[0] || !yc[0] ) {

                // 'y' is non-zero?
                return yc[0]
                  ? y
                  : new Big( xc[0]

                    // 'x' is non-zero?
                    ? x

                    // Both are zero. Return zero.
                    : a * 0 )
            }

            // Prepend zeros to equalise exponents.
            // Note: Faster to use reverse then do unshifts.
            if ( xc = xc.slice(), a = xe - ye ) {
                d = a > 0 ? ( ye = xe, yc ) : ( a = -a, xc );

                for ( d.reverse(); a--; d.push(0) ) {
                }
                d.reverse()
            }

            // Point 'xc' to the longer array.
            if ( xc.length - yc.length < 0 ) {
                d = yc, yc = xc, xc = d
            }

            /*
             * Only start adding at 'yc.length - 1' as the
             * further digits of 'xc' can be left as they are.
             */
            for ( a = yc.length, b = 0; a;
                 b = ( xc[--a] = xc[a] + yc[a] + b ) / 10 ^ 0, xc[a] %= 10 ) {
            }

            // No need to check for zero, as +x + +y != 0 && -x + -y != 0

            if ( b ) {
                xc.unshift(b);
                ++ye
            }

             // Remove trailing zeros.
            for ( a = xc.length; xc[--a] == 0; xc.pop() ) {
            }

            return y['c'] = xc, y['e'] = ye, y
        };


        /*
         * Return a Big whose value is the value of this Big raised to the power
         * 'e'. If 'e' is negative, round, if necessary, to a maximum of 'Big.DP'
         * decimal places using rounding mode 'Big.RM'.
         *
         * e {number} Integer, -MAX_POWER to MAX_POWER inclusive.
         */
        P['pow'] = function ( e ) {
            var isNeg = e < 0,
                x = new Big(this),
                y = ONE;

            if ( e !== ~~e || e < -MAX_POWER || e > MAX_POWER ) {
                throwErr( '!pow!' )
            }

            for ( e = isNeg ? -e : e; ; ) {

                if ( e & 1 ) {
                    y = y['times'](x)
                }
                e >>= 1;

                if ( !e ) {
                    break
                }
                x = x['times'](x)
            }

            return isNeg ? ONE['div'](y) : y
        };


        /*
         * Return a new Big whose value is the value of this Big rounded, if
         * necessary, to a maximum of 'dp' decimal places using rounding mode 'rm'.
         * If 'dp' is not specified, round to 0 decimal places.
         * If 'rm' is not specified, use 'Big.RM'.
         *
         * [dp] {number} Integer, 0 to MAX_DP inclusive.
         * [rm] 0, 1, 2 or 3 ( ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP )
         */
        P['round'] = function ( dp, rm ) {
            var x = new Big(this);

            if ( dp == null ) {
                dp = 0
            } else if ( dp !== ~~dp || dp < 0 || dp > MAX_DP ) {
                throwErr( '!round!' )
            }
            rnd( x, dp, rm == null ? Big['RM'] : rm );

            return x
        };


        /*
         * Return a new Big whose value is the square root of the value of this
         * Big, rounded, if necessary, to a maximum of 'Big.DP' decimal places
         * using rounding mode 'Big.RM'.
         */
        P['sqrt'] = function () {
            var estimate, r, approx,
                x = this,
                xc = x['c'],
                i = x['s'],
                e = x['e'],
                half = new Big('0.5');

            // Zero?
            if ( !xc[0] ) {
                return new Big(x)
            }

            // Negative?
            if ( i < 0 ) {
                throwErr( NaN )
            }

            // Estimate.
            i = Math.sqrt( x.toString() );

            // Math.sqrt underflow/overflow?
            // Pass 'x' to Math.sqrt as integer, then adjust the exponent of the result.
            if ( i == 0 || i == 1 / 0 ) {
                estimate = xc.join('');

                if ( !( estimate.length + e & 1 ) ) {
                    estimate += '0'
                }

                r = new Big( Math.sqrt(estimate).toString() );
                r['e'] = ( ( ( e + 1 ) / 2 ) | 0 ) - ( e < 0 || e & 1 )
            } else {
                r = new Big( i.toString() )
            }

            i = r['e'] + ( Big['DP'] += 4 );

            // Newton-Raphson loop.
            do {
                approx = r;
                r = half['times']( approx['plus']( x['div'](approx) ) )
            } while ( approx['c'].slice( 0, i ).join('') !==
                           r['c'].slice( 0, i ).join('') );

            rnd( r, Big['DP'] -= 4, Big['RM'] );

            return r
        };


        /*
         * Return a new Big whose value is the value of this Big times the value
         * of Big 'y'.
         */
        P['times'] = function ( y ) {
            var c,
                x = this,
                xc = x['c'],
                yc = ( y = new Big( y ) )['c'],
                a = xc.length,
                b = yc.length,
                i = x['e'],
                j = y['e'];

            y['s'] = x['s'] == y['s'] ? 1 : -1;

            // Either 0?
            if ( !xc[0] || !yc[0] ) {

                return new Big( y['s'] * 0 )
            }

            y['e'] = i + j;

            if ( a < b ) {
                c = xc, xc = yc, yc = c, j = a, a = b, b = j
            }

            for ( j = a + b, c = []; j--; c.push(0) ) {
            }

            // Multiply!
            for ( i = b - 1; i > -1; i-- ) {

                for ( b = 0, j = a + i;
                      j > i;
                      b = c[j] + yc[i] * xc[j - i - 1] + b,
                      c[j--] = b % 10 | 0,
                      b = b / 10 | 0 ) {
                }

                if ( b ) {
                    c[j] = ( c[j] + b ) % 10
                }
            }

            b && ++y['e'];

            // Remove any leading zero.
            !c[0] && c.shift();

            // Remove trailing zeros.
            for ( j = c.length; !c[--j]; c.pop() ) {
            }

            return y['c'] = c, y
        };


        /*
         * Return a string representing the value of this Big.
         * Return exponential notation if this Big has a positive exponent equal
         * to or greater than 'TO_EXP_POS', or a negative exponent equal to or less
         * than 'TO_EXP_NEG'.
         */
        P['toString'] = P['valueOf'] = function () {
            var x = this,
                e = x['e'],
                str = x['c'].join(''),
                strL = str.length;

            // Exponential notation?
            if ( e <= TO_EXP_NEG || e >= TO_EXP_POS ) {
                str = str.charAt(0) + ( strL > 1 ?  '.' + str.slice(1) : '' ) +
                  ( e < 0 ? 'e' : 'e+' ) + e

            // Negative exponent?
            } else if ( e < 0 ) {

            // Prepend zeros.
                for ( ; ++e; str = '0' + str ) {
                }
                str = '0.' + str

            // Positive exponent?
            } else if ( e > 0 ) {

                if ( ++e > strL ) {

                    // Append zeros.
                    for ( e -= strL; e-- ; str += '0' ) {
                    }
                } else if ( e < strL ) {
                    str = str.slice( 0, e ) + '.' + str.slice(e)
                }

            // Exponent zero.
            } else if ( strL > 1 ) {
                str = str.charAt(0) + '.' + str.slice(1)
            }

            // Avoid '-0'
            return x['s'] < 0 && x['c'][0] ? '-' + str : str
        };


        /*
         ***************************************************************************
         * If 'toExponential', 'toFixed', 'toPrecision' and 'format' are not
         * required they can safely be commented-out or deleted. No redundant code
         * will be left. 'format' is used only by 'toExponential', 'toFixed' and
         * 'toPrecision'.
         ***************************************************************************
         */


        /*
         * PRIVATE FUNCTION
         *
         * Return a string representing the value of Big 'x' in normal or
         * exponential notation to a fixed number of decimal places or significant
         * digits 'dp'.
         * (Called by toString, toExponential, toFixed and toPrecision.)
         *
         * x {Big} The Big to format.
         * dp {number} Integer, 0 to MAX_DP inclusive.
         * toE {number} undefined (toFixed), 1 (toExponential) or 2 (toPrecision).
         */
        function format( x, dp, toE ) {
            // The index (in normal notation) of the digit that may be rounded up.
            var i = dp - ( x = new Big(x) )['e'],
                c = x['c'];

            // Round?
            if ( c.length > ++dp ) {
                rnd( x, i, Big['RM'] )
            }

            // Recalculate 'i' if toFixed as 'x.e' may have changed if value rounded up.
            i = !c[0] ? i + 1 : toE ? dp : ( c = x['c'], x['e'] + i + 1 );

            // Append zeros?
            for ( ; c.length < i; c.push(0) ) {
            }
            i = x['e'];

            /*
             * 'toPrecision' returns exponential notation if the number of
             * significant digits specified is less than the number of digits
             * necessary to represent the integer part of the value in normal
             * notation.
             */
            return toE == 1 || toE == 2 && ( dp <= i || i <= TO_EXP_NEG )

                // Exponential notation.
                ? ( x['s'] < 0 && c[0] ? '-' : '' ) + ( c.length > 1
                  ? ( c.splice( 1, 0, '.' ), c.join('') )
                  : c[0] ) + ( i < 0 ? 'e' : 'e+' ) + i

                // Normal notation.
                : x.toString()
        }


        /*
         * Return a string representing the value of this Big in exponential
         * notation to 'dp' fixed decimal places and rounded, if necessary, using
         * 'Big.RM'.
         *
         * [dp] {number} Integer, 0 to MAX_DP inclusive.
         */
        P['toExponential'] = function ( dp ) {

            if ( dp == null ) {
                dp = this['c'].length - 1
            } else if ( dp !== ~~dp || dp < 0 || dp > MAX_DP ) {
                throwErr( '!toExp!' )
            }

            return format( this, dp, 1 )
        };


        /*
         * Return a string representing the value of this Big in normal notation
         * to 'dp' fixed decimal places and rounded, if necessary, using 'Big.RM'.
         *
         * [dp] {number} Integer, 0 to MAX_DP inclusive.
         */
        P['toFixed'] = function ( dp ) {
            var str,
                x = this,
                neg = TO_EXP_NEG,
                pos = TO_EXP_POS;

            TO_EXP_NEG = -( TO_EXP_POS = 1 / 0 );

            if ( dp == null ) {
                str = x.toString()
            } else if ( dp === ~~dp && dp >= 0 && dp <= MAX_DP ) {
                str = format( x, x['e'] + dp );

                // (-0).toFixed() is '0', but (-0.1).toFixed() is '-0'.
                // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
                if ( x['s'] < 0 && x['c'][0] && str.indexOf('-') < 0 ) {
                    // As e.g. -0.5 if rounded to -0 will cause toString to omit the minus sign.
                    str = '-' + str
                }
            }
            TO_EXP_NEG = neg, TO_EXP_POS = pos;

            if ( !str ) {
                throwErr( '!toFix!' )
            }

            return str
        };


        /*
         * Return a string representing the value of this Big to 'sd' significant
         * digits and rounded, if necessary, using 'Big.RM'. If 'sd' is less than
         * the number of digits necessary to represent the integer part of the value
         * in normal notation, then use exponential notation.
         *
         * sd {number} Integer, 1 to MAX_DP inclusive.
         */
        P['toPrecision'] = function ( sd ) {

            if ( sd == null ) {
                return this.toString()
            } else if ( sd !== ~~sd || sd < 1 || sd > MAX_DP ) {
                throwErr( '!toPre!' )
            }

            return format( this, sd - 1, 2 )
        };

        global['Big'] = Big
    })( this );

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

        // List of byte units
        byteUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],

        // List of abbreviations powers
        powers = {
            thousand:   Math.pow(10, 3),
            million:    Math.pow(10, 6),
            billion:    Math.pow(10, 9),
            trillion:   Math.pow(10, 12),
        },

        Big = this.Big,
        
        // Check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructor
    ************************************/

    // Numeral prototype object
    function Numeral (number) {
        this._value = new Big(number);
        if (!currentPattern) applyPattern(locales[currentLocale].patterns.decimal);
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
    function parseTrunk (pattern, pos) {
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
        if (isNaN(number)) {
            return locales[currentLocale].symbols.nan;
        }

        if (number === 0 && zeroFormat !== null) {
            return zeroFormat;
        }

        options = options || {};
        options.currency = options.currency || locales[currentLocale].currency.local;

        var parts = [];
        // in icu code, it is commented that certain computation need to keep the
        // negative sign for 0.
        var isNegative = number < 0.0 || number == 0.0 && 1 / number < 0.0;

        parts.push(subformatAffix( isNegative ? patterns[currentPattern].negativePrefix : patterns[currentPattern].positivePrefix, options));

        if (!isFinite(number)) {
            parts.push(locales[currentLocale].symbols.infinity);
        } else {
            number = Math.abs(number);

            number *= patterns[currentPattern].multiplier;

            // If we are dealing with abbreviations, select the correct
            // abbreviation and manipulate the number
            if (options.abbr) {
                var abbr = '';
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
                var bytes = '';
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
                var ordinal = '' + locales[currentLocale].ordinal(number);
            }

            // Format the number part
            patterns[currentPattern].useExponentialNotation ?
                subformatExponential(number, parts) :
                subformatFixed(number, patterns[currentPattern].minIntDigits, options.minFracDigits, options.maxFracDigits, parts);

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
    function subformatFixed (number, minIntDigits, minFracDigits, maxFracDigits, parts) {
        minFracDigits = minFracDigits >= 0 ? minFracDigits : patterns[currentPattern].minFracDigits;
        maxFracDigits = maxFracDigits >= 0 ? maxFracDigits : patterns[currentPattern].maxFracDigits;
        if (maxFracDigits < minFracDigits) maxFracDigits = minFracDigits;

        // Round the number
        var power = Math.pow(10, maxFracDigits),
            shiftedNumber = new Big( number ).times( power ).round().toString(),
            intValue = number,
            fracValue = 0;

        if (isFinite(shiftedNumber)) {
            intValue = Math.floor(new Big( shiftedNumber ).div( power ).toString());
            fracValue = Math.floor(new Big(shiftedNumber).minus( new Big(intValue).times(power) ).toString());
        }

        var fractionPresent = minFracDigits > 0 || fracValue > 0,
            intPart = '',
            translatableInt = intValue;

        while (translatableInt > 1E20) {
            // here it goes beyond double precision, add '0' make it look better
            intPart = '0' + intPart;
            translatableInt = Math.round(new Big( translatableInt ).div( 10 ).toString());
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

                if (cPos > 1 && patterns[currentPattern].groupingSize > 0) {
                    if (patterns[currentPattern].groupingSize2 > 0 && cPos > patterns[currentPattern].groupingSize &&
                        (cPos - patterns[currentPattern].groupingSize) % patterns[currentPattern].groupingSize2 == 1) {
                        parts.push(grouping);
                    } else if (patterns[currentPattern].groupingSize2 == 0 &&
                        cPos % patterns[currentPattern].groupingSize == 1) {
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
    function addExponentPart (exponent, parts) {
        parts.push(locales[currentLocale].symbols.exponential);

        if (exponent < 0) {
            exponent = -exponent;
            parts.push(locales[currentLocale].symbols.minus);
        } else if (patterns[currentPattern].useSignForPositiveExp) {
            parts.push(locales[currentLocale].symbols.plus);
        }

        var exponentDigits = '' + exponent,
            zeroChar = enforceAsciiDigits ? '0' : locales[currentLocale].symbols.zero;
        
        for (var i = exponentDigits.length; i < patterns[currentPattern].minExpDigits; i++) {
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
        if (number == 0.0) {
            subformatFixed(number, patterns[currentPattern].minIntDigits, minFracDigits, maxFracDigits, parts);
            addExponentPart(0, parts);
            return;
        }

        var exponent = Math.floor(Math.log(number) / Math.log(10));
        number /= Math.pow(10, exponent);

        var minIntDigits = patterns[currentPattern].minIntDigits;
        if (patterns[currentPattern].maxIntDigits > 1 &&
            patterns[currentPattern].maxIntDigits > patterns[currentPattern].minIntDigits) {
            // A repeating range is defined; adjust to it as follows.
            // If repeat == 3, we have 6,5,4=>3; 3,2,1=>0; 0,-1,-2=>-3;
            // -3,-4,-5=>-6, etc. This takes into account that the
            // exponent we have here is off by one from what we expect;
            // it is for the format 0.MMMMMx10^n.
            while ((exponent % patterns[currentPattern].maxIntDigits) != 0) {
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
            ret = NaN;

        // We don't want to handle 2 kind of spaces in parsing, normalize it to nbsp
        text = text.replace(/ /g, '\u00a0');

        // Check if we are dealing with time?
        if (text.indexOf(':') > -1) {
            return unformatTime(text);
        }

        if (text === zeroFormat) {
            return 0;
        }

        // Check if we are dealing with positive or negative prefixes
        var positivePrefix = subformatAffix(patterns[currentPattern].positivePrefix, options),
            negativePrefix = subformatAffix(patterns[currentPattern].negativePrefix, options),
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
            var positiveSuffix = subformatAffix(patterns[currentPattern].positiveSuffix, options);
            if (!(text.indexOf(positiveSuffix, pos) == pos)) {
                return NaN;
            }
            pos += positiveSuffix.length;
        } else if (gotNegative) {
            var negativeSuffix = subformatAffix(patterns[currentPattern].negativeSuffix, options);
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
    function unformatNumber (text, pos, strict) {
        var sawDecimal = false,
            sawExponent = false,
            sawDigit = false,
            scale = 1,
            bytesMultiplier = 1,
            powerMultiplier = 1,
            decimal = locales[currentLocale].symbols.decimal,
            grouping = locales[currentLocale].symbols.group,
            expChar = locales[currentLocale].symbols.exponential;

        // Check if we are dealing with bytes
        for (var power = 0; power <= byteUnits.length; power++) {
            if (text.indexOf(byteUnits[power]) > -1) {
                bytesMultiplier = Math.pow(1024, power + 1);
                break;
            }
        }

        // Check if we are dealing with abbreviations
        for (var key in locales[currentLocale].abbreviations) {
            var regex = new RegExp('[^a-zA-Z]' + locales[currentLocale].abbreviations[key] + '(?:\\)?)?$');
            if (text.match(regex)) {
                powerMultiplier = powers[key];
                break;
            }
        }       


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
        return Number(new Big(parseFloat(normalizedText)).div(scale).times(bytesMultiplier).times(powerMultiplier).toString());
    }

    /**
     * Returns the digit value of current character. The character could be either
     * '0' to '9', or a locale specific digit.
     *
     * @param {string} ch Character that represents a digit.
     * @return {number} The digit value, or -1 on error.
     */
    function getDigit (ch) {
        var code = ch.charCodeAt(0);
        // between '0' to '9'
        if (48 <= code && code < 58) {
            return code - 48;
        } else {
            var zeroCode = locales[currentLocale].symbols.zero.charCodeAt(0);
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
        for (i=0; i < array.length; i++) {
            if (array[i] == value) return true;
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

        format : function (pattern, options) {
            pattern = pattern || (currentPattern || 'decimal');
            options = options || {};

            // Look up pattern from locale
            if (pattern in locales[currentLocale].patterns) {
                pattern = locales[currentLocale].patterns[pattern];
            }

            var previousPattern = '' + currentPattern;
            // Apply pattern and format
            applyPattern(pattern);
            var result = format(this.value(), options);
            // Restore the previous pattern
            applyPattern(previousPattern);
            return result;
        },

        decimal: function (options) {
            return this.format('decimal', options);
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
        },

        zeroFormat: function(format) {
            zeroFormat = typeof(format) === 'string' ? format : null;
        },

        value : function () {
            return this._value.toString();
        },

        valueOf : function () {
            return this.value();
        },

        set : function (value) {
            this._value = new Big(value);
            return this;
        },

        add : function (value) {
            this._value = this._value.plus(value);
            return this;
        },

        subtract : function (value) {
            this._value = this._value.minus(value);
            return this;
        },

        multiply : function (value) {
            this._value = this._value.times(value);
            return this;
        },

        divide : function (value) {
            this._value = this._value.div(value);
            return this;
        },

        difference : function (value) {
            return this._value.minus(value).abs().toString();
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

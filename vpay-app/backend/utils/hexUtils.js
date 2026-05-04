/**
 * hexUtils.js
 * Converts account numbers to/from hex for DB2 storage.
 *
 * Example:
 *   encode('ACC0000001') → '41434330303030303031'
 *   decode('41434330303030303031') → 'ACC0000001'
 */

/**
 * Encode a plain account number string to its ASCII hex representation.
 * @param {string} acctNum  e.g. 'ACC0000001'
 * @returns {string}        e.g. '41434330303030303031'
 */
function encodeAcctNum(acctNum) {
    return Buffer.from(acctNum, 'ascii').toString('hex').toUpperCase();
}

/**
 * Decode a hex-encoded account number back to the original string.
 * @param {string} hexAcct  e.g. '41434330303030303031'
 * @returns {string}        e.g. 'ACC0000001'
 */
function decodeAcctNum(hexAcct) {
    // Strip any trailing spaces that DB2 CHAR columns may pad
    return Buffer.from(hexAcct.trim(), 'hex').toString('ascii').trim();
}

/**
 * Check whether a string looks like a hex-encoded account number
 * (even length, only hex chars, longer than a normal ACC... number).
 * @param {string} str
 * @returns {boolean}
 */
function isHexEncoded(str) {
    return /^[0-9A-Fa-f]+$/.test(str) && str.length > 10;
}

module.exports = { encodeAcctNum, decodeAcctNum, isHexEncoded };
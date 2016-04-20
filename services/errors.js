/*
 * errors.js - Declares a module for handling/sending error info
 */

/**
 * Sends function info to client and throws an exception, which MUST be caught.
 * Use this for FATAL errors that need to stop execution.
 * 
 * @param {Object} res - The response object to be used to send the error message
 * @param {Number} status - HTTP status code (number)
 * @param {String} code - The Error code
 */
function send(res, status, code)
{
	res.status(status).end(code);
	throw code;
}
/**
 * Same as send, but does not throw an exception
 * 
 * @param {Object} res - The response object to be used to send the error message
 * @param {Number} status - HTTP status code (number)
 * @param {String} code - The Error code
 */
function sendQuiet(res, status, code)
{
	res.status(status).end(code);
}

module.exports.send = send;
module.exports.sendQuiet = sendQuiet;
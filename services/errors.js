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
/**
 * Sends an error with a verbose array of error messages; does not throw an exception
 * 
 * @param {Object} res - The response object to be used to send the error message
 * @param {Number} status - HTTP status code
 * @param {String} code - The Error code
 * @param {Array} errs - List of error messages
 */
function sendVerbose(res, status, code, errs)
{
	res.status(status).json(
	{
		"code": code,
		"errors": errs
	});
}
/**
 * Extracts error message array from a Mongoose-generated error object
 * @param {Object} errs - The error object from Mongoose
 */
function extractMongo(errs)
{
	var msgs = [];
	if (errs.errors) // Make sure this is really a Mongoose validation error
	{
		// For each error
		for(var k in errs.errors)  
		{
			msgs.push(errs.errors[k].message);
		}
	}
	return msgs;
}

module.exports.send = send;
module.exports.sendQuiet = sendQuiet;
module.exports.sendVerbose = sendVerbose;
module.exports.extractMongo = extractMongo;
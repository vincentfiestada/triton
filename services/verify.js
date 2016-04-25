/*
 * verify.js - Middleware for verifying Auth Tokens
 */

var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var errors = require("./errors"); // For sending errors

/*
 * Route middleware to verify an authentication token
 *	 - All routes & middleware that follow this one are protected/require
 */
module.exports = function(req, res, next) // Export this middleware so it can be used by other modules
{
	// The token should be in the header `x-access-token`
	var token = req.headers['x-access-token'];
	if (token) // Verify the token
	{
		// verifies secret and checks expiration date
		jwt.verify(token, process.env.trident || "Riptide!", function(err, decoded)
		{
			if (err || !decoded) // Verification not successful
			{
				errors.sendQuiet(res, 401, "ERR_TOKEN_UNVERIFIED");
			}
			else
			{
				// if everything is good, save to request for use in other routes
				req.vtoken = decoded;
				return next(); // Move on to next middleware
			}
		});
	}
	else // if there is no token
	{
		errors.sendQuiet(res, 400, "ERR_TOKEN_NIL");
	}
};

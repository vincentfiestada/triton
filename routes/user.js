/*
 * user.js - User API routes
 */

var express = require("express");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt-nodejs");
var verify = require("../services/verify");
var errors = require("../services/errors");
var User = require("../models/user"); // Mongoose models
var u = express.Router();
// use body parser so we can get info from POST and/or URL parameters
u.use(bodyParser.urlencoded(
{
	"extended": false
}));
u.use(bodyParser.json());

/*	POST /api/user/
 *	Register a new user account
 */
u.post("/", function(req, res)
{
	try
	{
		// Check if the password is valid
		if (!req.body.password || req.body.password.length < 8)
		{
			errors.send(res, 400, "ERR_PASS_LEN");
		}
		if (req.body.password != req.body.password2) // Check if password re-type matches
		{
			errors.send(res, 400, "ERR_PASS_MISMATCH");
		}
		bcrypt.genSalt(10, function(err, salt) // Otherwise, Password is valid; encrypt it
		{
			try
			{
				if (err)
				{
					errors.send(res, 500, "ERR_GEN_SALT");
				}
			}
			catch(except)
			{
				console.log("<E> POST /user/new > bcrypt.genSalt: %s", except);
			}
			bcrypt.hash(req.body.password, salt, null, function(err, hash)
			{
				try
				{
					if (err)
					{
						errors.send(res, 500, "ERR_GEN_HASH");
					}
					var newUser = new User( // Create a new user
					{
						"username": req.body.username,
						"password": hash,
						"email": req.body.email,
						"devices": [],
					});
					newUser.save(function(err) // save the sample user
					{
						if (err)
						{
							var errs = []; // Form a list of errors
							for (var k in err.errors)
							{
								errs.push(err.errors[k].message);
							}
							// Add 'unique' validation error (error 11000)
							if (err.code && err.code === 11000)
							{
								errs.push("The username or email you provided are already taken.");
							}
							errors.sendVerbose(res, 400, "ERR_USER_CREATE", errs);
						}
						else
						{
							console.log('<+> A new user account has been created.');
							res.sendStatus(200);
						}
					});
				}
				catch(e)
				{
					console.log("<E> POST /api/user/ > bcrypt.hash: %s", e);
				}
			});
		});
	}
	catch(e)
	{
		console.log("<E> POST /api/user/: %s", e);
	}
});

// Protected Routes (require login)

u.use(verify); // Use auth token verification middleware
/*
 * GET /api/user/
 *	- Returns information about the current logged-in user
 *	- Authorization token is required
 */
u.get("/", function(req, res)
{
	User.findOne( // Find the user using the id in the token
	{
		"_id": req.vtoken.id
	},
	{
		"_id": 0,
		"username": 1,
		"email": 1
	},
	function(err, user)
	{
		try
		{
			if (err)
			{
				errors.send(res, 500, "ERR_DB_USER");
			}
			if (!user)
			{
				// Red Flag: User not found despite verified auth token
				console.log("<E> RED FLAG !!! An authenticated user account could not be found. Username: `%s`", req.vtoken.username);
				errors.send(res, 404, "ERR_USER_NA");
			}
			res.send(user);
		}
		catch(e)
		{
			console.log("<E> GET /api/user/: %s", e);
		}
	});
});
module.exports = u;
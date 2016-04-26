/*
 * login.js - Obtain an auth token for an existing user
 */

var express = require("express");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("jsonwebtoken");
var errors = require("../services/errors");
var User = require("../models/user"); // Mongoose models
var login = express.Router();
// use body parser so we can get info from POST and/or URL parameters
login.use(bodyParser.urlencoded(
{
	"extended": false
}));
login.use(bodyParser.json());

/*	
 * POST /api/login
 *	Login to an existing account and get a signed auth token
 */
login.post("/", function(req, res)
{
	User.findOne( // find the user
	{
		"username": req.body.username
	},
	function(err, user)
	{
		try
		{
			if (err) // Mongoose returned errors
			{
				errors.send(res, 500, "ERR_DB_USER");
			}
			else if (!user) // If username does not exist
			{
				errors.sendQuiet(res, 401, "ERR_USER_DNE");
			}
			//Otherwise, username match found; Check if the password matches
			bcrypt.compare(req.body.password, user.password, function(err, match) 
			{
				try
				{
					if (match !== true) // Password does not match
					{
						errors.sendQuiet(res, 401, "ERR_PASS_WRONG");
					}
					else // Password matches! Credentials are valid
					{
						// Create a signed JSON Web Token and send it to the client
						var token = jwt.sign(
						{
							"username": user.username,
							"id": user._id
						},
						// Encryption key (should be changed regularly)
						process.env.trident || "Riptide!",
						{
							"expiresIn": 2592000, // expires in 30 days
							"issuer": "poseidon"
						});
						res.json( // Send auth token to client
						{
							"token": token,
							"username": user.username
						});
					}
				}
				catch(e)
				{
					console.log("<E> POST /api/login > bcrypt.compare: %s", e);
				}
			});
		}
		catch(e)
		{
			console.log("<E> POST /api/login: %s", e);
		}
	});
});

module.exports = login;
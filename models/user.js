/*
 * user.js - Model for User docs
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Child documents
var Device = require('./device');

// Username must begin with a letter and can contain alphanumeric characters or _ or .
var username_regexp = /^[a-z]([a-z0-9_\.])*$/i;
// Emails address regexp
var email_regexp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model("User", new Schema(
{
	// Username must be alphanumeric, no spaces, underscore allowed [A-Za-z0-9_]
	// Username is trimmed. (No spaces before or after)
	"username": 
	{ 
		"type": String, 
		"required": [true, "Username is required"], 
		"unique": [true, "That username is already taken"], 
		"trim": true, 
		"match": [ username_regexp, "Username can only contain alphanumeric characters, '_' or '.' and must begin with a letter"] 
	},
	// Note: bcrypt is used to encrypt the password, so the hash includes the random salt
	"password": 
	{ 
		"type": String, 
		"required": true 
	},
	// Email must be a valid email address
	"email": 
	{ 
		"type": String, 
		"required": [true, "A valid email address is required"], 
		"unique": [true, "That email is already taken"], 
		"trim": true, 
		"lowercase": true, 
		"match": [ email_regexp, "The email you provided was invalid." ] 
	},
	"devices": [Device]
}));

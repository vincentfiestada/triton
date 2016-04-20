/*
 * goose.js - Returns a singleton Mongoose Connection instance
 */
var mongoose = require("mongoose");

/*
 * connect- create a singleton instance of Mongoose#Connection
 *  args: url - URI of the database server
 *  returns: The singleton connection object
 */ 
var connect = function(url)
{	
	if (!connect.conn && url)
	{
		// If no connection yet, open a connection
		mongoose.connect(url);
		connect.conn = mongoose.connection;
	}
	else if (typeof url !== "string")
	{
		console.log(url);
		throw "Invalid URL provided to goose.connect(...)";
	}
	return connect.conn;
};
// Initialize singleton to be null
connect.conn = null; // static variable to store Mongoose connection
module.exports = connect; // Export connect fxn
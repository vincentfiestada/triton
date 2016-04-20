/*
 * reading.js - Mongoose Schema for Water Level Readings
 */

var Schema = require("mongoose").Schema;

// set up a mongoose schema and pass it using module.exports
module.exports = new Schema(
{
	"level": 
	{
		"type": Number,
		"required": true,
	},
	"dateSent": 
	{
		"type": Date,
		"required": true,
	} 
});

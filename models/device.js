/*
 * device.js - Mongoose model for devices (i.e. water level sensors)
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Child documents
var Reading = require("./schema/reading");

var name_regexp = /^[a-z]([a-z0-9_\.])*$/i;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model("Device", new Schema(
{
	"owner": 
	{
		"type": Schema.Types.ObjectId,
		"required": true,
	},
	"nickname": 
	{
		"type": String,
		"match": [name_regexp, "Device nickname can only contain alphanumeric characters, '_' or '.' and must begin with a letter"],
		"trim": true,
	},
	"receiveFrom": // If false, messages from this device will be ignored
	{
		"type": Boolean,
		"required": true,
		"default": true,
	},
	"maxCapacity": Number, // Max capacity of bucket this device is monitoring
	"lastReading": Date, // DateTime when last sensor reading was received from device
	"lastEmptied": Date, // DateTime when the sensor last got an `empty bucket` reading
	"readings": [Reading]
}));

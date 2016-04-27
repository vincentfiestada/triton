/**
 * sense.js - Route(s) for reporting sensor data
 */

var express = require("express");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var verify = require("../services/verify");
var errors = require("../services/errors");
var Device = require("../models/device"); // Mongoose models
var s = express.Router();
// use body parser so we can get info from POST and/or URL parameters
s.use(bodyParser.urlencoded(
{
	"extended": false
}));
s.use(bodyParser.json());

s.use(verify); // Require a valid auth token
// Note: Tokens for user login and device auth are different, but verification processes are the same

/**
 * POST /api/sense/reading - Record new sensor reading
 */
s.post("/reading", function(req, res)
{
	console.log(" Sensor reported level at %s", req.body.level);
	Device.findOne(
	{
		"_id": req.vtoken.id,
	},
	{
		"receiveFrom": 1,
		"lastEmptied": 1,	
	},
	function(err, device)
	{
		try
		{
			if (err || !device)
			{
				errors.send(res, 500, "ERR_DB_DEVICE");
			}
			else if (device.receiveFrom !== true)
			{
				// Make sure this device is allowed to record sensor data
				errors.sendQuiet(res, 401, "ERR_DEVICE_BLOCKED");
			}
			else
			{
				var now = new Date(); // Get current DateTime
				var level = +req.body.level;
				
				Device.update({"_id": req.vtoken.id}, 
				{
					"$push": { "readings": { "level": level, "dateSent": now } },
					"$set": 
					{
						"lastReading": now,
						// I guess <= 2 cm is (practically empty)
						"lastEmptied": (level <= 2) ? now : device.lastEmptied
					}
				},
				function(err)
				{
					try
					{
						if (err)
						{
							errors.send(res, 500, "ERR_DEVICE_SAVE");
						}
						res.status(200).end();
					}
					catch(e)
					{
						console.log("<E> POST /api/sense/reading > save : %s", e);
					}
				});
			}
		}
		catch(e)
		{
			console.log("<E> POST /api/sense/reading : %s", e);
		}
	});
});

/**
 * PUT /api/sense/capacity - Edit capacity for a device's bucket
 */
s.put("/capacity", function(req, res)
{
	Device.findOne(
	{
		"_id": req.vtoken.id,
	},
	{
		"receiveFrom": 1,
		"maxCapacity": 1,
	},
	function(err, device)
	{
		try
		{
			if (err || !device)
			{
				errors.send(res, 500, "ERR_DB_DEVICE");
			}
			else if (device.receiveFrom !== true)
			{
				// Make sure this device is allowed to record sensor data
				errors.sendQuiet(res, 401, "ERR_DEVICE_BLOCKED");
			}
			else if (typeof device.maxCapacity !== "undefined" && device.maxCapacity > 0)
			{
				// If maxCapacity has already been set, ignore this request
				res.status(200).end();
			}
			else
			{
				var maxCapacity = +req.body.capacity;
				Device.update({"_id": req.vtoken.id}, 
				{
					"$set": 
					{
						"maxCapacity": maxCapacity,
					}
				},
				function(err)
				{
					try
					{
						if (err)
						{
							errors.send(res, 500, "ERR_DEVICE_SAVE");
						}
						res.status(200).end();
					}
					catch(e)
					{
						console.log("<E> POST /api/sense/capacity > save : %s", e);
					}
				});
			}
		}
		catch(e)
		{
			console.log("<E> POST /api/sense/capacity : %s", e);
		}
	});
});

module.exports = s;
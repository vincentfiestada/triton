/**
 * sense.js - Route(s) for reporting sensor data
 */

var express = require("express");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt-nodejs");
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
 * POST /api/sense/ - Record new sensor reading
 */
s.post("/", function(req, res)
{
	Device.findOne(
	{
		"_id": req.vtoken.id,
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
				// Add new Reading
				if (typeof device.readings === "undefined")
				{
					device.readings = [];
				}
				device.readings.push(
				{
					"level": req.body.level,
					"dateSent": req.body.date,
				});
				// Record date of last reading
				device.lastReading = new Date();
				if (+req.body.level === 0)
				{
					// if empty, record date
					device.lastEmptied = new Date();
				}
				device.save(function(err)
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
						console.log("<E> POST /api/sense/ > save : %s", e);
					}
				});
			}
		}
		catch(e)
		{
			console.log("<E> POST /api/sense/ : %s", e);
		}
	});
});

module.exports = s;
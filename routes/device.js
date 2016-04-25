/*
 * device.js - Sensor device routes
 */

var express = require("express");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt-nodejs");
var verify = require("../services/verify");
var errors = require("../services/errors");
var Device = require("../models/device"); // Mongoose models
var d = express.Router();
// use body parser so we can get info from POST and/or URL parameters
d.use(bodyParser.urlencoded(
{
	"extended": false
}));
d.use(bodyParser.json());

// All device routes are protected
d.use(verify);

/**
 * GET /api/device - List of all devices owned by current user
 */
d.get("/", function(req, res)
{
	Device.find(
	{
		"owner": req.vtoken.id
	}, 
	{
		"nickname": 1,
		"receiveFrom": 1,
		"lastReading": 1,
		"lastEmptied": 1,
	},
	function(err, devices)
	{
		try
		{
			if (err || !devices)
			{
				errors.send(res, 500, "ERR_DB_DEVICE");
			}
			else
			{
				res.send(devices);
			}
		}
		catch(e)
		{
			console.log("<E> GET /api/device: %s", e);
		}
	});
});
/**
 * POST /api/device - Create/configure a new sensor device
 */
d.post("/", function(req, res)
{
	var newDevice = new Device(
	{
		"owner": req.vtoken.id,
		"nickname": req.body.nickname,
		"maxCapacity": req.body.maxCapacity,
		"readings": [],		
	});
	newDevice.save(function(err, device)
	{
		try
		{
			if (err || !device)
			{
				var errs = errors.extractMongo(err);
				errors.sendVerbose(res, 400, "ERR_DEVICE_CREATE", errs);
			}
			console.log("<+> A new device `%s` has been configured.", device._id);
			res.send(device._id);
		}
		catch(e)
		{
			console.log("<E> POST /api/device: %s", e);
		}
	});
});
/**
 * PUT /api/device - Re-configure or change settings of an existing sensor device
 */
d.put("/", function(req, res)
{
	Device.updateOne(
	{
		"_id": req.params.id,
	},
	req.body,
	function(err, device)
	{
		try
		{
			if (err || !device)
			{
				var errs = errors.extractMongo(err);
				errors.sendVerbose(res, 400, "ERR_SAVE_DEVICE", errs);
			}
			else
			{
				res.status(200).end();
			}
		}
		catch(e)
		{
			console.log("<E> PUT /api/device/:id : %s", e);
		}
	});
});
/**
 * GET /api/device/:id - Get Information about a specific device
 */
d.get("/:id", function(req, res)
{
	Device.findOne(
	{
		"_id": req.params.id,
	},
	function(err, device)
	{
		try
		{
			if (err || !device)
			{
				errors.send(res, 500, "ERR_DB_DEVICE");
			}
			else
			{
				res.send(device);
			}
		}
		catch(e)
		{
			console.log("<E> GET /api/device/:id : %s", e);
		}
	});
});
/**
 * DELETE /api/device/:id - Delete all data about a specific device
 */
d.delete("/:id", function(req, res)
{
	Device.removeOne(
	{
		"_id": req.params.id,
	},
	function(err)
	{
		try
		{
			if (err)
			{
				errors.send(res, 500, "ERR_DEL_DEVICE");
			}
			else
			{
				res.sendStatus(200);
			}
		}
		catch(e)
		{
			console.log("<E> DELETE /api/device/:id : %s", e);
		}
	});
});
/**
 * POST /api/device/:id - Record new sensor reading
 */
d.post("/:id", function(req, res)
{
	Device.findOne(
	{
		"_id": req.params.id,
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
						console.log("<E> POST /api/device/:id > save : %s", e);
					}
				});
			}
		}
		catch(e)
		{
			console.log("<E> POST /api/device/:id : %s", e);
		}
	});
});

module.exports = d;
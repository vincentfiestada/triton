/*
 * api.js - Middleware for API routes
 */
var express = require("express");
var login = require("./login");
var user = require("./user");
var device = require("./device");
var sense = require("./sense");

var api = express.Router();

api.get("/test", function(req, res)
{
	console.log(" %s : This is a test.", new Date());
	res.end();
});
api.use("/login", login);
api.use("/user", user);
api.use("/device", device);
api.use("/sense", device);

module.exports = api;
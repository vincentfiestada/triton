/*
 * api.js - Middleware for API routes
 */
var express = require("express");
var errors = require("../services/errors");
var verify = require("../services/verify");

var api = express.Router();

api.post("/login", function(req, res)
{
	
});

// From here on, routes require an auth token
api.use(verify);

api.post("/level", function(req, res)
{
	
});

module.exports = api;
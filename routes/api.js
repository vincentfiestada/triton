/*
 * api.js - Middleware for API routes
 */
var express = require("express");
var login = require("./login");
var user = require("./user");
var device = require("./device");

var api = express.Router();

api.use("/login", login);
api.use("/user", user);
api.use("/device", device);

module.exports = api;
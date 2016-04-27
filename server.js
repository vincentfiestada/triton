/*
 * app.js - Main file, integrates all routes and starts server(s)
 */

var express = require("express");
var goose = require("./services/goose");
var api = require("./routes/api");
var constants = require("./constants");

var triton = express();

// <<< Middleware >>>
triton.use("/api", api);
// <<< Some static file routes >>>
triton.use("/p", express.static("public"));
triton.use("/n", express.static("node_modules"));
triton.use("/b", express.static("bower_components"));
triton.get("/", function(req, res) // Application home page
{
	res.sendFile("public/index.html", constants.STATIC_SEND_OPTS);
});
/*
 * Start server
 */

// Connect to MongoDB server
// If DB requires password, it should be included in the URL
console.log("Connecting to MongoDB at %s", constants.DB_URL);
var conn = goose(constants.DB_URL);
conn.once("open", function()
{
	console.log("Mongoose connection is open.");
	var port = process.env.port || 80;
	triton.listen(port);
	console.log("Triton started. Server listening on port %s", port);
	console.log(" ---------------------------------------- " );
});
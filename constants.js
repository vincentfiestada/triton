/*
 * constants.js - define constants
 */

module.exports =
{
	"DB_URL": process.env.database || "mongodb://localhost:27017/triton",
	"STATIC_SEND_OPTS":
	{
		root: __dirname,
		dotfiles: "deny",
		headers:
		{
			"x-sent": true,
		},
	},
};

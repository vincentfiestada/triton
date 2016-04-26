/*
 * filters.js - Custom Angular filters
 */
var filters = angular.module("tritonFilters", []);

/*
 * namify - A filter for turning property names into human-readable text
 *   args: property - a property name in underscore format
 */
filters.filter("namify", function()
{
	return function(property)
	{
		var names = property.split('.');
		return names[names.length - 1].replace('_', ' ');
	};
});
/*
 * round10 - Round down to a multiple of 10
 * args: num - the number to round down
 *       exp - exponent to raise 10 to (default: 1)
 * Example round(1267, 3) => 1000
 * returns: num rounded down to 10^exp
 */
filters.filter("round10", function()
{
	return function round10(num, exp)
	{
		// Set default value of exp = 1
		exp = (typeof exp !== "undefined") ? exp : 1;
		var divider = Math.pow(10, exp);
		return num - (num % divider);
	};
});
/*
 * capitalize - Capitalize the first letter
 * args: word - The string to capitalize
 */
filters.filter("capitalize", function()
{
	return function capitalize(word)
	{
		var ret = "";
		if (word)
		{
			var first = word.toUpperCase()[0];
			ret = first.concat(word.slice(1, word.length));
		}
		return ret;
	};
});
/*
 * client.js - Declares and configures AngularJS app module
 */

var triton = angular.module("triton", ["ui.router", "ngMaterial", "angular-loading-bar", "chart.js", "angularMoment", "toastCtrls", "tritonCtrls", "tritonFilters", "tritonDirectives"]);
triton.config(function($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider, cfpLoadingBarProvider)
{
	/*
	 * Client-side route config
	 */
	$stateProvider
	.state("home",
	{
		"url": "/home",
		"templateUrl": "p/partials/home.html",
	})
	.state("about",
	{
		"url": "/about",
		"templateUrl": "p/partials/about.html"
	})
	.state("login",
	{
		"url": "/login?redirect&rParams",
		"templateUrl": "p/partials/login.html",
		"controller": "loginCtrl"
	})
	.state("signup",
	{
		"url": "/signup",
		"templateUrl": "p/partials/signup.html",
		"controller": "signupCtrl"
	})
	.state("dashboard",
	{
		"url": "/dashboard",
		"templateUrl": "p/partials/dashboard.html",
		"controller": "dashboardCtrl",
		"data":
		{
			"requiredLevel": 1
		}
	})
	.state("settings",
	{
		"url": "/dashboard/settings",
		"templateUrl": "p/partials/settings.html",
		"data":
		{
			"requiredLevel": 1
		}
	})
	.state("device",
	{
		"url": "/device/:id",
		"templateUrl": "p/partials/device.html",
		"controller": "deviceCtrl",
		"data":
		{
			"requiredLevel": 1
		}
	});

	/* NOTE: To create a route that requires login, add data.requiredLevel to it
	requiredLevel is the user privilege level required for that route
	 1 - Registered (or higher) Users only
	if login is not required, there is no need to include a requiredLevel
	*/

	// default route
	$urlRouterProvider.otherwise("/home");
	
	/*
	 * Configure Icon Provider
	 */ 
	$mdIconProvider.defaultIconSet("/p/svg/mdi.svg");

	/*
	 * Configure a Theme for Angular Material
	 */
	$mdThemingProvider.theme("default")
	.primaryPalette("blue")
	.accentPalette("green")
	.warnPalette("red")
	.backgroundPalette("grey");

	// Disable loading spinner
	cfpLoadingBarProvider.includeSpinner = false;
});
triton.run(function($rootScope, $state)
{
	/*
	 * Retrieve stuff from local storage into $rootScope
	 */
	if (window.sessionStorage) // If localStorage is supported
	{
		if (window.sessionStorage.poseidon_t) // retrieve auth token
		{
			$rootScope.token = window.sessionStorage.poseidon_t;
			$rootScope.username = window.sessionStorage.poseidon_u;
		}
	}
	// TODO: polyfill for older browsers that do not support sessionStorage

	/*
	 * Prevent routes which require login from being accessed without logging in first
	 */
	$rootScope.$on("$stateChangeStart", function (event, toState, toParams)
	{
		if (toState.data)
		{
			var requiredLevel = 0;
			if (toState.data.requiredLevel)
			{
				requiredLevel = toState.data.requiredLevel;
			}
			if (requiredLevel) // If login is required
			{
				// Check if logged in
				if (!$rootScope.token || !$rootScope.username)
				{
					event.preventDefault(); // Stop! You're not allowed in there
					// Redirect to login page
					$state.go("login", { "redirect": toState.name, "rParams": JSON.stringify(toParams) });
				}
			}
		}
	});
});
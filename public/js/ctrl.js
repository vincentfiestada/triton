/*
 * ctrl.js - Angular Controllers and shared functions
 *			 shared functions are used by multiple controllers
 */

var ctrls = angular.module("tritonCtrls", []);

/* >>>>>>>>>>>>>>>>>>>>>>>>>>
 * !!!  Shared functions  !!!
 * <<<<<<<<<<<<<<<<<<<<<<<<<< */

/**
 * Show an error toast
 * 
 * @param {Object} $mdToast - an instance of the $mdToast provider
 * @param {Number} status - HTTP status code (not shown)
 * @param {String} title - Title of the error message
 * @param {Object} errors - Array of error messages
 */
function showError($mdToast, status, title, errors)
{
	$mdToast.show(
	{
		"templateUrl": "p/partials/toasts/error.html",
		"locals":
		{
			"status": status,
			"title": title,
			"errors": errors
		},
		"hideDelay": false, // Do not close automatically
		"controller": "errorToastCtrl"
	});
}
/**
 * Show a success toast which will automagically close after 3 secs
 * 
 * @param {Object} $mdToast - an instance of the $mdToast provider
 * @param {String} msg - Details of the success message
 */
function showSuccess($mdToast, msg)
{
	$mdToast.show(
	{
		"templateUrl": "p/partials/toasts/success.html",
		"locals":
		{
			"msg": msg
		},
		"hideDelay": 3000,
		"controller": "successToastCtrl"
	});
}
/**
 * Show an informational toast which will automagically close after 7 secs
 * 
 * @param {Object} $mdToast - an instance of the $mdToast provider
 * @param {String} msg - Informational message to show
 * @param {String} title - Title of message
 */
function showInfo($mdToast, msg, title)
{
	$mdToast.show(
	{
		"templateUrl": "p/partials/toasts/info.html",
		"locals":
		{
			"title": title,
			"msg": msg			
		},
		"hideDelay": 7000,
		"controller": "infoToastCtrl"
	});
}

/**
 * Get a config object to use with $http, with an x-access-token header
 * 
 * @param {Object} $rootScope - injected rootScope object
 */
function getConfig($rootScope)
{
	return new Object(
	{
		"headers":
		{
			"x-access-token": $rootScope.token
		}
	});
}

/*
 * Root Controller (minimal, root controller for index.html)
 */
ctrls.controller("rootCtrl", function($scope, $rootScope, $window)
{
	$scope.logOut = function()
	{
		// Delete token, level and username from session storage
		if ($window.sessionStorage)
		{
			delete $window.sessionStorage.poseidon_t;
			delete $window.sessionStorage.poseidon_u;
			delete $rootScope.token;
			delete $rootScope.username;
		}
		$window.location.reload();
	};
});

/*
 * Login Page controller
 */
ctrls.controller("loginCtrl", function($scope, $http, $rootScope, $state, $stateParams, $window, $mdToast)
{
	// If logged in, redirect to home page
	if ($rootScope.token)
	{
		$state.go("dashboard");
	}

	$scope.submit = function()
	{
		$http.post("/api/login",
		{
			"username": $scope.username.toString(),
			"password": $scope.password.toString()
		})
		.then(function success(res)
		{
			// make sure a token was sent
			if (res.data)
			{
				showSuccess($mdToast, "You are now logged in.");
				// Put token, user level, and username in sessionStorage
				if ($window.sessionStorage)
				{
					$window.sessionStorage.poseidon_t = res.data;
					$window.sessionStorage.poseidon_u = $scope.username;
				}
				/*
				 * Retrieve stuff from local storage into $rootScope
				 */
				if (window.sessionStorage) // If localStorage is supported
				{
					// retrieve auth token
					if (window.sessionStorage.poseidon_t && window.sessionStorage.poseidon_u)
					{
						$rootScope.token = window.sessionStorage.poseidon_t;
						$rootScope.username = window.sessionStorage.poseidon_u;
					}
				}
				// TODO: Polyfill for browsers that don't support sessionStorage
				if ($stateParams.redirect)
				{
					$state.go($stateParams.redirect, JSON.parse($stateParams.rParams));
				}
				else
				{
					$state.go("dashboard");
				}
			}
			else
			{
				showError($mdToast, "ERR_TOKEN_NIL", "Login failed.", ["No token found."]);
			}
		},
		function error(res)
		{
			showError($mdToast, res.status, "Login failed.", res.data.errors);
		});
	};
});

/*
 * Signup page controller
 */
ctrls.controller('signupCtrl', function($scope, $http, $rootScope, $state, $window, $mdToast)
{
	// If logged in, redirect to dashboard
	if ($rootScope.token)
	{
		$state.go("home");
	}

	$scope.submit = function()
	{
		$http.post("api/user/",
		{
			"username": $scope.username,
			"email": $scope.email,
			"password": $scope.password,
			"password2": $scope.password2,
		})
		.then(function success(res)
		{
			$state.go("login");
		},
		function error(res)
		{
			showError($mdToast, res.status, "Registration failed.", res.data.errors);
		});
	};
});

/*
 * User Dashboard Controller
 */
ctrls.controller("dashboardCtrl", function($scope, $http, $rootScope, $mdToast)
{
	var config = getConfig($rootScope);
	$scope.limit = 8; // Limit search results shown (paginate)
	$scope.offset = 0; // Offset for showing user's specimen
	$scope.devices = [];
	$scope.sortProp = "nickname";
	$scope.sortReversed = false;
	$scope.all_selected = false;
	// Sort by property
	$scope.sort = function(property)
	{
		$scope.sortProp = property;
	};
	// Select or unselect all
	$scope.selectAll = function()
	{
		for (var i = 0; i < $scope.devices.length; i++)
		{
			$scope.devices[i].selected = !$scope.all_selected;
		}
	};

	/*
	 * changeResultsOffset - Change search results page to show
	 */
	$scope.changeResultsOffset = function(multiplier)
	{
		$scope.offset += multiplier * $scope.limit;
		if ($scope.offset < 0) $scope.offset = 0;
		else if ($scope.offset >= $scope.specimens.length) $scope.offset -= multiplier * $scope.limit;
	};
	$scope.getDevices = function()
	{
		$http.get("api/device/", config)
		.then(function success(res)
		{
			$scope.devices = res.data;
		},
		function error(res)
		{
			showError($mdToast, res.status, "Could not retrieve devices.", res.data.errors);
		});
	};
	$scope.getDevices(); // Get devices for the first time
});

/*
 * Device View Controller
 */
ctrls.controller("deviceCtrl", function($scope, $http, $rootScope, $mdToast, $stateParams, $mdDialog)
{
	var config = getConfig($rootScope);
	$scope.getDevice = function()
	{
		$http.get("/api/device/" + $stateParams.id + "?t=" + Date.now().toString(), config)
		.then(function success(res)
		{
			$scope.device = res.data;
		},
		function error(res)
		{
			showError($mdToast, res.status, "Could not retrieve device info.", res.data.errors);
		});
	};
	$scope.getDevice(); // Get devices for the first time
	
	$scope.getToken = function()
	{
		$http.get("/api/device/" + $stateParams.id + "/token", config)
		.then(function success(res)
		{
			$mdDialog.show(
			{
				"templateUrl": "/p/partials/dialogs/token.html",
				"openFrom": document.getElementsByTagName("body")[0],
				"controller": "tokenDialogCtrl",
				"locals": { "token": res.data },
				"autoWrap": false,
			});
		},
		function error(res)
		{
			showError($mdToast, res.status, "Could not retrieve device info.", res.data);
		});
	};
	
	$scope.settings = function()
	{
		showInfo($mdToast, "In the mean time, why not sing a song?", "Not Implemented");
	};
});
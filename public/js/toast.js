/*
 * toast.js - Controller for toast notifications
 */

var toastCtrls = angular.module("toastCtrls", []);

/*
 * errorToastCtrl - controller for error messages
 */
toastCtrls.controller("errorToastCtrl", function($scope, $mdToast, status, title, errors)
{
	$scope.title = title;
	$scope.status = status;
	$scope.mode = (status >= 500) ? "error" : "warning";
	$scope.errors = errors;
	$scope.close = $mdToast.hide;
});
/*
 * successToastCtrl - controller for success messages
 */
toastCtrls.controller("successToastCtrl", function($scope, $mdToast, msg)
{
	$scope.msg = msg;
	$scope.close = $mdToast.hide;
});
/*
 * infoToastCtrl - controller for info messages
 */
toastCtrls.controller("infoToastCtrl", function($scope, $mdToast, msg, title)
{
	$scope.msg = msg;
	$scope.title = title;
	$scope.close = $mdToast.hide;
});
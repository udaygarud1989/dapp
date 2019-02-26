"use strict";
/*globals $:false */
/*globals swal:false */
/*globals angular:false */
/*
=========================================================================================
File description:
    Filename    : script.js
    Module      : Login and Registration client side module (AngularJs)
	Dependency  : 
				  js/angular-locale_en.js
				  js/angular-locale_fr.js
	Description :
                  This file contains Javascript code for Login and Registration data representation and manipulation.
    Developed By: PLM LOGIX
=========================================================================================
Date                    Name                           Description of Change
20-Dec-2016             Nisha Mane                     Initial Version
22-Dec-2016             Nisha Mane                     Added function to register user
22-Dec-2016             Nisha Mane                     Added function to validate user credentials
16-Jan-2017             Nisha Mane                     Added service for localization in english and french language
16-Jan-2017             Nisha Mane                     Added factory method for localization in selected language
23-Jan-2017             Nisha Mane                     Added factory method to display loading symbol
09-Jan-2017             Nisha Mane                     Added function to validate registration form
06-Feb-2017             Nisha Mane                     Added function to get status from config.js file
=======================================================================================*/

if (window.i18next) {
	window.i18next
	.use(window.i18nextXHRBackend)
	.use(window.i18nextSprintfPostProcessor);
	window.i18next.use({
		name: 'patrick',
		type: 'postProcessor',
		process: function (value, key, options) {
			if (!options.patrick) {
				return value;
			}
			return '...';
		}
	});
	window.i18next.init({
		debug: true,
		lng: 'en', // If not given, i18n will detect the browser language.
		fallbackLng: 'en', // Default is dev
		backend: {
			loadPath: '../locales/{{lng}}/{{ns}}.json'
		},
		useCookie: false,
		useLocalStorage: false,
		postProcess: ['sprintf', 'patrick']
	}, function (err, t) {
		console.log('resources loaded');
	});
}

angular.module('jm.i18next').config(function ($i18nextProvider) {

});

var app = angular.module('app',['ngCookies','jm.i18next']);

//Factory method to display loading symbols
app.factory('baseFactory', function () {
	return {
		showprogressBar : function () {
			document.getElementById("progressBtn").click();	
		},
		hideprogressBar : function () {
			document.getElementById("progressBtn").click();
        }
    };
});

// App controller
app.controller('AppCtrl',['$cookies', '$scope','$http','$rootScope','$timeout','$window','baseFactory','$i18next','$filter',function($cookies,$scope,$http,$rootScope,$timeout,$window,baseFactory,$i18next,$filter) {	
	$scope.changeLng = function (lng) {
	    $cookies.put("selectedlocale",lng);
		$i18next.changeLanguage(lng);
		$window.location.reload();	
	};
	$scope.changeLngfromjs = function (lng) {
	    $cookies.put("selectedlocale",lng);
		$i18next.changeLanguage(lng);	
    };	
	$timeout(function () {
		$scope.date = 'Should change! ' + new Date();
		$scope.dynamicBindingVariable = 'hello';
	}, 1000);
	$scope.availableLocales = {
		'en': 'English',
		'fr': 'French',
	};
	if($cookies.get('selectedlocale')==''||$cookies.get('selectedlocale')=== undefined){
		$scope.model = {selectedLocale: 'en'};
        $scope.changeLngfromjs($scope.model.selectedLocale);
    }
    else{
        $scope.model = {selectedLocale: $cookies.get('selectedlocale')};
        $scope.changeLngfromjs($scope.model.selectedLocale);
    }
	var statusArray = {
		val:{}
	};
	$scope.statusArray = statusArray;
	$scope.status = '';
    $scope.loading = false;
	
	// Function to validate registration form
	function validateUser()
	{
		var msg = '';
		if($scope.password != $scope.confirm_password){
			msg = msg + "\n"+$i18next.t("validate_confirm_password");
		}
		if($scope.password.length < 8){
			msg = msg + "\n"+$i18next.t("validate_password");
		}
		if($scope.username.length <4){
			msg = msg + "\n"+$i18next.t("validate_username");
		}
		if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($scope.email)){
			msg = msg + "\n"+$i18next.t("validate_email");
		}
		return msg;
	}
	
	//Function to  register user
	$scope.registerUser = function()
	{
		baseFactory.showprogressBar();
		$scope.loading = true; 
		if($scope.username !== undefined && $scope.email !== undefined && $scope.password !== undefined && $scope.confirm_password !== undefined && $scope.role !== undefined){
			var msg = validateUser();
			if(msg === ''){
				$http.get('/checkUsers/'+$scope.username).success(function(response){
					if(response === "NotExist"){
						var userReg = {'username':$scope.username,'email':$scope.email,'password':$scope.password,'role':$scope.role};
						$http.post('/registerUsers',userReg).success(function(response){
							$timeout(function(){ 
								$scope.status = "Finished";
								$scope.loading = false;
							},8000000);
							if(response === "Register Successful"){
								baseFactory.hideprogressBar();
								swal({
									title: $i18next.t("register_success"),
									showCancelButton:false,     
									confirmButtonText: $i18next.t("ok"),
									closeOnCOnfirm:true,						
								},function(isConfirm){
									if(isConfirm){
										window.location = "";
									}
								});
							}else{
								baseFactory.hideprogressBar();
								$scope.username ="";
								$scope.password =""; 
								$scope.confirm_password ="";
								$scope.role ="";
								swal({
									title: $i18next.t("register_failed"),
									showCancelButton:false,     
									confirmButtonText: $i18next.t("ok"),
									closeOnCOnfirm:true,						
								});
							}
						});
					}else{
						baseFactory.hideprogressBar();
						swal({
							title: $i18next.t("register_email_exist"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
						$scope.username ="";
						$scope.password =""; 
						$scope.confirm_password ="";
						$scope.role ="";
						
					}
					
				});
			}else{
				baseFactory.hideprogressBar();
				swal({
					title: $i18next.t("register_failed")+msg,
					showCancelButton:false,     
					confirmButtonText: $i18next.t("ok"),
					closeOnCOnfirm:true,						
				});
			}
		}else{
			baseFactory.hideprogressBar();
			swal({
				title: $i18next.t("register_mandatory_fields"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}  
	};
	
	//Function to validate user credentials
	$scope.login = function()
	{
		if($scope.username !== undefined && $scope.password !== undefined){
			var userReg = {'username':$scope.username,'password':$scope.password};
			$http.post('/loginUser',userReg)
				.success(function(response){
					if(response == "Login Successful"){
						$cookies.put("username",$scope.username);
						window.location = "/account";
					}else{
						swal({
							title: $i18next.t("login_fail_reason"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
						$scope.username = null;
						$scope.password = null;
					}
				})
				.error(function(res){
					
				});
		}else{
			swal({
				title: $i18next.t("login_fail_reason"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}
	};
	
	// logout function
	$scope.logout = function()
	{
		window.location = "/logout";
	};
}]);
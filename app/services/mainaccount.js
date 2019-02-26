"use strict";
/*globals $:false */
/*globals swal:false */
/*globals angular:false */
/*
=========================================================================================

File description:
    Filename    : mainaccount.js
    Module      : Main Account client side module (AngularJs)
	Dependency  : 
				  js/angular-locale_en.js
				  js/angular-locale_fr.js
	Description	: This file contains Javascript code for Main Account data representation and manipulation.
	Developed By: PLM LOGIX
=========================================================================================
Date                     Name                    Description of Change
19-Dec-2016          	 Nisha Mane              Initial Version
24-Dec-2016  			 Nisha Mane              Added function to get user details
26-Dec-2016  			 Uday Garud              Added function to clear cookies and redirect after logout
26-Dec-2016  			 Uday Garud              Added function to start and stop miner
26-Dec-2016  			 Nisha Mane              Added function to add search data in table
27-Dec-2016  			 Nisha Mane              Added function to search contract using contract number
26-Dec-2016  			 Uday Garud              Added function to compile contract
27-Dec-2016  			 Nisha Mane              Added function to check if contract is already exist in available contract list or task perform section
27-Dec-2016  			 Nisha Mane              Added function to publish contract
28-Dec-2016  			 Nisha Mane              Added function get contract address after deploy and transaction mined succefully
29-Dec-2016  			 Nisha Mane              Added function to store contract address in db
30-Dec-2016  			 Nisha Mane              Added function to add parts in deployed contract
05-Jan-2017  			 Nisha Mane              Added function to get list of available contracts
16-Jan-2017  			 Uday Garud              Added service for localization in English and French language
16-Jan-2017  			 Uday Garud              Added factory method for localization in selected language
09-Jan-2017  			 Nisha Mane              Added function to get task to perform table data	
10-Jan-2017  			 Nisha Mane              Added function to get last action table data
11-Jan-2017  			 Nisha Mane              Added function to get history table data
11-Jan-2017  			 Nisha Mane              Added function to get contract information for selected contract
12-Jan-2017  			 Nisha Mane              Added function to get contract information modal data 
16-Jan-2017  			 Nisha Mane              Added function to get contract information to Review
17-Jan-2017  			 Nisha Mane              Added function to add comments from Task perform table
17-Jan-2017  			 Nisha Mane              Added function to add comments from last action table
18-Jan-2017  			 Uday Garud              Added function get address after add comment transaction mined succefully
19-Jan-2017  			 Nisha Mane              Added function to update fields in contract (date and amount)
19-Jan-2017  			 Nisha Mane              Added function to get contract address after modify fields transaction mined successfully
20-Jan-2017  			 Nisha Mane              Added function to delete contract
23-Jan-2017  			 Uday Garud              Added function to get ether balance of user
23-Jan-2017  			 Nisha Mane              Added factory method to display loading symbol on various actions
06-Feb-2017  			 Uday Garud              Added function to get peers information
07-Feb-2017  			 Uday Garud              Added function to add peers
07-Feb-2017  			 Uday Garud              Added function to remove contract from cookies after deploy   
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
			return 'No, this is Patrick!';
		}
});
window.i18next.init({
	debug: true,
	lng: 'en',
	fallbackLng: 'en',
	"returnObjects": true,
	backend: {
		loadPath: '../locales/{{lng}}/translation.json'
	},
	useCookie: true,
	useLocalStorage: false,
	postProcess: ['sprintf', 'patrick']
}, function (err, t) {
	});
}

angular.module('jm.i18next').config(function ($i18nextProvider) {

});

var app = angular.module('app',['ngCookies','jm.i18next','ngIdle','angularMoment','chart.js']);

// Service for session management
app.config(['KeepaliveProvider', 'IdleProvider', function(KeepaliveProvider, IdleProvider) {
  IdleProvider.idle(900);
  IdleProvider.timeout(60);
  KeepaliveProvider.interval(600);
}]);

app.run(function(Idle,$rootScope, $cookies,$location) {    
	Idle.watch();
	$rootScope.$on('IdleTimeout', function() {
		$cookies.remove('searchData');
		$cookies.remove('myValue');
		window.location = "/logout";				
	}); 
});
  
// Factory method to display loading symbol on various actions
app.factory('baseFactory', function () {
    return {
		showPageProgress: function () {
			//$('#pageProgressBar').modal('show');
			document.getElementById("progressBtn").click();
		},
		hidePageProgress: function () {
			document.getElementById("progressBtn").click();
		},
		taskStatusModalDismiss : function () {
			$('#taskStatusModal').modal('hide');
		},
		taskPerformModalDismiss : function () {
			$('#myModal').modal('hide');
		},
		ModifyFieldsModal : function () {
			$('#ModifyFieldsModal').modal('hide');
		},
		DissmissPeersModal : function () {
			$('#PeersModal').modal('hide');
		}
	};
});

// Factory method to download history data
 app.factory('Excel',function($window){
    var uri='data:application/vnd.ms-excel;base64,',
        template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
        base64=function(s){return $window.btoa(unescape(encodeURIComponent(s)));};
        format=function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
		console.log("format "+format);
    return {
        tableToExcel:function(tableId,worksheetName){
        var table=$(tableId),
        ctx={worksheet:worksheetName,filename:"history",table:table.html()},
		download="history.xls",
        href=uri+base64(format(template,ctx));
        return href;
        }
    };
});

// Directive to open bootstrap popover for remark
app.directive('popover', function(){
    return function(scope, elem) {
        elem.popover();
    };
});

// Directive to allow only numbers in amount textbox
app.directive('validNumber', function() {
    return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl){
            if(!ngModelCtrl) {
                return; 
            }
            ngModelCtrl.$parsers.push(function(val) {
				if(angular.isUndefined(val)) {
					 val = '';
				}
				var clean = val.replace(/[^-0-9\.]/g, '');
				var negativeCheck = clean.split('-');
				var decimalCheck = clean.split('.');
				if(!angular.isUndefined(negativeCheck[1])) {
					negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
					clean =negativeCheck[0] + '-' + negativeCheck[1];
					if(negativeCheck[0].length > 0) {
						clean =negativeCheck[0];
					} 
				}  
				if(!angular.isUndefined(decimalCheck[1])) {
					decimalCheck[1] = decimalCheck[1].slice(0,2);
					clean =decimalCheck[0] + '.' + decimalCheck[1];
				}
				if (val !== clean) {
					ngModelCtrl.$setViewValue(clean);
					ngModelCtrl.$render();
				}
				return clean;
            });
            element.bind('keypress', function(event) {
                if(event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
	};
});
	
// App controller
app.controller('UserCtrl',['$cookies','$rootScope','$scope','$http','$timeout','$window','baseFactory','$i18next','$filter','Excel','moment',function($cookies,$rootScope,$scope,$http,$timeout,$window,baseFactory,$i18next,$filter,Excel,moment) {
	$scope.loaded = false;
    $scope.languageSelected	 = 'en';	
    $timeout(function() { 
	    $scope.loaded = true; 
	}, 2000);
	$scope.colours = [ "#1e8449", "#f39c12" , "#000"];
	$scope.contracts = [
		{actvalue : "EC124-93", caption : "EC124-93 (Design Change Contract)"},
		{actvalue : "EC124-94", caption : "EC124-94 (Drawing Exchange Contract)"},
		{actvalue : "EC124-95", caption : "EC124-95 (Model Change Contract)"}
	]; 
	$scope.changeLng = function (lng) {
	    $cookies.put("selectedlocale",lng);
		$i18next.changeLanguage(lng);
		$scope.languageSelected = lng;
		$window.location.reload();	
	};
	$scope.changeLngfromjs = function (lng) {
	    $cookies.put("selectedlocale",lng);
		$i18next.changeLanguage(lng);
		$scope.languageSelected = lng;	
    };
   $scope.availableLocales = {
		'en': 'English',
		'fr': 'French',
	};
	if($cookies.get('selectedlocale')===''||$cookies.get('selectedlocale')=== undefined){
		$scope.model = {selectedLocale: 'en'};
        $scope.changeLngfromjs($scope.model.selectedLocale);
    }
    else{
	    $scope.model = {selectedLocale: $cookies.get('selectedlocale')};
        $scope.changeLngfromjs($scope.model.selectedLocale);
    }
	// Start of global variable declarations
	$scope.res = false;
	$scope.webserviceUrl = 'http://localhost:8545';
	$scope.etherBalance = '0.0';
	$scope.peercount = '0';
	var mainAccountInstructions = {
		 val:[]
	};
	var statusArray = {
		val:{}
	};
	var HistoryInfo = {
		val:[]
	};
	var taskStatusDetails = {
		val:[]
	};
	var taskToPerformVal = {
		val : []
	};
	var LastActionDataVal ={
		val:[]
	};
	$scope.supplierList = [];
	$scope.selectedSupplier = "";
	$scope.statusArray = statusArray;
	$scope.idSelected = null;
	$scope.TaskPerformCount = 0;
	$scope.LastActionData = LastActionDataVal;
	$scope.searchDataCookies=[];
	$scope.taskToPerformData = taskToPerformVal;
	$scope.HistoryData = HistoryInfo;
	$scope.taskStatusDetails = taskStatusDetails;
	$scope.mainAccountInstructions = mainAccountInstructions;	
	// End of initialize global variables
	//Start Chart

	
	
	$scope.series = ['Series A'];
	Chart.plugins.register({
		afterDraw: function(chartInstance) {
		  if (chartInstance.config.options.showDatapoints) {
			var helpers = Chart.helpers;
			var ctx = chartInstance.chart.ctx;
			var fontColor = helpers.getValueOrDefault(chartInstance.config.options.showDatapoints.fontColor, chartInstance.config.options.defaultFontColor);
  
			// render the value of the chart above the bar
			ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = fontColor;
  
			chartInstance.data.datasets.forEach(function (dataset) {
			  for (var i = 0; i < dataset.data.length; i++) {
				var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
				var scaleMax = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._yScale.maxHeight;
				var yPos = (scaleMax - model.y) / scaleMax >= 0.93 ? model.y + 20 : model.y - 5;
				ctx.fillText(dataset.data[i], model.x, yPos);
			  }
			});
		  }
		}
	  });
	$scope.chartOptions = {
		scaleShowValues: true,	
		legend: {
		  display: false
		},                                                                                             
		scales: {
		  yAxes: [{
			  id: 'y-axis-1', type: 'linear', 
			  position: 'left',
			  ticks: {
				beginAtZero: true,
				suggestedMax:10
			},
			  scaleLabel: {
				  display: true,
				  labelString: 'Minutes',
				  fontStyle: 'bold',
				  fontFamily:'Helvetica',
				  fontColor : '#515151',
				  fontSize : 13
			  }
		  }],
		  xAxes: [{
			  ticks: {
			  
			  autoSkip: false
		  },
			  scaleLabel: {
				  display: true,
				  labelString: 'User Types',
				  fontStyle: 'bold',
				  fontFamily:'Helvetica',
				  fontColor : '#474646',
				  fontSize : 13
			  }
		  }]
		  
		},
		responsive: true,
		maintainAspectRatio: false,
		events: false, animation: {
			duration: 1,
			onComplete: function () {
				var chartInstance = this.chart,
					ctx = chartInstance.ctx;
				ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
	
				this.data.datasets.forEach(function (dataset, i) {
					var meta = chartInstance.controller.getDatasetMeta(i);
					meta.data.forEach(function (bar, index) {
						var data = dataset.data[index];                            
						ctx.fillText(data, bar._model.x, bar._model.y - 5);
					});
				});
			}
		}
	};
	
	//End Chart
	getuseraddress();
	setTimeout(function(){
        onLoad();
    },1000);
	// Function execute on page load
	function onLoad()
	{	
		//console.log("hrser ");
		//var hrs = getHours("10/07/2017 14:12:15", "10/07/2017 15:55:08");
		//console.log("hrs "+hrs);
		//Function call to get ether balance of user
		getEtherofUser();
		getstatusfromfile();
		//Ajax call to  start miner on page load
		$scope.miningText = "Start Mining";
		$.ajax({
			type: 'POST',
			url: $scope.webserviceUrl,
			async: false,
			data : '{"jsonrpc":"2.0","method":"eth_mining","params":[],"id":75}',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success: function(response) {	  
				if(response.result === true){	
					$scope.miningText = "Stop Mining";
				}else if(response.result === false){
					$scope.miningText = "Start Mining";
					//changeMiningVal();
			    }
			},
			error: function(error) {
			}
		});
			
		// Function call to get list of available contract numbers
		getcontractNameList();	
		// Get search data from cookies
		if($cookies.get('searchData')!== undefined){
			var value = $cookies.get('searchData');
			$scope.searchDataCookies = JSON.parse(value);
			$scope.taskToPerformData.val = JSON.parse(value);
		} 
		// To get all available SUppliers list
		$.ajax({type: "GET",
			url: "/mainaccount/getSupplierList",
			data: '',
			success:function(result){
				$scope.supplierList = result;
			},
			error:function(result){
			}
		});
		$scope.$apply();
		// Function call to update ether balance	
		setInterval(function(){
			 getEtherofUser();
		}, 10000);
		$scope.$apply();
	}
	
	// Function to get status from config.js file
	function getstatusfromfile()
	{
		$scope.statusArray.val = {};
		$.ajax({
			type: 'POST',
			url: '/getstatusfromconfigFile',
			async: false,
			data : '',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success:function(result){
				$scope.urlDetails = result;
				$scope.statusArray.val = result;
			},
			error:function(result)
			{	
			}
		});
	}
		
    // Function to get ether balance of user
	function getEtherofUser(){
		$.ajax({
			type: 'POST',
			url: '/getBalance',
			async: false,
			data : JSON.stringify({"address":$scope.UserData.address}),
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success:function(result){
				$scope.etherBalance = result.balance;
			},
			error:function(result)
			{
			}
		});
		$.ajax({
			type: 'POST',
			url: $scope.webserviceUrl,
			async: false,
			data : '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":74}',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success: function(response) {
				$scope.peercount = parseInt(response.result, 16);
			},
			error: function(error) {
			}
		});
	}
		
	// Function to get list of available contracts
	function getcontractNameList()
	{
		$scope.contractNameList=[];
		$scope.availablecontracts=[];
		$scope.completedcontracts=[];
		$.ajax({
			type: 'GET',
			url: '/mainaccount/getcontractNamelistforMainAccount',
			async: false,
			data : '',
			success:function(result){
				$scope.contractNameList=result;
				if($scope.contractNameList.length === 0){
					swal({
						title: $i18next.t("contract_info_not_found"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					}); 
				}else{
					for(var i=0;i<$scope.contractNameList.length;i++){
						var len = gettaskperformdatalength($scope.contractNameList[i]);
						if($scope.contractNameList[i].iscomplete){
							$scope.completedcontracts.push($scope.contractNameList[i]);
						}else{
							$scope.availablecontracts.push($scope.contractNameList[i]);
						}
						$scope.contractNameList[i].noofTask = len;
					}
				}
			},
			error:function(result)
			{
			}
		});
	}
	
	//Function to get no of task perform data;
	function gettaskperformdatalength(contract)
	{
		var count = 0;
		$.ajax({
			type: 'GET',
			url: '/mainaccount/getTaskPerformData/'+contract.contractAddress,
			async: false,
			data : '',
			success:function(result){
				
				$scope.modifyFields = false;
				for(var i=0;i <result.length;i++){
					if(result[i].isrejected === true){
						count++;
						//$scope.pendingcontracts.push(contract)
						//$scope.contractNameList.splice(i, 1);
					}
				} 
			},
			error:function(result){				
			},
		});
		return count;
	}
	
	//Function to get contract information for selected contract
	$scope.getcontractData = function(contractAddress)
	{
		for(var i=0;i<$scope.contractNameList.length;i++){
			if($scope.contractNameList[i].contractAddress == contractAddress){
				$scope.contractNameList[i].idSelected = true;
			}else{
				$scope.contractNameList[i].idSelected = false;
			}
		}
		$scope.taskToPerformData.val=[];
		$scope.HistoryData.val = [];
		$scope.LastActionData.val = [];
		console.log("instructions "+$i18next.t("mainaccountinstructions"));
		if($cookies.get('searchData')!== undefined)
		{
			var value = $cookies.get('searchData');
			$scope.taskToPerformData.val = JSON.parse(value);
		} 
		getTaskPerformData(contractAddress);
		getLastActionData(contractAddress);
		getHistoryData(contractAddress);
	};
	
		
	//Function to get task to perform table data
	function getTaskPerformData(contractAddress)
	{
		
		$scope.taskPerformProgressBar = true;
		$.ajax({
			type: 'GET',
			url: '/mainaccount/getTaskPerformData/'+contractAddress,
			data : '',
			success:function(result){
				$scope.modifyFields = false;
				for(var i=0;i <result.length;i++){
					if(result[i].isrejected === true){
						if(result[i].status == statusArray.val.created){
							$scope.taskToPerformData.val.push({contractNumber : result[i].contractNumber,"data":result[i].data,"contractAddress":result[i].contractAddress,"status":"Published","publish":false,"reject":true});
						}else{
							$scope.taskToPerformData.val.push({contractNumber : result[i].contractNumber,"data":result[i].data,"contractAddress":result[i].contractAddress,"status":result[i].status,"publish":false,"reject":true});
						}
					}
				} 
				$scope.TaskPerformCount = gettaskperformdatalength(contractAddress);
				if($cookies.get('searchData')!== undefined){
					var value = JSON.parse($cookies.get('searchData'));
					for(var i=0;i<value.length;i++){
						$scope.TaskPerformCount++;
					}
				} 
				$scope.taskPerformProgressBar = false;
				
			},
			error:function(result){
				$scope.taskPerformProgressBar = false;
			},
			complete:function(result){
				$scope.taskPerformProgressBar = false;
			}
		});
	}
		
	//Function to get last action table data	
	function getLastActionData(contractAddress)
	{
		console.log('/mainaccount/getLastActionData/'+contractAddress);
		$scope.statusSummaryProgressBar = true;
		$scope.LastActionData.val=[];
		$.ajax({type: "GET",
			url: "/mainaccount/getLastActionData/"+contractAddress,
			data: '',
			success:function(result){
				
				$scope.LastActionData.val=[];
				$scope.statusSummaryProgressBar = false;
				for(var i=0;i <result.length;i++){
					if(result[i].owner == $scope.UserData.username){
						if(result[i].status == statusArray.val.republished){
							console.log("Terms-Updated "+result[i].remark);
							result[i].wholeRemark = result[i].remark;
							result[i].remark = 'Terms-Updated';
						}
						$scope.LastActionData.val.push(result[i]);
					}
					$scope.$apply();
				}
				
			},
			error:function(result)
			{
			},
			complete:function(data){	
				$scope.statusSummaryProgressBar = false;
				$scope.$apply();
			}
		});
	}
		
	//Function to get history table data
	function getHistoryData(contractAddress)
	{
		$scope.taskProgressBar = true;
		var mainaccount_name = "",supplier_name="";
		$scope.mainaccount_details = "";
		$scope.supplier_details = "";
		$scope.data = [];
		$scope.labels = [];
		var mainaccount_total_time =0;
		var supplier_total_time =0;
		var mainaccount = [];
		var supplier = [];
		$.ajax({type: "GET",
			url: "/mainaccount/getLastActionData/"+contractAddress,
			data: '',
			success:function(result){
				$scope.HistoryData.val = [];
				$scope.taskProgressBar = false;
				 $scope.$apply();
				var contractName = '';
				var contractDate = '';
				var contractAddress = '';
				for(var i=0;i <result.length;i++){
					if(result[i].partinfoId === undefined){
						contractName = result[i].ContractName;
						contractDate = result[i].DateCreated;
						contractAddress = result[i].contractAddress;
						//console.log("status "+statusArray.val.republished);
						if(result[i].status == statusArray.val.republished){
							result[i].wholeRemark = result[i].remark;
							result[i].remark = 'Terms-Updated'; 
						}
						if(result[i].role === "Main Account"){
							mainaccount_name = result[i].owner;
							if(result[i].status !== statusArray.val.created){
								mainaccount.push(result[i]);
							}
						}
						if(result[i].role === "Supplier"){
							supplier_name = result[i].owner;
							supplier.push(result[i]);
						}
						$scope.HistoryData.val.push(result[i]);
					}
					if(result[i].partinfoId !== undefined && result[i].partinfoId !==''){
						$scope.HistoryData.val.push({"contractAddress": contractAddress,"ContractName": contractName,"owner": result[i].supplieraddress,"status": statusArray.val.pending,"DateCreated": contractDate});
					}
				}
				//calculateTime(supplier);
				console.log("mainaccount data "+JSON.stringify(mainaccount));
				for(var j=0;j<mainaccount.length;j++){
					if(mainaccount[j].status === statusArray.val.pending){
						if(j+1 < mainaccount.length){
							mainaccount_total_time = mainaccount_total_time + getHours(mainaccount[j].DateCreated,mainaccount[j+1].DateCreated);
							//console.log("end time "+getHours(mainaccount[j].DateCreated,mainaccount[j+1].DateCreated));
						}
					}
				}
				
				for(var k=0;k<supplier.length;k++){
					if(supplier[k].status === statusArray.val.pending){
						if(k+1 < supplier.length){
							supplier_total_time = supplier_total_time + getHours(supplier[k].DateCreated,supplier[k+1].DateCreated);
						}
					}
				}
				$scope.labels = ["Main Account ("+mainaccount_name+" )","Supplier ("+supplier_name+" )"];
				$scope.data.push(mainaccount_total_time);
				$scope.data.push(supplier_total_time);
				console.log("mainaccount_total_time "+mainaccount_total_time);
				$scope.mainaccount_details = "Main Account ("+mainaccount_name+" ) : "+getDataHR(mainaccount_total_time);
				$scope.supplier_details = "Supplier ("+supplier_name+" ) : "+getDataHR(supplier_total_time);
				$scope.taskProgressBar = false;
				$scope.$apply();
			},
			error:function(result){
				$scope.taskProgressBar = false;
			}
		});
	}
	
	//function to calculate time in hrs
    function getHours(start_time, end_time){
		var timeStart = new Date(start_time).getTime();
		var timeEnd = new Date(end_time).getTime();
		var hourDiff = timeEnd - timeStart; //in ms
		var secDiff = hourDiff / 1000; //in s
		var minDiff = hourDiff / 60 / 1000; //in minutes
		var hDiff = hourDiff / 3600 / 1000; //in hours
		var humanReadable = {};
		humanReadable.hours = Math.floor(hDiff);
		humanReadable.min = Math.floor(minDiff);
		console.log("hours "+humanReadable.hours);
		console.log("min "+humanReadable.min);
		var minutes = (humanReadable.hours*60) + humanReadable.min;
		console.log("total time "+minutes);
		return minutes;
		/* if(humanReadable.hours<1){
			
			return (Math.ceil(parseFloat("0."+ humanReadable.min)));
		}
		  
		else{
			return humanReadable.hours;
		}   */
	}
	
	function getDataHR (newMinutes) {
		var MINS_PER_DAY = 24 * 60;
		var MINS_PER_HOUR = 60;
		var minutes = newMinutes;
		var days = Math.floor(minutes / MINS_PER_DAY);
		 minutes = minutes - days * MINS_PER_DAY;
		 var hours = Math.floor(minutes / MINS_PER_HOUR);
		 minutes = minutes - hours * MINS_PER_HOUR;
		return days + " day(s) " +hours + " hour(s) " + minutes + " minute(s)";
	}
		
	// Get contract information modal data for last action table
	$scope.getContractInformation = function(obj)
	{
		$scope.showcommenttext = false;
		$scope.taskstatuscomment = "";
		$scope.taskStatusDetails.val = [];
		$scope.taskstatuscomment = "";
		$scope.taskStatuscontractinfoProgress = true;
		$.ajax({type: "GET",
			url: "/mainaccount/getContractInformation/"+obj.contractAddress,
			data: '',
			success:function(result){
				
				$scope.taskStatusDetails.val = result;
				$scope.taskStatusDetails.val.partInfo = $i18next.t(result.contractNumber+".TaskList");
				$scope.taskStatuscontractinfoProgress = false;
				$scope.showcommenttext = true;
				$scope.taskStatusDetailsTask = result.partInfo;
				$scope.$apply();
			},
			error:function(result){
				$scope.taskStatuscontractinfoProgress = false;
			}
		});
	};
		
	//Ajax call to start and stop miner on button click
	$scope.changeMining = function()
	{
		changeMiningVal();
	};
	function changeMiningVal()
	{
		if($scope.miningText == "Start Mining"){
			$.ajax({
				type: 'POST',
				url: $scope.webserviceUrl,
				async: false,
				data : '{"jsonrpc":"2.0","method":"miner_start","params":[2],"id":74}',
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				success: function(response) { 
					if(response.result === true){
						$scope.miningText = "Stop Mining";
					}else{
						/* swal({
							title: $i18next.t("start_mining_error"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						}); */
					}
				},
				error: function(error) {
				}
			});
		}else if($scope.miningText == "Stop Mining"){
				$.ajax({
					type: 'POST',
					url: $scope.webserviceUrl,
					async: false,
					data : '{"jsonrpc":"2.0","method":"miner_stop","params":[],"id":71}',
					dataType: 'json',
					contentType: 'application/json; charset=utf-8',
					success: function(response){
						if(response.result === true){
						    $scope.miningText = "Start Mining";
						}
					},
					error: function(error) {
					}
				});
			}
		}
		
	//Function to add search data in table
	$scope.addSearchData = function()
	{
		if($scope.searchId == undefined){
			swal({
				title: $i18next.t("Enter_contract_number"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}else{
			var existinsearchdata = iscontractExist($scope.taskToPerformData.val,$scope.searchId);
			//var existindeployed = iscontractExist($scope.contractNameList,$scope.searchId);
			if(existinsearchdata){
				swal({
						title: $i18next.t("contract_exist_taskperform"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
			} else {
				var obj = {"data":"Search Data"};
				$scope.search($scope.searchId, 1,obj);
			}		
		}
	};
		
	//Function to check if contract is already exist in available contract list or task perform section
	 function iscontractExist(data,id) {
		var ifExist = false;
		if(data.length>0){
			angular.forEach(data, function (data){
				if (data.contractNumber == id){
					ifExist = true;
				}	
			});
		}
		return ifExist;
	}	
		
	//Function to search contract using contract number		
	$scope.search = function(searchIdval, searchDataAdd,obj)
	{
		$scope.showcommenttext = false;
		$scope.taskstatuscomment = "";
		$scope.contractInfo= {};
		$scope.tasks=[];
		$scope.taskperformcomment = "";
		if( obj.data == "Search Data"){	
			$.ajax({type: "GET",
				url: "/mainaccount/search/"+searchIdval,
				data: "",
				success:function(result){
					$scope.contractInfo = result;			
					$scope.tasks = $i18next.t(result.ContractNumber+".TaskList");
					$scope.showcomment = false;
					$scope.res = true;
					if(searchDataAdd == 1 && $scope.searchId !== '' && $scope.searchId !== undefined && $scope.contractInfo.ContractNumber !== undefined)
					{	
						$scope.taskToPerformData.val.push({contractNumber : $scope.searchId,"data":$scope.contractInfo.data,"publish":true,"reject":false,"contractinfo":$scope.contractInfo});
						$scope.searchDataCookies.push({contractNumber : $scope.searchId,"data":$scope.contractInfo.data,"publish":true,"reject":false,"contractinfo":$scope.contractInfo});
						$cookies.put("searchData", JSON.stringify($scope.searchDataCookies));
						$scope.TaskPerformCount++;
					}
					else if(searchDataAdd == 1){
						swal({
							title: $i18next.t("contract_not_found"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
					}
					//$scope.TaskPerformCount = gettaskperformdatalength(contractAddress);
					
					/* if($cookies.get('searchData')!== undefined){
						var value = JSON.parse($cookies.get('searchData'));
						for(var i=0;i<value.length;i++){
							$scope.TaskPerformCount++;
						}
					}  */
					$scope.$apply();
				},
			   error:function(result){		
			   }
		   });
		   
		 }
		 else if(obj.data == "Rejected Data")
		 {
			$scope.taskPerformcontractinfoProgress = true;
			$.ajax({type: "GET",
				url: "/mainaccount/getMainAccountContractInfo/"+obj.contractAddress,
				data: '',
				success:function(result){ 
				    $scope.contractInfo = result;
					$scope.tasks = $i18next.t(result.ContractNumber+".TaskList");
					$scope.showcomment = true;
					$scope.taskPerformcontractinfoProgress = false;
					$scope.showcommenttext = true;
					$scope.$apply();
				},
			   error:function(result){
					$scope.taskPerformcontractinfoProgress = false;
			   }
		   });
		 }
	};
	
	$scope.checker = function()
	{
		$scope.disableAmount = false;
	};
	
	//Function to get contract information to Review contract
	$scope.getContractInformationtoModify = function(contractAddress)
	{
		$scope.taskPerformcontractinfoProgress = true;
		$scope.modifycomment = "";
		$scope.showcommenttext = false;
		$scope.contractInfotomodify = [];
		$.ajax({type: "GET",
			url: "/mainaccount/getMainAccountContractInfo/"+contractAddress,
			data: '',
			success:function(result){
			    $scope.contractInfotomodify = result;
				$scope.contractInfotomodify.tasks = $i18next.t(result.ContractNumber+".TaskList");
				$scope.disableAmount = true;
				$scope.showcommenttext = true;
				$scope.amount = $scope.contractInfotomodify.ContractAmount;
				$scope.mydate = $scope.contractInfotomodify.Duedate;
				$scope.taskPerformcontractinfoProgress = false;
				$scope.$apply();	
			},
			 error:function(result){
				$scope.taskPerformcontractinfoProgress = false;
			}
		});
	};
	
	// Function to update fields in contract (date and amount)
	$scope.ModifyDateandAmount = function(address,oldamount,oldDate)
	{
		if($scope.amount === ''){
			swal({
				title: $i18next.t("enter_amount"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}else{
			if($scope.etherBalance > 1){
				$scope.taskPerformcontractinfoProgress = true;
				var data = {"contractAddress":address,"newAmount":$scope.amount,"oldamount":oldamount,"newDate":$scope.mydate,"oldDate":oldDate,"comments":$scope.modifycomment,"languageselected":$scope.languageSelected};	
				console.log("modifyAmountAndDate request "+JSON.stringify(data));
				$.ajax({type: "POST",
					url: "/mainaccount/modifyAmountAndDate",
					data: JSON.stringify(data),
					dataType: 'json',
					contentType: 'application/json; charset=utf-8',
					success:function(result){
						if(result.error === null){
							getContractAddressforcontractModify(result.success,address);
						}else{
							$scope.taskPerformcontractinfoProgress = false;
							baseFactory.ModifyFieldsModal();
						}
					},
					error:function(result){
						$scope.taskPerformcontractinfoProgress = false;
						baseFactory.ModifyFieldsModal();
					}
				}); 
			}else{
				swal({
					title: $i18next.t("ether_balance_error"),
					showCancelButton:false,     
					confirmButtonText: $i18next.t("ok"),
					closeOnCOnfirm:true,						
				});
			}
		}
	};
	
	// Function to get contract address after modify fields transaction mined successfully
	function getContractAddressforcontractModify(transactionHash,address)
	{
		$.ajax({
			type: 'POST',
            url: $scope.webserviceUrl,
			async: false,
			data : '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'+transactionHash+'"],"id":1}',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function(response) {
				if(response.result === null){
					console.log("update "+response.result);
					$timeout(function() {
						getContractAddressforcontractModify(transactionHash,address);
					}, 3000);
				}else{
					console.log("done");
					$scope.taskPerformcontractinfoProgress = false;
					swal({
							title: $i18next.t("contract_updated_success"),
							showCancelButton:false,     
							confirmButtonText: statusArray.val.ok_en, 
							closeOnCOnfirm:true,						
						});
					baseFactory.ModifyFieldsModal();
					getcontractNameList();
					$scope.getcontractData(address);
					return false;
				}
			},
            error: function(error) {
            }
        });
	}
	
	// Function to add comments from task perform table 
	$scope.addcommentsfromTaskPerform = function(contractAddress,comment)
	{
		if($scope.etherBalance > 1){
			var data = {"contractAddress":contractAddress,"comments":comment};
			$scope.taskPerformcontractinfoProgress = true;
			$.ajax({type: "POST",
				url: "/mainaccount/addComment",
				data: JSON.stringify(data),
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				success:function(result){
					if(result.error === null){
						getContractAddressforaddcomment(result.success);
					}else{
						$scope.taskPerformcontractinfoProgress = false;
						baseFactory.taskPerformModalDismiss();
						$scope.$apply();
					}
				},
				error:function(result){
					$scope.taskPerformcontractinfoProgress = false;
				}
			});
		}else{
			swal({
				title: $i18next.t("ether_balance_error"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}
	};
	
	// Function to add comments from last action and history table 
	$scope.addcommentsfromlastAction = function(contractAddress,comment)
	{
		if($scope.etherBalance > 1){
			var data = {"contractAddress":contractAddress,"comments":comment};
			$scope.taskStatuscontractinfoProgress = true;
			$.ajax({type: "POST",
				url: "/mainaccount/addComment",
				data: JSON.stringify(data),
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				success:function(result){
					if(result.error === null){
						getContractAddressforaddcomment(result.success);
					}else{
						$scope.taskStatuscontractinfoProgress = false;
						baseFactory.taskStatusModalDismiss();
						$scope.$apply();
					}
				},
				error:function(result){
					$scope.taskPerformcontractinfoProgress = false;
				}
			});
		}else{
			swal({
				title: $i18next.t("ether_balance_error"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}
	};
	
	//Function get address after add comment transaction mined succefully
	function getContractAddressforaddcomment(transactionHash)
	{
		$.ajax({
            type: 'POST',
            url: $scope.webserviceUrl,
			async: false,
			data : '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'+transactionHash+'"],"id":1}',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function(response) {
				if(response.result === null){
				    $timeout(function(){
					    getContractAddressforaddcomment(transactionHash);
					}, 3000);
				}else{
					swal({
						title: $i18next.t("comment_add_success"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
				   $scope.taskStatuscontractinfoProgress = false;
				   baseFactory.taskStatusModalDismiss();
				   $scope.taskPerformcontractinfoProgress = false;
				   baseFactory.taskPerformModalDismiss();
				   $scope.$apply(); 
				   return false;
			    }
            },
            error: function(error) {
            }
        });
	}
	
	// Function to delete contract
	$scope.deleteContract = function(contractAddress)
	{
		swal({
			title: $i18next.t("confirm_delete"),
			showCancelButton:true,
			cancelButtonText: $i18next.t("no"),      
			confirmButtonText: $i18next.t("yes"),  
			closeOnCOnfirm:true,						
		},function(isConfirm){
			if(isConfirm){
				$.ajax({type: "GET",
					url: "/mainaccount/deleteContract/"+contractAddress,
					data: '',
					success:function(result){
						if(result== 'Deleted successfully'){
								swal({
									title: $i18next.t("contract_delete_success"),
									showCancelButton:false,     
									confirmButtonText: $i18next.t("ok"),
									closeOnCOnfirm:true,						
								});
								$scope.taskToPerformData.val=[];
								$scope.HistoryData.val = [];
								$scope.LastActionData.val = [];
								getcontractNameList();
								$scope.$apply();
							}else{
								swal({
									title: $i18next.t("contract_delete_error"),
									showCancelButton:false,     
									confirmButtonText: $i18next.t("ok"),
									closeOnCOnfirm:true,						
								});
							}
					},
					error:function(result){
					}
				});
			}
		});
	};
	
	// Function to publish contract
	$scope.publish = function(obj)
	{
		if($scope.etherBalance > 1){
			$scope.deployContractData = obj.contractinfo;
			$scope.searchId = obj.searchId;
			if($scope.selectedSupplier === ""){
				swal({
					title: $i18next.t("Please_Select_Supplier"),
					showCancelButton:false,     
					confirmButtonText: $i18next.t("ok"),
					closeOnCOnfirm:true,						
				});
			}else{
				baseFactory.showPageProgress();	
				compileContract();
			}
			
		}else{
			swal({
				title: $i18next.t("ether_balance_error"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}
	};
	
	//Function to get user details
	function getuseraddress()
	{
		$.ajax({type: "GET",
            url: "/getUserAddress",
			async: false,
            data: "",
            success:function(result){
				$scope.UserData = result;
            },
			error:function(result){
				$scope.UserData = "error";
			}
       }); 
	}
	
	// Function to compile contract
	function compileContract()
	{
		//baseFactory.showPageProgress();
		$.ajax({
			type: "GET",
			url: "/compileContract",
			data:"",
			async: true,
			success :function(result){
				$scope.compilData = result;
				console.log("compile contract "+JSON.stringify(result));
				if($scope.compilData.error == 'Error in contract'){
					baseFactory.hidePageProgress();
				}else{
					deployContract();
				}
			},
			error:function(result){
				$scope.compilData = "error";
			}
		});
	}
	
	//Function to deploy contract
	function deployContract()
	{
		var code = $scope.compilData.code;
		$scope.compilData.contractNumber = $scope.deployContractData.ContractNumber;
		$scope.deployContractData.code = code;
		$scope.deployContractData.abi = $scope.compilData.abi;
		$.ajax({
            type: 'POST',
            url: '/mainaccount/deployContract',
			data : JSON.stringify($scope.deployContractData),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function(response) {
				if(response.error === null){
					swal({
						title: $i18next.t("deploy_contract_success"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
					$scope.deployedResult = response;
					console.log("deploy contract "+JSON.stringify(response));
					getContractAddress();
				}else{
					swal({
						title: $i18next.t("deploy_contract_error"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
					$scope.deployedResult = "error";
					baseFactory.hidePageProgress();
				}
            },
            error: function(error) {
				swal({
					title: $i18next.t("deploy_contract_error"),
					showCancelButton:false,     
					confirmButtonText: $i18next.t("ok"),
					closeOnCOnfirm:true,						
				});
				$scope.deployedResult = "error";
				baseFactory.hidePageProgress();
            }
        });
	}
	
	//Function get contract address after deploy and transaction mined succefully
	function getContractAddress()
	{
		$.ajax({
            type: 'POST',
            url: $scope.webserviceUrl,
			async: false,
			data : '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'+$scope.deployedResult.result+'"],"id":1}',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function(response) {
			    if(response.result === null){
				    $timeout(function() {
					   getContractAddress();
					}, 3000);
			    }
			    else{
				   $scope.contractAddress =  response.result.contractAddress;
				   savecontractData();
				   return false;
			    }
            },
            error: function(error) {
            }
        });
	}
	
	// Function to store contract address in db
	function savecontractData()
	{
		var data = {"address":$scope.contractAddress,"Abi":$scope.compilData.abi,"contractNumber":$scope.compilData.contractNumber};
		$.ajax({
			type: "POST",
			url: "/mainaccount/SaveContractAddress",
			async: true,
			data: data,
			success :function(result){
				console.log("SaveContractAddress "+JSON.stringify(result));
				if(result.result == "inserted succefully"){
					addparts();
				}
				else{
					baseFactory.hidePageProgress();
				}
			},
			error:function(result){
			}
		});
	}
	
	// Function to add parts in deployed contract
	function addparts()
	{
		var data = {"contractNumber":$scope.deployContractData.contractNumber,"supplierName" : $scope.selectedSupplier,"partInfo":$scope.deployContractData.tasks,"address":$scope.contractAddress,"Abi":$scope.compilData.abi,"languageselected":$scope.languageSelected};
		$.ajax({
			type: "POST",
			url: "/mainaccount/addpartsincontract",
			async: false,
			data: JSON.stringify(data),
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success :function(result){
				console.log("addpartsincontract "+JSON.stringify(result));
				if(result.error === null){
					$scope.res = false;
					$scope.taskToPerformData.val = [];
					$scope.HistoryData.val = [];
					removecontractfromcookie($scope.deployContractData);
					swal({
						title: $i18next.t("add_contract_info_success"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
					
				}
			},
			error:function(result){
					$scope.res = false;
					baseFactory.hidePageProgress();
			}
		});
	}
	
	// Function to remove contract from cookies after deploy
	function removecontractfromcookie(removeData)
	{
		var value = JSON.parse($cookies.get('searchData'));
		for (var i = 0; i < value.length; i++){
			if (value[i].contractNumber == removeData.ContractNumber){
				value.splice(i, 1);
			}
		}
		$scope.searchDataCookies = [];
		$scope.taskToPerformData.val = value;
		$cookies.remove('searchData');
		$cookies.put("searchData", JSON.stringify(value));
		getcontractNameList();
		baseFactory.hidePageProgress();	
		$scope.$apply();
	}
	
	// Function to get peers information
	$scope.getPeersInfo = function()
	{
		$scope.PeersModalProgress = true;
		$scope.PeerInfo = '';
		$.ajax({
            type: 'POST',
            url: 'http://localhost:8545',
            async: false,
            data : '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":75}',  //admin_addPeer
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function(response) {
				$scope.NodeInfo = response.result.enode;
				$scope.PeersModalProgress = false;
            },
            error: function(error) {
            }
        });
	};
	
	// Function to add peers
	$scope.addPeers = function()
	{
		if($scope.PeerInfo !=='' && $scope.PeerInfo!== undefined)
		{
			$.ajax({
                type: 'POST',
                url: 'http://localhost:8545',
                async: false,
                data : '{"jsonrpc":"2.0","method":"admin_addPeer","params":["'+$scope.PeerInfo+'"],"id":75}',  //admin_addPeer
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                success: function(response) {
					if(response.result === true){
					    baseFactory.DissmissPeersModal();
						swal({
							title: $i18next.t("add_peer_success"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
				    }else {
					    baseFactory.DissmissPeersModal();
						swal({
							title: $i18next.t("add_peer_error"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
				    }
                },
                error: function(error) {
					baseFactory.DissmissPeersModal();
					swal({
						title: $i18next.t("add_peer_error"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
                }
            });
		}else{
			swal({
				title: $i18next.t("add_peer_error"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}
	};
	
	//Function to clear cookies and redirect after logout
	$scope.logout = function()
	{
		$cookies.remove('username');
		$cookies.put("username","");
		sessionStorage.UserName = "";
		$cookies.remove('searchData');
		$cookies.remove('myValue');
		window.location = "/logout";
	};
}]);

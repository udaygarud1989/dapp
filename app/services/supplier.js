"use strict";
/*globals $:false */
/*globals swal:false */
/*globals angular:false */
/*
=========================================================================================
File description:
    Filename     : supplier.js
    Module       : Supplier Account client side module (AngularJs)
	Dependency   : 
				   js/angular-locale_en.js
				   js/angular-locale_fr.js
    Description  :
	               This file contains Javascript code for Supplier Account data representation and manipulation.
    Developed By : PLM LOGIX
=========================================================================================
Date                    Name                           Description of Change
20-Dec-2016             Nisha Mane                     Initial Version
24-Dec-2016             Nisha Mane                     Added function to get user details
26-Dec-2016             Uday Garud                     Added function to start or stop miner
06-Jan-2017             Nisha Mane                     Added function to get list of available contract 
06-Jan-2017             Nisha Mane                     Added function to get contract information for selected contract
06-Jan-2017             Nisha Mane                     Added function to get contract information modal data
10-Jan-2017             Nisha Mane                     Added function to get task perform table data 
11-Jan-2017             Nisha Mane                     Added function to get History table data  
11-Jan-2017             Nisha Mane                     Added function to get Last action table data
16-Jan-2017             Uday Garud                     Added service for localization in english and french language
16-Jan-2017             Uday Garud                     Added factory method for localization in selected language
16-Jan-2017             Nisha Mane                     Added directive method to open bootstrap popover on remark field
18-Jan-2017             Nisha Mane                     Added function to accept or reject contract
18-Jan-2017             Nisha Mane                     Added function to get address after transaction mined successfully
19-Jan-2017             Nisha Mane                     Added function add comments in contract
20-Jan-2017             Nisha Mane                     Added function to get contract address after add comment transaction mined successfully
20-Jan-2017             Uday Garud                     Added function to get instruction from server
23-Jan-2017             Nisha Mane                     Added factory method to display loading symbol
23-Jan-2017             Nisha Mane                     Added function get ether balance of user
06-Feb-2017             Nisha Mane                     Added function to get status from config.js file
08-Feb-2017             Uday Garud                     Added function to get peers information
08-Feb-2017             Uday Garud                     Added function to add peers
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
		lng: 'en', // If not given, i18n will detect the browser language.
		fallbackLng: 'en', // Default is dev
		"returnObjects": true,
		backend: {
			loadPath: '../locales/{{lng}}/{{ns}}.json'
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

app.run(function(Idle,$rootScope,$cookies) {  
	Idle.watch();
	$rootScope.$on('IdleTimeout', function() {
		$cookies.remove('searchData');
		$cookies.remove('myValue');
		window.location = "/logout";				
    });
});
  
// Directive to open bootstrap popover
app.directive('popover', function() {
    return function(scope, elem) {
        elem.popover();
   };
}); 

// Factory method to display loading symbol
app.factory('baseFactory', function () {
    return {
        taskPerformModalDismiss : function () {
			$('#taskPerformModal').modal('hide');
        },
		taskStatusModalDismiss : function () {
			$('#taskStatusModal').modal('hide');
        },
		taskStatusDetailsModal : function () {
			$('#taskStatusDetailsModal').modal('hide');
        },
		DissmissPeersModal : function () {
			$('#PeersModal').modal('hide');
        }
	};
});

// App controller
app.controller('SupplierCtrl',['$cookies','$rootScope','$scope','$http','$timeout','$window','$i18next','baseFactory','moment',function($cookies,$rootScope,$scope,$http,$timeout,$window,$i18next,baseFactory,moment) {
	$scope.loaded = false;
    $scope.languageSelected	 = 'en';
    $timeout(function() { 
		$scope.loaded = true; 
	}, 3000);
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
	if($cookies.get('selectedlocale')==''||$cookies.get('selectedlocale')=== undefined){
		$scope.model = {selectedLocale: 'en'};
        $scope.changeLngfromjs($scope.model.selectedLocale);
    }
    else{
        $scope.model = {selectedLocale: $cookies.get('selectedlocale')};
        $scope.changeLngfromjs($scope.model.selectedLocale);
    }
	//Start of initialize global variables
	$scope.res = false;  
	$scope.taskStatusProgressBar = false;
	$scope.taskToPerformProgressBar = false;
	$scope.webserviceUrl = 'http://localhost:8545';
	$scope.contractAddress = '';
	$scope.colours = [ "#1e8449", "#f39c12" , "#000"];
	var statusArray = {
		val:{}
	};
	var mainAccountInstructions = {
		val:[]
	};
	var supplierTaskVal = {
		val:[]
	};	
	var supplierStatusSummaryVal ={
		val:[]
	};
	var supplierTaskValPer = {
		val:[]
	};
	var taskStatusDetails = {
		val:{}
	};
	$scope.supplierStatusSummary = supplierStatusSummaryVal;
	$scope.supplierTaskStatusData = supplierTaskVal;
	$scope.supplierTaskStatusDetails = taskStatusDetails;
	$scope.mainAccountInstructions = mainAccountInstructions;
	$scope.statusArray = statusArray;
	$scope.supplierTaskPerformData = supplierTaskValPer;		
	//End of initialize global variables
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
	
	getuseraddress();
	setTimeout(function(){
        onLoad();
    },1000);	
	
	// Function executed on page load
	function onLoad()
	{
		//Function call to get ether balance of user
		getEtherofUser();
		//Ajax call to start mining on page load
		$scope.miningText = "Start Mining";	
		$.ajax({
			type: 'POST',
			url: 'http://localhost:8545',
			async: false,
			data : '{"jsonrpc":"2.0","method":"eth_mining","params":[2],"id":75}',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success: function(response) {  
				if(response.result === true){	
				    $scope.miningText = "Stop Mining";
				}else if(response.result === false){
					$scope.miningText = "Start Mining";
					//valChangeMining();
				}   
		    },
			error: function(error) {
			}
		});
		// Function call to get available contract list
		getstatusfromfile();
		getAvailableContracts();	
		
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
	
	// Function get ether balance of user
	function getEtherofUser()
	{	
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
			error:function(result){	
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
	
	//Function to get list of available contract 
	function getAvailableContracts()
	{
		$scope.contractNameList=[];
		$scope.availablecontracts=[];
		$scope.completedcontracts=[];
		$.ajax({
			type: 'GET',
			url: '/supplieraccount/getAvailableContracts',
			async: false,
			data : '',
			success:function(result){
				$scope.contractNameList=result;
				if($scope.contractNameList.length === 0){
					/* swal({
						title: $i18next.t("contract_info_not_found"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					}); */
				}else{
					for(var i=0;i<$scope.contractNameList.length;i++){
						var len = gettaskperformdatalength($scope.contractNameList[i].contractAddress);
						// if(len === 0){
						// 	$scope.completedcontracts.push($scope.contractNameList[i]);
						// } else {
						// 	$scope.availablecontracts.push($scope.contractNameList[i]);
						// }
						if($scope.contractNameList[i].iscomplete){
							$scope.completedcontracts.push($scope.contractNameList[i]);
						}else{
							$scope.availablecontracts.push($scope.contractNameList[i]);
						}
						$scope.contractNameList[i].noofTask = len;
					}
					
					//$scope.getcontractData($scope.contractNameList[0].contractAddress);
				}
			},
			error:function(result){
			}
		});
	}
	
	//Function to get no of task perform data;
	function gettaskperformdatalength(contractAddress)
	{
		var count = 0;
		$.ajax({
			type: 'GET',
			url: '/supplieraccount/getTaskPerformData/'+contractAddress,
			async: false,
			data : '',
			success:function(result){
				$scope.modifyFields = false;
				for(var i=0;i <result.length;i++){
					if(result[i].issigned == 'true'){ // if contract accepted
						count++;
					}else if(result[i].status == statusArray.val.pending){
							count++;
					}
				}
			},
			error:function(result){
				
			},
		});
		return count;
	}
	
	// Function to get contract information for selected contract
	$scope.getcontractData = function(contractAddress) {
		$scope.supplierTaskPerformData.val=[];
		$scope.supplierTaskStatusData.val=[];
		$scope.supplierStatusSummary.val = [];
		getTaskperformData(contractAddress);
		getLastActionData(contractAddress);
		getHistoryData(contractAddress);
	};
	
	// Function to get task perform table data 
	function getTaskperformData(contractAddress) {
		$scope.taskToPerformProgressBar = true;
		$.ajax({
			type: 'GET',
			url: '/supplieraccount/getTaskPerformData/'+contractAddress,
			data : '',
			success:function(result){
				$scope.supplierTaskPerformData.val=[];
				for(var i=0;i <result.length;i++){
					var flag = false;
					if(result[i].issigned == 'true'){ // if contract accepted
						result[i].showAssignBtn = true;
					}else {
						result[i].issigned = true;
						result[i].btnTextColorVal = true;
						result[i].showAssignBtn = false;  // hide assign button and show review btn
						console.log("status "+statusArray.val.pending);
						if(result[i].status == statusArray.val.pending){
							result[i].disbaleReview = false;
							result[i].btncolorReview = false;
						}else{
							result[i].disbaleReview = true;
							result[i].btncolorReview = true;
							flag = true;
							//result.splice(i, 1);
						}
					}
					$scope.supplierTaskPerformData.val.push(result[i]);
					if(flag){
						$scope.supplierTaskPerformData.val.splice(i, 1);
					}
					$scope.contractAddress = result[i].contractAddress;
				} 
				$scope.TaskPerformCount = gettaskperformdatalength(contractAddress);
				
			},
			error:function(result){
				
			},complete:function(data){	
				$scope.taskToPerformProgressBar = false;
				$scope.$apply();
			}
		});
	}
	
	// Function to get History table data  
	function getHistoryData(contractAddress)
	{
		$scope.taskStatusProgressBar = true;
		var mainaccount_name = "",supplier_name="";
		$scope.mainaccount_details = "";
		$scope.supplier_details = "";
		$scope.data = [];
		$scope.labels = [];
		$scope.supplierTaskStatusData.val=[];
		var mainaccount_total_time =0;
		var supplier_total_time =0;
		var mainaccount = [];
		var supplier = [];
		$.ajax({type: "GET",
			url: "/supplieraccount/getLastActionData/"+contractAddress,
			data: '',
			success:function(result){
				$scope.supplierTaskStatusData.val=[];
				var contractName = '';
				var contractDate = '';
				var contractAddress = '';
				$scope.taskStatusProgressBar = false;
				$scope.$apply();	
				for(var i=0;i <result.length;i++){
					if(result[i].partinfoId === undefined){
						contractName = result[i].ContractName;
						contractDate = result[i].DateCreated;
						contractAddress = result[i].contractAddress;
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
						$scope.supplierTaskStatusData.val.push(result[i]);	
					}
					if(result[i].partinfoId !== undefined && result[i].partinfoId !==''){
						$scope.supplierTaskStatusData.val.push({"contractAddress": contractAddress,"ContractName": contractName,"owner": result[i].suppliername,"status": statusArray.val.pending,"DateCreated": contractDate});
					}
					$scope.taskProg = false;
					$scope.$apply();
				}
				
				for(var j=0;j<mainaccount.length;j++){
					console.log("status "+mainaccount[j].status);
					if(mainaccount[j].status === statusArray.val.pending){
						if(j+1 < mainaccount.length){
							mainaccount_total_time = mainaccount_total_time + getHours(mainaccount[j].DateCreated,mainaccount[j+1].DateCreated);
							console.log("end time "+getHours(mainaccount[j].DateCreated,mainaccount[j+1].DateCreated));
						}
					}
				}
				
				for(var k=0;k<supplier.length;k++){
					console.log("status "+supplier[k].status);
					if(supplier[k].status === statusArray.val.pending){
						if(k+1 < supplier.length){
							supplier_total_time = supplier_total_time + getHours(supplier[k].DateCreated,supplier[k+1].DateCreated);
							//console.log("end time "+supplier[j].DateCreated);
						}
					}
				}
				$scope.labels = ["Main Account ("+mainaccount_name+" )","Supplier ("+supplier_name+" )"];
				$scope.data.push(mainaccount_total_time);
				$scope.data.push(supplier_total_time);
				$scope.mainaccount_details = "Main Account ("+mainaccount_name+" ) : "+getDataHR(mainaccount_total_time);
				$scope.supplier_details = "Supplier ("+supplier_name+" ) : "+getDataHR(supplier_total_time);
				$scope.taskStatusProgressBar = false;
				$scope.$apply();
			},
			error:function(result){
			},
			complete:function(data){	
				$scope.taskStatusProgressBar = false;
				$scope.$apply();
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
		var minutes = (humanReadable.hours*60) + humanReadable.min;
		console.log("total time "+minutes);
		return minutes;
		//console.log("%## "+minDiff);
		/* if(humanReadable.hours<1){
			
			return (Math.ceil(parseFloat("0."+ humanReadable.min)));
		}
		  
		else{
			return humanReadable.hours;
		}   */
	}
	
	function getDataHR (newMinutes) {
		//var MINS_PER_YEAR = 24 * 365 * 60
		//var MINS_PER_MONTH = 24 * 30 * 60
		//var MINS_PER_WEEK = 24 * 7 * 60
		var MINS_PER_DAY = 24 * 60
		var MINS_PER_HOUR = 60;
		var minutes = newMinutes;
		var days = Math.floor(minutes / MINS_PER_DAY);
		 minutes = minutes - days * MINS_PER_DAY;
		 var hours = Math.floor(minutes / MINS_PER_HOUR);
		 minutes = minutes - hours * MINS_PER_HOUR;
		return days + " day(s) " +hours + " hour(s) " + minutes + " minute(s)";
		//return hrData; // 1 year, 2 months, 2 week, 2 days, 12 minutes
	}
	
	//Function to get Last action table data
	function getLastActionData(contractAddress)
	{
		$scope.statusSummaryProgressBar = true;
		$scope.supplierStatusSummary.val=[];
		$.ajax({type: "GET",
			url: "/supplieraccount/getLastActionData/"+contractAddress,
			data: '',
			success:function(result){
				$scope.supplierStatusSummary.val=[];
				$scope.statusSummaryProgressBar = false;
				for(var i=0;i <result.length;i++){
					if(result[i].owner == $scope.UserData.username){
						$scope.supplierStatusSummary.val.push(result[i]);
					}
					$scope.$apply();
				}
				console.log("getLastActionData "+JSON.stringify($scope.supplierStatusSummary.val))
			},
			error:function(result){		
			},
			complete:function(data){	
				$scope.statusSummaryProgressBar = false;
				$scope.$apply();
			}
		});
	}
	
	//Function to get contract information modal data
	$scope.getContractInformation = function(obj)
	{		
		$scope.taskPerformInfoProgress = true;
		$scope.showcommenttext = false;
		$scope.taskstatuscomment="";
		$scope.partInfoComment='';
		$scope.supplierTaskStatusDetails.val = [];
		$scope.onActionContractAddress = obj.contractAddress;	 
		$.ajax({type: "GET",
			url: "/supplieraccount/getContractInformation/"+obj.contractAddress,
			data: '',
			success:function(result){	
				if(obj.status == statusArray.val.accepted){
					$scope.disableAction = true;
					$scope.btnTextColorVal = false;
				}else{
					$scope.btnTextColorVal = true;
					$scope.disableAction = false;
				}
				if(result.lastAction == statusArray.val.accepted){
					$scope.disableComment = true;
				}else{
					$scope.disableComment = false;
				}
				$scope.supplierTaskStatusDetails.val = result;
				$scope.supplierTaskStatusDetails.val.partInfo = $i18next.t(result.contractNumber+".TaskList");
				$scope.taskPerformInfoProgress = false;
				$scope.showcommenttext = true;
				$scope.supplierTaskStatusDetails.val.contractAddress = obj.contractAddress;
				$scope.$apply();	
			},
			error:function(result){
			},
			complete:function(data){	
				$scope.taskPerformInfoProgress = false;
				$scope.$apply();
			}
		});	
	};
		
	//Function to accept or reject contract
	$scope.contractDecision = function(status,address)
	{
		if($scope.etherBalance > 1){
			$scope.taskPerformInfoProgress = true;
			var contractStatus;
			var isSigned;
			if($scope.partInfoComment === '' || $scope.partInfoComment === undefined){
				swal({
					title: $i18next.t("enter_comment"),
					showCancelButton:false,     
					confirmButtonText: $i18next.t("ok"),
					closeOnCOnfirm:true,						
				});
				$scope.taskPerformInfoProgress = false;
			}else{
				if(status === 'Accepted'){
					contractStatus = statusArray.val.accepted;
					isSigned = true;
				}else{
					contractStatus =  statusArray.val.rejected;
					isSigned = false;
				}
				var data = {"contractAddress":address,"status":contractStatus,"comment":$scope.partInfoComment,"isSigned":isSigned,"languageselected":$scope.languageSelected};
				$.ajax({
					type: 'POST',
					url: '/supplieraccount/contractDecisionBySupplier',
					async: false,
					data : JSON.stringify(data),
					dataType: 'json',
					contentType: 'application/json; charset=utf-8',
					success: function(response) {		
						if(response.error === null){
							getContractAddress(response.result,contractStatus,address);
						}else{
							baseFactory.taskStatusModalDismiss();
						}   
					},
					error: function(response) {
						baseFactory.taskStatusModalDismiss();
						$scope.taskPerformInfoProgress = false;
					}
				});  
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
		
	//Function add comments in contract
	$scope.addcomments = function(contractAddress,comment)
	{
		if($scope.etherBalance > 1){
			var data = {"contractAddress":contractAddress,"comments":comment};
			$scope.taskPerformInfoProgress = true;
			$.ajax({type: "POST",
				url: "/supplieraccount/addComment",
				data: JSON.stringify(data),
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				success:function(result){
					if(result.error === null){
						getContractAddressforaddcomment(result.success);
					}else{
						$scope.taskPerformInfoProgress = false;
						baseFactory.taskStatusDetailsModal();
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
	
	//Function to get contract address after add comment transaction mined successfully
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
				   $timeout(function() {
					    getContractAddressforaddcomment(transactionHash);
					}, 3000);
			    }else{
					swal({
						title: $i18next.t("comment_add_success"),
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
					$scope.taskPerformInfoProgress = false;
					baseFactory.taskStatusDetailsModal();
					$scope.$apply(); 
				    return false;
			    }
            },
            error: function(error) {
            }
        });
	}
	
	//Function to start or stop miner
	$scope.changeMining = function()
		{
			valChangeMining();
		};
	function valChangeMining()
	{	
		if($scope.miningText == "Start Mining"){
			$.ajax({
				type: 'POST',
				url: $scope.webserviceUrl,
				async: false,
				data : '{"jsonrpc":"2.0","method":"miner_start","params":[],"id":74}',
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
				success: function(response) {	   
					if(response.result === true){
						$scope.miningText = "Start Mining";
					}else{
						/* swal({
							title: $i18next.t("stop_mining_error"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						}); */
					}
				},
				error: function(error) {
				}
			});
		}
	}
		
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
	
	//Function to get address after transaction mined successfully
	function getContractAddress(transactionHash,status,contractadd)
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
					$timeout(function() {
					    getContractAddress(transactionHash,status,contractadd);
					}, 3000);
			    }else{
				    $scope.contractAddress =  response.result.contractAddress;
				    if(status == statusArray.val.accepted){
						swal({
							title: $i18next.t("contract_accept_success"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
					} else if(status == statusArray.val.rejected){
						swal({
							title: $i18next.t("contract_reject_success"),
							showCancelButton:false,     
							confirmButtonText: $i18next.t("ok"),
							closeOnCOnfirm:true,						
						});
						getAvailableContracts();
					}
					$scope.taskPerformInfoProgress = false;
					baseFactory.taskStatusModalDismiss();
					$scope.getcontractData(contractadd);  
				    return false;
				}
            },
            error: function(error) {
            }
        });
	}
	
	//Function to get address after job assigned transaction mined successfully
	function getContractAddressforAssign(transactionHash,contractadd,AssignUser)
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
					$timeout(function() {
						getContractAddressforAssign(transactionHash,contractadd,AssignUser);
					}, 3000);
				}else{
					$scope.contractAddress =  response.result.contractAddress;
				    $scope.taskPerformAssignProgress = false;
				    baseFactory.taskPerformModalDismiss();
					getAvailableContracts();
				    $scope.getcontractData(contractadd);
					swal({
						title: $i18next.t("job_assigned_success")+" to "+AssignUser,
						showCancelButton:false,     
						confirmButtonText: $i18next.t("ok"),
						closeOnCOnfirm:true,						
					});
					return false;
			    }
            },
            error: function(error) {
            }
        });
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
		if($scope.PeerInfo !== '' && $scope.PeerInfo!== undefined){
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
					}else{
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
				title: $i18next.t("enter_peer"),
				showCancelButton:false,     
				confirmButtonText: $i18next.t("ok"),
				closeOnCOnfirm:true,						
			});
		}
	};
	
	//Function to clear cookies and redirect after logout
	$scope.logout = function()
	{
		$cookies.remove('myValue');
		window.location = "/logout";
	};
	
}]);
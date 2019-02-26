/*
=========================================================================================
File description:
    Filename    : mainaccount.js
    Module      : Main Account Module
	Dependency  : 
			      ../config.js
				  ./mail.js
				  /../requestdata/data.json
				  ../dbmodels/users.js
				  ../dbmodels/contractInfo.js
	Description :
			      This file contains server side code for executing client side requests of Main Account
	Developed By: PLM LOGIX
=========================================================================================
Date         	Developer Name          Description of Change
19-Dec-2016  	Uday Garud              Initial Version
19-Dec-2016  	Uday Garud              Added imports and global variables
20-Dec-2016  	Uday Garud              Added function to connect to mongodb database
21-Dec-2016  	Uday Garud              Added function to encrypt user password (encrypt)
21-Dec-2016  	Uday Garud              Added function to decrypt user password (decrypt)
24-Dec-2016  	Nisha Mane              Added function to return username from db using user address (getusername)
24-Dec-2016  	Nisha Mane              Added function to return user address from db using username (getaddressforuser)
24-Dec-2016  	Nisha Mane              Added function to get user's email from db (getUserEmail)
26-Dec-2016  	Uday Garud              Added function to unlock ethereum account (unlockAccount)
27-Dec-2016  	Uday Garud              Added function to deploy contract (deployContract)
27-Dec-2016  	Uday Garud              Added function get current date and time (getDateTime)
27-Dec-2016  	Uday Garud              Added function to return contract abi from db using contract address (getContractAbi)
29-Dec-2016  	Uday Garud              Added service to save contract address and abi in db after succssefully deploying contract
30-Dec-2016  	Uday Garud              Added function to add parts in deployed contract (addpartsincontract)
02-Jan-2017  	Nisha Mane              Added function to add assignee in contract (AddAssignee)
03-Jan-2017  	Nisha Mane              Added function to search contract using contract number (search)
05-Jan-2017  	Uday Garud              Added function to get list of available contracts (getcontractNumbersDataforMainAccount)
05-Jan-2017  	Nisha Mane              Added function to send ether (sendether)
09-Jan-2017  	Uday Garud              Added function to get task perform table data for main account (getMainAccountTaskPerformData)
10-Jan-2017  	Nisha Mane              Added function to get last action data for main account (getLastActionData)
11-Jan-2017  	Uday Garud              Added function to get contract information for last action table (getContractInformationData)
12-Jan-2017  	Uday Garud              Added function to get contract information for task perform table for main account (getMainAccountContractInfoData)
16-Jan-2017  	Nisha Mane              Added function to add comments in contract (AddComment)
19-Jan-2017  	Nisha Mane              Added function to update amount and date in contract (modifyAmountAndDate)
19-Jan-2017  	Nisha Mane              Added function to update supplier's status after date and amount modified (UpdateStatusforSupplierAfterModify)
20-Jan-2017  	Nisha Mane              Added function to delete contract (deleteContract)
23-Jan-2017  	Uday Garud              Modified function (getMainAccountTaskPerformData)
30-Jan-2017  	Nisha Mane              Modified function (UpdateStatusforSupplierAfterModify)
07-Feb-2017  	Nisha Mane              Modified function (getLastActionData)
16-Feb-2017  	Nisha Mane              Moved function to common module(getUserEmail)
16-Feb-2017  	Uday Garud              Moved function to common module (getContractAbi)
16-Feb-2017  	Nisha Mane              Moved function to common module (getusername)
17-Feb-2017  	Nisha Mane              Moved function to common module (getaddressforuser)
17-Feb-2017  	Uday Garud              Moved function to common module (unlockAccount)
17-Feb-2017  	Uday Garud              Moved function to common module (decrypt)
=======================================================================================
*/
/* jshint node: true */

// Start of imports and global variable declarations
"use strict";
var express = require('express');
var props = require('../config/config');
var common = require('./common');
var mail = require('./mail');
var router = express.Router();
var fs = require("fs");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var wait = require('wait.for');
var dateFormat = require('dateformat');
var trycatch = require('trycatch');
var sprintf = require("sprintf-js").sprintf;
var jsdom = require('jsdom');
var users = require('../dbmodels/users');
var contractInfo = require('../dbmodels/contractInfo');
// End of imports and global variable declarations

// Service to get  contract number
router.get('/getContractsNumber', function(req, res) {
	var json = {};
	json.contList = [];
    var obj = [];
    fs.readFile(__dirname + '/../requestdata/data.json', 'utf8', function(err, data) {
        obj = JSON.parse(data);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var abc = obj[key];
                for (var a in abc) {
					json.contList.push(abc[a].ContractNumber);
                }
            }
        }
        res.send(json);
    });
});

// Service to search contract using contract number
router.get('/search/:id', function(req, res) {
    wait.launchFiber(SearchHandler, req, res);
});

// Fiber to search contract using contract number
function SearchHandler(req, res) {
    var result = wait.for(Search, req);
    res.send(result);
}

// Function to search contract using contract number
function Search(req, callback) {
    var json = {};
    var obj = [];
    fs.readFile(__dirname + '/../requestdata/data.json', 'utf8', function(err, data) {
        obj = JSON.parse(data);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var abc = obj[key];
                for (var a in abc) {
                    if (abc[a].ContractNumber == req.params.id) {
                        abc[a].data = "Search Data";
                        json = abc[a];
                    }
                }
            }
        }
        callback(null, json);
    });
}

// Service to get list of available contracts
router.get('/getcontractNamelistforMainAccount', function(req, res) {
    wait.launchFiber(GetcontractNumbersforMainAccountHandler, req, res);
});

// Fiber to get list of available contracts
function GetcontractNumbersforMainAccountHandler(req, res) {
    var result = wait.for(GetcontractNumbersDataforMainAccount, req);
    for (var i = 0; i < result.length; i++) {
        var abc = wait.for(common.getusername, result[i].owner);
        result[i].owner = abc;
    }
    res.send(result);
}

// Function to get list of available contracts
function GetcontractNumbersDataforMainAccount(req, callback) {
	contractInfo.getAllContracts((err,results)=>{
		if(err){
			callback(null, json);
		} else if(results === null){
			callback(null, json);
		} else {
			results.forEach(function(doc){
				var json = [];
				if (doc !== null) {
					trycatch(function() {
						var obj = {};
						var abiJson = JSON.parse(doc.abi);
						var Multiply7 = web3.eth.contract(abiJson);
						var multi = Multiply7.at(doc.contractAddress);
						if (req.session.address === multi.owner()) {
							obj.contractNumber = multi.contractNumber();
							obj.contractAddress = doc.contractAddress;
							obj.ContractDescription = multi.contractDescription();
							obj.ContractOwnedby = multi.contractOwnedby();
							var getLastactionStatuscount = multi.getstatusupdateCount();
							var getLastactionStatus =  multi.getstatusupdate(getLastactionStatuscount - 1);
							var arr = getLastactionStatus.toString().split(",");
							if(arr[3] !=undefined){
								if(arr[3] ==="Authorization Pass" ||arr[3] ==="Completed"){
									obj.iscomplete = true;
								}else{
									obj.iscomplete = false;
								}
							}else{
								obj.iscomplete = false;
							}
							obj.version = "v"+doc.version;
							json.push(obj);
						}
						callback(null, json);
					}, function(err) {
						callback(null, json);
					});
				} else {
					callback(null, json);
				}
			});
		}
	});
}

// Service to get task perform table data for main account
router.get('/getTaskPerformData/:contractAddress', function(req, res) {
    wait.launchFiber(GetMainAccountTaskPerformHandler, req, res);
});

// Fiber to get task perform table data for main account
function GetMainAccountTaskPerformHandler(req, res) {
    var result = wait.for(GetMainAccountTaskPerformData, req);
    for (var i = 0; i < result.length; i++) {
        var abc = wait.for(common.getusername, result[i].owner);
        result[i].owner = abc;
    }
    res.send(result);
}

// Function to get task perform table data for main account
function GetMainAccountTaskPerformData(req, callback) {
	contractInfo.getContractInfo(req.params.contractAddress,(err,doc)=>{
		var json = [];
		if(err){
			callback(null, json);
		} else if (doc !== null) {
            var obj = {};
            var status = [];
            var abiJson = JSON.parse(doc.abi);
            var Multiply7 = web3.eth.contract(abiJson);
            var multi = Multiply7.at(req.params.contractAddress);
            var updateCount = multi.getstatusupdateCount();
            for (var j = 0; j < updateCount.toString(); j++) {
                var updateInfo = multi.getstatusupdate(j);
                var splitArr = [];
                var arr = updateInfo.toString().split(",");
                for (var k = 0; k < arr.length; k++) {
                    splitArr.push(arr[k]);
                }
                if (splitArr[1] == req.session.address) {
                    status.push(splitArr[3]);
                }
            }
            if (status.length > 0) {
				obj.status = common.getstatustext(status[status.length - 1]);
            }
            if (multi.owner() == req.session.address) {
                obj.contractNumber = multi.contractNumber();
                obj.contractAddress = doc.contractAddress;
                obj.ContractDescription = multi.contractDescription();
                obj.ContractOwnedby = multi.contractOwnedby();
                obj.data = "Rejected Data";
                obj.isrejected = false;
                json.push(obj);
            }
            var assigneeCount = multi.getassigneeCount();
            for (var i = 0; i < assigneeCount.toString(); i++) {
                var assignee = multi.getassignee(i);
                var assigneeSplitArr = [];
                var assigneeArr = assignee.toString().split(",");
                for (var m = 0; m < assigneeArr.length; m++) {
                    assigneeSplitArr.push(assigneeArr[m]);
                }
                if (i == 1 && assigneeSplitArr[3] == props.status_rejected) {
                    obj.isrejected = true;
                }
            }
        } else {
            callback(null, json);
        }
	});
}

// Service to get last action data for main account
router.get('/getLastActionData/:contractAddress', function(req, res) {
    wait.launchFiber(GetLastActionDataHandler, req, res);
});

// Fiber to get last action data for main account
function GetLastActionDataHandler(req, res) {
    var lastActionData = wait.for(GetLastActionData, req);
    for (var i = 0; i < lastActionData.length; i++) {
        var abc = wait.for(common.getusername, lastActionData[i].owner);
		var role = wait.for(common.getRole,lastActionData[i].owner);
        lastActionData[i].owner = abc;
		lastActionData[i].role = role;
    }
    res.send(lastActionData);
}

// Function to get last action data for main account
function GetLastActionData(req, callback) {
	contractInfo.getContractInfo(req.params.contractAddress,(err,doc)=>{
		var json = [];
		if(err){
			callback(null,json);
		} else  if (doc !== null) {
            trycatch(function() {
                var abiJson = JSON.parse(doc.abi);
                var Multiply7 = web3.eth.contract(abiJson);
                var multi = Multiply7.at(doc.contractAddress);
                if (req.session.address === multi.owner()) {
                    var updateCount = multi.getstatusupdateCount();
                    for (var i = 0; i < updateCount.toString(); i++) {
                        var obj = {};
                        obj.contractAddress = doc.contractAddress;
                        obj.owner = multi.owner();
                        var statusinfo = multi.getstatusupdate(i);
                        if (statusinfo !== undefined && statusinfo !== null) {
                            var splitArr = [];
                            var arr = statusinfo.toString().split(",");
                            for (var k = 0; k < arr.length; k++) {
                                splitArr.push(arr[k]);
                            }
                            obj.ContractName = splitArr[0];
                            obj.owner = splitArr[1];
                            var unix_timestamp = splitArr[2].toString();
                            var date = new Date(unix_timestamp * 1000);
                            var cDate = dateFormat(date, "mm/dd/yyyy HH:MM:ss");
                            obj.DateCreated = cDate;
                            obj.status = common.getstatustext(splitArr[3]);
                            var remark = splitArr[4];
                            if (remark.indexOf("*") != -1) {
                                obj.remark = remark.replace("*", ".");
                            } else {
                                obj.remark = splitArr[4];
                            }
                        }
                        json.push(obj);
                    }
                }
            }, function(err) {
                callback(null,json);
            });
        } else {
            callback(null, json);
        }
	});
}

// Service to get contract information for last action table
router.get('/getContractInformation/:address', function(req, res) {
    wait.launchFiber(GetContractInformationHandler, req, res);
});

// Fiber to get contract information for last action table
function GetContractInformationHandler(req, res) {
    var result = wait.for(GetContractInformationData, req.params.address);
    if (result.comments !== undefined) {
        for (var i = 0; i < result.comments.length; i++) {
            var abc = wait.for(common.getusername, result.comments[i].userAddress);
            result.comments[i].userAddress = abc;
        }
    }
    res.send(result);
}

// Function to get contract information for last action table
function GetContractInformationData(address, callback) {
	var partInfo = [];
    var commentInfo = [];
    var json = {};
	contractInfo.getContractInfo(address,(err,doc)=>{
		if(err){
			callback(null, json);
		} else if (doc !== null) {
            trycatch(function() {
                var abiJson = JSON.parse(doc.abi);
                var Multiply7 = web3.eth.contract(abiJson);
                var multi = Multiply7.at(address);
                var count = multi.gettasksCount();
                var commentCount = multi.getcommentsCount();
                json.contractNumber = multi.contractNumber();
                json.contractDescription = multi.contractDescription();
                json.contractOwnedby = multi.contractOwnedby();
                json.numberofParts = multi.numberofParts();
                json.contractamount = multi.contractamount();
                var date = new Date(multi.contractduedate());
                var cDate = dateFormat(date, "mm-dd-yyyy");
                json.contractduedate = cDate;
                json.filehashkey = multi.filehashkey();
                json.contractAddress = address;
                for (var i = 0; i < count; i++) {
                    var parts = multi.gettask(i);
                    partInfo.push(parts);
                }
                json.partInfo = partInfo;
                for (var j = 0; j < commentCount; j++) {
                    var comment_obj = {};
                    var comment = multi.getcomment(j);
                    var splitArr = [];
                    var arr = comment.toString().split(",");
                    for (var k = 0; k < arr.length; k++) {
                        splitArr.push(arr[k]);
                    }
                    comment_obj.userAddress = splitArr[0];
                    var unix_timestamp = splitArr[1].toString();
                    var commentdate = new Date(unix_timestamp * 1000);
                    var convertcommentdate = dateFormat(commentdate, "mm/dd/yyyy HH:MM:ss");
                    comment_obj.date = convertcommentdate;
                    comment_obj.comment = splitArr[2];
                    if (comment_obj.comment !== '' && comment_obj.comment !== undefined) {
                        commentInfo.push(comment_obj);
                    }
                }
                json.comments = commentInfo;
            },
            function(err) {
                callback(null,json);
            });
        } else {
            callback(null, json);
        }
	});
}

// Service to get contract information for task perform table for main account
router.get('/getMainAccountContractInfo/:address', function(req, res) {
    wait.launchFiber(GetMainAccountContractInfoHandler, req, res);
});

// Fiber to get contract information for task perform table for main account
function GetMainAccountContractInfoHandler(req, res) {
    var result = wait.for(GetMainAccountContractInfoData, req.params.address);
    if (result.comments !== undefined) {
        for (var i = 0; i < result.comments.length; i++) {
            var abc = wait.for(common.getusername, result.comments[i].userAddress);
            result.comments[i].userAddress = abc;
        }
    }
    res.send(result);
}

// Function to get contract information for task perform table for main account
function GetMainAccountContractInfoData(address, callback) {
	 var partInfo = [];
    var commentInfo = [];
    var json = {};
	contractInfo.getContractInfo(address,(err,doc)=>{
		if(err){
			callback(null, json);
		} else  if (doc !== null) {
                trycatch(function() {
                    var abiJson = JSON.parse(doc.abi);
                    var Multiply7 = web3.eth.contract(abiJson);
                    var multi = Multiply7.at(address);
                    var count = multi.gettasksCount();
                    var commentCount = multi.getcommentsCount();
                    json.ContractNumber = multi.contractNumber();
                    json.ContractDescription = multi.contractDescription();
                    json.ContractOwnedby = multi.contractOwnedby();
                    json.NumberofParts = multi.numberofParts();
                    json.ContractAmount = multi.contractamount();
                    json.filehashkey = multi.filehashkey();
                    json.contractAddress = address;
                    var date = new Date(multi.contractduedate());
                    var cDate = dateFormat(date, "mm-dd-yyyy");
                    json.Duedate = cDate;
                    for (var i = 0; i < count; i++) {
                        var parts = multi.gettask(i);
                        partInfo.push(parts);
                    }
                    for (var j = 0; j < commentCount; j++) {
                        var comment_obj = {};
                        var comment = multi.getcomment(j);
                        var splitArr = [];
                        var arr = comment.toString().split(",");
                        for (var k = 0; k < arr.length; k++) {
                            splitArr.push(arr[k]);
                        }
                        comment_obj.userAddress = splitArr[0];
                        var unix_timestamp = splitArr[1].toString();
                        var commentdate = new Date(unix_timestamp * 1000);
                        var convertcommentdate = dateFormat(commentdate, "mm/dd/yyyy HH:MM:ss");
                        comment_obj.date = convertcommentdate;
                        comment_obj.comment = splitArr[2];
                        if (comment_obj.comment !== '' && comment_obj.comment !== undefined) {
                            commentInfo.push(comment_obj);
                        }
                    }
                    json.tasks = partInfo;
                    json.comments = commentInfo;
                },
                function(err) {
                   callback(null, json);
                });
        } else {
            callback(null, json);
        }
	});
}

// Service to update date and amount in contract
router.post('/modifyAmountAndDate', function(req, res) {
    wait.launchFiber(ModifyDataHandler, req, res);
});

// Fiber to update date and amount in contract
function ModifyDataHandler(req, res) {
    var result = wait.for(common.getContractAbi, req.body.contractAddress);
    var json = {};
    var remark = '';
    var date;
    var cDate;
    var amount;
    var supplierAddress = '';
    var abi_json = JSON.parse(result);
    var Multiply7 = web3.eth.contract(abi_json);
    var multi = Multiply7.at(req.body.contractAddress);
    var assigneelegnth = multi.getassigneeCount();
    for (var i = 0; i < assigneelegnth.toString(); i++) {
        var assigneeinfo = multi.getassignee(i);
        var splitArr = [];
        if (assigneeinfo !== undefined && assigneeinfo !== null) {
            var arr = assigneeinfo.toString().split(",");
            for (var k = 0; k < arr.length; k++) {
                splitArr.push(arr[k]);
            }
        }
        if (i == 1) {
            supplierAddress = splitArr[0];
        }
    }
    if (req.body.newAmount != req.body.oldamount && req.body.newAmount !== '') {
        remark = remark + " Contract amount changed from " + req.body.oldamount + " to " + req.body.newAmount + "*";
        amount = req.body.newAmount;
    } else {
        amount = req.body.oldamount;
    }
    if (req.body.newDate != req.body.oldDate) {
        date = new Date(req.body.newDate);
        cDate = dateFormat(date, "mm-dd-yyyy");
        date = cDate;
        remark = remark + " \n Due date changed from " + req.body.oldDate + " to " + req.body.newDate;
    } else {
        date = new Date(req.body.oldDate);
        cDate = dateFormat(date, "mm-dd-yyyy");
        date = cDate;
    }
    var createdDate = Math.floor(Date.now() / 1000);
    var unlockAccountResult = wait.for(common.unlockAccount, req);
    if (unlockAccountResult === true) {
        if (remark !== '') {
            var status = props.status_republished;
            var modifyAmountAndDateresult=  wait.for(ModifyAmountAndDate, multi, req, amount, date, status, remark);
            wait.for(UpdateStatusforSupplierAfterModify, req, multi, supplierAddress);
			var supplierName = wait.for(common.getusername, supplierAddress);
            var supplierEmail = wait.for(common.getUserEmail, supplierAddress);
            var subject = '';
            var text = '';
            if (req.body.languageselected == 'en') {
                subject = sprintf(props.email_republish_subject_en , multi.contractNumber());
                text = sprintf(props.email_republish_body_en ,supplierName, multi.contractNumber());
            } else {
                subject = sprintf(props.email_republish_subject_fr , multi.contractNumber());
                text = sprintf(props.email_republish_body_fr ,supplierName, multi.contractNumber());
            }
            mail.sendEmail(supplierEmail, subject, text);
        }
        var resultofaddcomment = wait.for(AddComment, multi, createdDate, req);
        res.send(resultofaddcomment);
    } else {
        json.error = "Account is locked. Please try again.";
        json.success = null;
        res.send(json);
    }
}

// Function to update amount and date in contract
function ModifyAmountAndDate(multi, req, amount, date, status, remark, callback) {
    var json = {};
    multi.updatedateandamount.sendTransaction(date, amount, status, remark, {
        from: req.session.address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.result = contract;
        callback(null, err);
    });
}

// Function to update supplier's status after date and amount modified
function UpdateStatusforSupplierAfterModify(req, multi, supplierAddress, callback) {
    var json = {};
    multi.signbyAssignee.sendTransaction(supplierAddress, false, props.status_pending, '', '', true, {
        from: req.session.address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.result = contract;
        callback(null, json);
    });
}

// Function to add comments in contract
function AddComment(multi, createdDate, req, callback) {
    var json = {};
    multi.addcomment.sendTransaction(req.session.address, createdDate, req.body.comments, {
        from: req.session.address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.result = contract;
        callback(null, json);
    });
}

// Service to delete contract
router.get('/deleteContract/:contractAddress', function(req, res) {
    wait.launchFiber(DeleteContractHandler, req, res);
});

// Fiber to delete contract
function DeleteContractHandler(req, res) {
    var abc = wait.for(DeleteContract, req);
    var msg = '';
    if (!abc) {
        msg = "Deleted successfully";
    } else {
        msg = "Error in delete";
    }
    res.send(msg);
}

// Function to delete contract 
function DeleteContract(req, callback) {
	contractInfo.deleteContract(req.params.contractAddress,(error,result)=>{
		if(error){
			callback(null, error);
		}else {
			callback(null, "success");
		}
	});
}

// Service to deploy contract
router.post('/deployContract', function(req, res) {
	wait.launchFiber(DeployContractHandler, req, res);
});

// Fiber to deploy contract
function DeployContractHandler(req, res) {
    var json = {};
    var unlockAccountResult = wait.for(common.unlockAccount, req);
    if (unlockAccountResult === true) {
        var result = wait.for(DeployContract, req);
        res.send(result);
    } else {
        json.erro = "Account is locked. Please try again.";
        json.success = null;
        res.send(json);
    }
}

// Function to deploy contract
function DeployContract(req, callback) {
    var code = "0x"+req.body.code;
    var abi = req.body.abi;
    var json = {};
    var abiJson = JSON.parse(abi);
    var status = props.status_created;
    web3.eth.contract(abiJson).new(req.body.ContractNumber, req.body.ContractDescription, req.body.ContractOwnedby, req.body.filehashkey, req.body.NumberofParts, req.body.ContractAmount, req.body.Duedate, status, {
        from: req.session.address,
        gas: 4700000,
        data: code
    }, function(err, contract) {
        if (!err) {
            json.result = contract.transactionHash;
            json.error = null;
            callback(null, json);
        }
    });
}

// Function get current date and time
function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}

// Service to save contract address and abi in db after succssefully deploying contract
router.post('/SaveContractAddress', function(req, res) {
	wait.launchFiber(SaveContractAddressFiber,req,res);
    
});

//Fiber to save contract address and abi in db after succssefully deploying contract
function SaveContractAddressFiber(req,res){
	var count = wait.for(GetCountforContractAddress,req);
	console.log("count is "+count);
	var result = wait.for(SaveContractAddress,req,count);
	res.send(result);
}

// function to get count for deployed contract number
function GetCountforContractAddress(req,callback){
	contractInfo.getCount(req.body.contractNumber,(error, numOfDocs)=>{
		if(error) {
			return callback(error);
		} else {
			callback(null, numOfDocs);
		}    
	});
}

// Function to save contract address
function SaveContractAddress(req,count,callback){
	var json = {};
	var version = count + 1;
    var date = getDateTime();
	var newContractInfo = new contractInfo({
		contractAddress:req.body.address,
		abi:req.body.Abi,
		date:date,
		contractNumber:req.body.contractNumber,
		version:version
	});
    contractInfo.addContractInfo(newContractInfo,(err, result)=>{
		if (!err) {
            json.result = "inserted succefully";
            json.error = null;
            callback(null,json);
        } else {
            json.result = "error";
            json.error = "Failed to save in db";
            callback(null,json);
        }
	});
}

// Service to add parts in deployed contract
router.post('/addpartsincontract', function(req, res) {
    wait.launchFiber(AddPartsHandler, req, res);
});

// Fiber to add parts in deployed contract
function AddPartsHandler(req, res) {
    var json = {};
    var result;
    var unlockAccountResult = wait.for(common.unlockAccount, req);
    if (unlockAccountResult === true) {
        var address = req.session.address;
        var abi_json = JSON.parse(req.body.Abi);
        var Multiply7 = web3.eth.contract(abi_json);
        var multi = Multiply7.at(req.body.address);
        var supplierAddress = wait.for(common.getaddressforuser, req.body.supplierName);
        var supplierEmail = wait.for(common.getUserEmail, supplierAddress);
        wait.for(AddAssignee, supplierAddress, multi, address);
        var contractnum = multi.contractNumber();
        for (var i = 0; i < req.body.partInfo.length; i++) {
            var obj = req.body.partInfo[i];
            result = wait.for(AddPartsInContract, obj, multi, address);
            wait.for(SendEther, supplierAddress, address);
        }
        var subject = '';
        var text = '';
        if (req.body.languageselected == 'en') {
            subject = sprintf(props.email_publish_subject_en, contractnum);
            text = sprintf(props.email_publish_body_en, req.body.supplierName, contractnum);
        } else {
            subject = sprintf(props.email_publish_subject_fr , contractnum);
            text = sprintf(props.email_publish_body_fr, req.body.supplierName , contractnum);
        }
        mail.sendEmail(supplierEmail, subject, text);
        res.send(result);
    } else {
        json.error = "Account is locked.Please try again";
        json.success = null;
        res.send(json);
    }
}

// Function to add assignee in contract
function AddAssignee(supplierAddress, multi, address, callback) {
    var transactionhash = '';
    var signedDate = Math.floor(Date.now() / 1000);
    var status = props.status_pending;
    multi.addAssignee.sendTransaction(supplierAddress, false, signedDate, status, '', {
        from: address,
        gas: 3000000
    }, function(err, contract) {
        transactionhash = contract;
    });
    callback(null, transactionhash);
}

// Function to add parts in deployed contract
function AddPartsInContract(obj, multi, address, callback) {
    var json = {};
    multi.addtasks.sendTransaction(obj, {
        from: address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.success = contract;
        callback(null, json);
    });
}

// Function to send ether
function SendEther(supplierAddress, address, callback) {
    var transactionhash = '';
    web3.eth.sendTransaction({
        from: address,
        to: supplierAddress,
        value: web3.toWei(5, "ether")
    }, function(err, contract) {
        transactionhash = contract;
    });
    callback(null, transactionhash);
}

// Service to get list of all suppliers from db
router.get('/getSupplierList', function(req, res) {
    var supplierList = [];
    users.getSuppliers((error,result)=>{
		if(error){
			res.send(supplierList);
		} else if (result === null){
			res.send(supplierList);
		} else {
			result.forEach(function(user){
				supplierList.push(user.username);
			});
			res.send(supplierList);
		}
    });
});

module.exports = router;
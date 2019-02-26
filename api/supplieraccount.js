/*
=========================================================================================
File description:
    Filename    : supplieraccount.js
    Module      : Supplier Account Module
	Dependency  : 
			      ../config.js
				  ./mail.js
				   ../dbmodels/contractInfo.js
	Description :
			      This file contains server side code for executing client side requests of Supplier Account
	Developed By: PLM LOGIX
=========================================================================================
Date         	Developer Name          Description of Change
19-Dec-2016  	Uday Garud              Initial Version
19-Dec-2016  	Uday Garud              Added imports and global variables
20-Dec-2016  	Uday Garud              Added function to connect to mongodb database
21-Dec-2016  	Uday Garud              Added function to encrypt user password (encrypt)
21-Dec-2016  	Uday Garud              Added function to decrypt user password (decrypt)
24-Dec-2016  	Nisha Mane              Added function to return username from db using user address (getusername)
24-Dec-2016  	Nisha Mane              Added function to get user's email from db (getUserEmail)
26-Dec-2016  	Nisha Mane              Added function to return user address using username (getaddressforuser)
26-Dec-2016  	Uday Garud              Added Added function to unlock ethereum account (unlockAccount)
27-Dec-2016  	Uday Garud              Added function to return contract abi from db using contract address (getContractAbi)
06-Jan-2017  	Nisha Mane              Added function to return list of available contracts for supplier account (getAvailableContractsList)
06-Jan-2017  	Nisha Mane              Added function to get contract information (getContractInformation)
10-Jan-2017  	Uday Garud              Added function to get task perform table data for supplier account (getSupplierTaskPerformData)
11-Jan-2017  	Nisha Mane              Added function to get last action table data for supplier account (getLastActionData)
16-Jan-2017  	Uday Garud              Added function to accept or reject contract by supplier(contractDecisionBySupplier)
19-Jan-2017  	Uday Garud              Added function to add comment in contract (addComment)
23-Jan-2017  	Uday Garud              Modified function (contractDecisionBySupplier)
08-Feb-2017  	Nisha Mane              Modified function (getLastActionData)
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
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var wait = require('wait.for');
var dateFormat = require('dateformat');
var trycatch = require('trycatch');
var sprintf = require("sprintf-js").sprintf;
var contractInfo = require('../dbmodels/contractInfo');
var jsdom = require('jsdom');
// End of imports and global variable declarations

// Service to return list of available contracts for supplier account
router.get('/getAvailableContracts', function(req, res) {
    wait.launchFiber(GetAvailableContractsHandler, req, res);
});
// Fiber to return list of available contracts for supplier account
function GetAvailableContractsHandler(req, res) {
    var result = wait.for(GetAvailableContractsList, req);
    for (var i = 0; i < result.length; i++) {
        var abc = wait.for(common.getusername, result[i].owner);
        result[i].owner = abc;
    }
    res.send(result);
}

// Function to return list of available contracts for supplier account
function GetAvailableContractsList(req, callback) {
	var json = [];
	contractInfo.getAllContracts((err,results)=>{
		if(err){
			callback(null, json);
		}else if (results === null){
			callback(null, json);
		} else {
			results.forEach(function(doc){
				if (doc !== null) {
					trycatch(function() {
						var abiJson = JSON.parse(doc.abi);
						var Multiply7 = web3.eth.contract(abiJson);
						var obj = {};
						var multi = Multiply7.at(doc.contractAddress);
						if (multi.checkifSupplierpresent(req.session.address)) {
							obj.contractNumber = multi.contractNumber();
							obj.contractAddress = doc.contractAddress;
							obj.ContractDescription = multi.contractDescription();
							obj.ContractOwnedby = multi.contractOwnedby();
							obj.version = "v"+doc.version;
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
							json.push(obj);
						}
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

// Service to get task perform table data for supplier account
router.get('/getTaskPerformData/:contractAddress', function(req, res) {
    wait.launchFiber(GetSupplierTaskPerformHandler, req, res);
});

// Fiber to get task perform table data for supplier account
function GetSupplierTaskPerformHandler(req, res) {
    var result = wait.for(GetSupplierTaskPerformData, req);
    for (var i = 0; i < result.length; i++) {
        var abc = wait.for(common.getusername, result[i].owner);
        result[i].owner = abc;
    }
    res.send(result);
}

// Function to get task perform table data for supplier account
function GetSupplierTaskPerformData(req, callback) {
	var json = [];
	contractInfo.getContractInfo(req.params.contractAddress,(err,doc)=>{
		if(err){
			callback(null, json);
		} else if (doc !== null) {
            var obj = {};
            var status = [];
            var mainaccountStatus = [];
            var abiJson = JSON.parse(doc.abi);
            var Multiply7 = web3.eth.contract(abiJson);
            var splitArr = [];
            var arr = [];
            var multi = Multiply7.at(req.params.contractAddress);
            var updateCount = multi.getstatusupdateCount();
            for (var j = 0; j < updateCount.toString(); j++) {
                var updateInfo = multi.getstatusupdate(j);
                splitArr = [];
                arr = updateInfo.toString().split(",");
                for (var k = 0; k < arr.length; k++) {
                    splitArr.push(arr[k]);
                }
                if (splitArr[1] == req.session.address) {
                    status.push(splitArr[3]);
                }
                if (splitArr[1] == multi.owner()) {
                    mainaccountStatus.push(splitArr[3]);
                }
            }
            if (mainaccountStatus.length > 0) {
				obj.mainAccountstatus = common.getstatustext(mainaccountStatus[mainaccountStatus.length - 1]);
            }
            var assigneeCount = multi.getassigneeCount();
            for (var i = 0; i < assigneeCount.toString(); i++) {
                var assignee = multi.getassignee(i);
                splitArr = [];
                arr = assignee.toString().split(",");
                for (var m = 0; m < arr.length; m++) {
                    splitArr.push(arr[m]);
                }
                if (splitArr[0].toString() == req.session.address) {
                    obj.issigned = splitArr[1];
                }
                if (i == 1) {
                    obj.status = common.getstatustext(splitArr[3]);
                }
            }
            if (multi.checkifSupplierpresent(req.session.address)) {
                obj.contractAddress = doc.contractAddress;
                obj.ContractName = multi.contractNumber();
                obj.owner = multi.owner();
                json.push(obj);
            }
        } else {
            callback(null, json);
        }
	});
}

// Service to get last action table data for supplier account
router.get('/getLastActionData/:contractAddress', function(req, res) {
    wait.launchFiber(GetLastActionDataHandler, req, res);
});

// Fiber to get last action table data for supplier account
function GetLastActionDataHandler(req, res) {
    var result = wait.for(GetLastActionData, req);
    for (var i = 0; i < result.length; i++) {
        var abc = wait.for(common.getusername, result[i].owner);
		var role = wait.for(common.getRole,result[i].owner);
        result[i].owner = abc;
		result[i].role = role;
    }
    res.send(result);
}

// Function to get last action table data for supplier account
function GetLastActionData(req, callback) {
	 var json = [];
	contractInfo.getContractInfo(req.params.contractAddress,(err,doc)=>{
		if(err){
			 callback(null, json);
		} else if (doc !== null) {
            trycatch(function() {
                var abiJson = JSON.parse(doc.abi);
                var Multiply7 = web3.eth.contract(abiJson);
                var multi = Multiply7.at(req.params.contractAddress);
                if (multi.checkifSupplierpresent(req.session.address)) {
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
                callback(null, json);
            });
        } else {
            callback(null, json);
        }
	});
}

// Service to get contract information
router.get('/getContractInformation/:address', function(req, res) {
	 wait.launchFiber(GetContractInformationHandler, req, res);
});

// Fiber to get contract information
function GetContractInformationHandler(req, res) {
    var result = wait.for(GetContractInformation, req.params.address, req);
    if (result.comments !== undefined) {
        for (var i = 0; i < result.comments.length; i++) {
            var abc = wait.for(common.getusername, result.comments[i].userAddress);
            result.comments[i].userAddress = abc;
        }
    }
    res.send(result);
}

// Function to get contract information
function GetContractInformation(address, req, callback) {
	var partInfo = [];
    var commentInfo = [];
    var json = {};
	contractInfo.getContractInfo(address,(err,doc)=>{
		if(err){
			callback(null, json);
		} else if (doc !== null) {
            trycatch(function() {
                var abi_json = JSON.parse(doc.Abi);
                var Multiply7 = web3.eth.contract(abi_json);
                var multi = Multiply7.at(address);
                var count = multi.gettasksCount();
                var commentCount = multi.getcommentsCount();
                var splitArr = [];
                var arr = [];
                var updateCount = multi.getstatusupdateCount();
                var status = [];
                for (var j = 0; j < updateCount.toString(); j++) {
                    var updateInfo = multi.getstatusupdate(j);
                    splitArr = [];
                    arr = updateInfo.toString().split(",");
                    for (var k = 0; k < arr.length; k++) {
                        splitArr.push(arr[k]);
                    }
                    if (splitArr[1] == req.session.address) {
                        status.push(splitArr[3]);
                    }
                }
                if (status.length > 0) {
				json.lastAction = common.getstatustext(status[status.length - 1]);
                }
                json.contractNumber = multi.contractNumber();
                json.contractAddress = address;
                json.contractDescription = multi.contractDescription();
                json.contractOwnedby = multi.contractOwnedby();
                json.numberofParts = multi.numberofParts();
                json.contractamount = multi.contractamount();
                var date = new Date(multi.contractduedate());
                var cDate = dateFormat(date, "mm-dd-yyyy");
                json.contractduedate = cDate;
                json.filehashkey = multi.filehashkey();
                for (var i = 0; i < count; i++) {
                    var parts = multi.gettask(i);
                    partInfo.push(parts);
                }
                for (var n = 0; n < commentCount; n++) {
                    var comment_obj = {};
                    var comment = multi.getcomment(n);
                    splitArr = [];
                    arr = comment.toString().split(",");
                    for (var m = 0; m < arr.length; m++) {
                        splitArr.push(arr[m]);
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
                json.partInfo = partInfo;
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

// Service to accept or reject contract by supplier
router.post('/contractDecisionBySupplier', function(req, res) {
	 wait.launchFiber(ContractDecisionBySupplierHandler, req, res);
});

//  Fiber to accept or reject contract by supplier
function ContractDecisionBySupplierHandler(req, res) {
    var result = wait.for(common.getContractAbi, req.body.contractAddress);
    var json = {};
    var abi_json = JSON.parse(result);
    var Multiply7 = web3.eth.contract(abi_json);
    var multi = Multiply7.at(req.body.contractAddress);
    var unlockAccountResult = wait.for(common.unlockAccount, req);
    console.log(req.body.languageselected + " 1");
    if (unlockAccountResult === true) {
        var signBy = wait.for(ContractDecisionBySupplier, multi, req);
        var email = wait.for(common.getUserEmail, multi.owner());
		var supplieraccountusername = wait.for(common.getusername, req.session.address);
		var mainaccountusername = wait.for(common.getusername, multi.owner());
        var subject = '';
        var text = '';
        if (req.body.status == props.status_accepted) {
            if (req.body.languageselected == 'en') {
                subject = sprintf(props.email_accept_contract_subject_en , multi.contractNumber(),supplieraccountusername);
                text = sprintf(props.email_accept_contract_body_en ,mainaccountusername, multi.contractNumber(), supplieraccountusername);
            } else {
                subject = sprintf(props.email_accept_contract_subject_fr , multi.contractNumber(),supplieraccountusername);
                text = sprintf(props.email_accept_contract_body_fr , mainaccountusername, multi.contractNumber(), supplieraccountusername);
            }
            mail.sendEmail(email, subject, text);
        }
        if (req.body.status == props.status_rejected) {
			var updatedResult = wait.for(UpdateStatusforMainAccountAfterRejected,multi,req);
            if (req.body.languageselected == 'en') {
                subject = sprintf(props.email_reject_contract_subject_en, multi.contractNumber(),supplieraccountusername);
                text = sprintf(props.email_reject_contract_body_en , mainaccountusername, multi.contractNumber(), supplieraccountusername);
            } else {
                subject = sprintf(props.email_reject_contract_subject_fr,  multi.contractNumber(),supplieraccountusername);
                text = sprintf(props.email_reject_contract_body_fr, mainaccountusername, multi.contractNumber(), supplieraccountusername);
            }
            mail.sendEmail(email, subject, text);
        }
        res.send(signBy);
    } else {
        json.result = null;
        json.error = "Account is locked. Please try again";
        res.send(json);
    }
}

// Function to accept or reject contract by supplier
function ContractDecisionBySupplier(multi, req, callback) {
    var json = {};
    multi.signbyAssignee.sendTransaction(req.session.address, req.body.isSigned, req.body.status, req.body.comment, req.body.comment, true, {
        from: req.session.address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.result = contract;
        callback(null, json);
    });
}

// Function to update mainAccount's status after contract rejected
function UpdateStatusforMainAccountAfterRejected(multi, req, callback) {
    var json = {};
    multi.signbyAssignee.sendTransaction(multi.owner(), true, props.status_pending, '', '', true, {
        from: req.session.address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.result = contract;
        callback(null, json);
    });
}

// Service to add comment in contract
router.post('/addComment', function(req, res) {
    wait.launchFiber(AddCommentHandler, req, res);
});

// Fiber to add comment in contract
function AddCommentHandler(req, res) {
    var result = wait.for(common.getContractAbi, req.body.contractAddress);
    var json = {};
    var abi_json = JSON.parse(result);
    var Multiply7 = web3.eth.contract(abi_json);
    var multi = Multiply7.at(req.body.contractAddress);
    var createdDate = Math.floor(Date.now() / 1000);
    var unlockAccountResult = wait.for(common.unlockAccount, req);
    if (unlockAccountResult === true) {
        var addcommentresult = wait.for(AddComment, multi, createdDate, req);
        res.send(addcommentresult);
    } else {
        json.error = "Account is locked. Please try again.";
        json.success = null;
        res.send(json);
    }
}

// Function to add comment in contract
function AddComment(multi, createdDate, req, callback) {
    var json = {};
    multi.addcomment.sendTransaction(req.session.address, createdDate, req.body.comments, {
        from: req.session.address,
        gas: 3000000
    }, function(err, contract) {
        json.error = err;
        json.success = contract;
        callback(null, json);
    });
}

module.exports = router;
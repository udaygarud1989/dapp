/*
=========================================================================================
File description:
    Filename    : common.js
    Module      : Common functions module
	Dependency  : 
			      ../config.js
				   ../dbmodels/users.js
				  ../dbmodels/contractInfo.js
	Description :
			      This file contains common functions for all other modules.
=========================================================================================
Date         	Developer Name          Description of Change
16-Feb-2017  	Uday Garud              Initial Version
16-Feb-2017  	Nisha Mane              Added function to get user's email from db (getUserEmail)
16-Feb-2017  	Uday Garud              Added function to return contract abi from db using contract address (getContractAbi)
16-Feb-2017  	Nisha Mane              Added function to return username from db using user address (getusername)
17-Feb-2017  	Nisha Mane              Added function to return user address from db using username (getaddressforuser)
17-Feb-2017  	Uday Garud              Added function to unlock ethereum account (unlockAccount)
17-Feb-2017  	Uday Garud              Added function to decrypt user password (decrypt)
=======================================================================================*/

"use strict";
/* jshint node: true */
//Start of imports and global variable declarations
var props = require('../config/config');
var crypto = require("crypto");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var users = require('../dbmodels/users');
var contractInfo = require('../dbmodels/contractInfo');
//End of imports and global variable declarations

module.exports = {

	// Function to get user's email from db
	getUserEmail :function (userAddress, callback) {
		var supplierEmail = "";
		users.getUserByAddress(userAddress,(err,doc)=>{
			if(err){
				callback(null, err);
			} else if (doc !== null){
				supplierEmail = doc.email;
				callback(null, supplierEmail);
			} else {
				callback(null, supplierEmail);
			}
		});
	},

	// Function to return contract abi from db using contract address
	getContractAbi :function (contractAddress, callback) {
		var abi = "";
		contractInfo.getContractInfo(contractAddress,(err,doc)=>{
			if(err){
				callback(null, err);
			} else if (doc !== null){
				abi = doc.abi;
				callback(null, abi);
			} else {
				callback(null, abi);
			}
		});
	},
	
	// Function to return username from db using user address
	getusername :function (address, callback) {
		var username = "";
		users.getUserByAddress(address,(err,doc)=>{
			if(err){
				callback(null, err);
			} else if (doc !== null){
				username = doc.username;
				callback(null, username);
			} else {
				callback(null, username);
			}
		});
	},
	
	// Function to get Role from db using user address
	getRole : function (address,callback) {
		var role = "";
		users.getUserByAddress(address,(err,doc)=>{
			if(err){
				callback(null, err);
			} else if (doc !== null){
				role = doc.role;
				callback(null, role);
			} else {
				callback(null, role);
			}
		});
	},
	
    // Function to return user address from db using username
	getaddressforuser :function (username, callback) {
		var supplierAdd = "";
		users.getUser(username,(err,doc)=>{
			if(err){
				callback(null, err);
			} else if (doc !== null){
				supplierAdd = doc.address;
				callback(null, supplierAdd);
			} else {
				callback(null, supplierAdd);
			}
		});
	},

	// Function to unlock ethereum account
	unlockAccount :function (req, callback) {
		var password = module.exports.decrypt(req.session.password);
		var abc = web3.personal.unlockAccount(req.session.address, password, 1000);
		callback(null, abc);
	},
	
	//Function to decrypt user password
	decrypt :function (text) {
		var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq');
		var dec = decipher.update(text, 'hex', 'utf8');
		dec += decipher.final('utf8');
		return dec;
	},
	
	//Function to get status text from config file
	getstatustext :function (text) {
	    if (text == props.status_created) {
            text = props.status_created;
        } else if (text == props.status_republished) {
            text = props.status_republished;
        } else if (text == props.status_completed) {
            text = props.status_completed;
        } else if (text == props.status_pending) {
            text = props.status_pending;
        } else if (text == props.status_accepted) {
            text = props.status_accepted;
        } else if (text == props.status_rejected) {
            text = props.status_rejected;
        }
		return text;
	},
};
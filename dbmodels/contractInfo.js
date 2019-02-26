/*
=========================================================================================
File description:
    Filename    : contractInfo.js
    Module      : Database module for contract Info collection
	Description :
			      This file contains code for executing queries on contractInfo collection
	Developed By: PLM LOGIX
=========================================================================================
Date         	Developer Name          Description of Change
27-Dec-2016  	Uday Garud              Added function to save contract address and abi in db after succssefully deploying contract(addContractInfo)
29-Dec-2016  	Uday Garud              Added function to return contract abi using contract address (getContractInfo)
05-Jan-2017  	Uday Garud              Added function to get list of available contracts (getAllContracts)
09-Jan-2017  	Uday Garud              Added function to get count for contracts (getCount)
10-Jan-2017  	Uday Garud              Added function to delete contract from database (deleteContract)
=======================================================================================
*/
/* jshint node: true */

"use strict()";
/*globals require:false */
/*globals module:false */

//Start of imports and global variable declarations
var mongoose = require('mongoose');

// contract information Schema
var contractInfoSchema = mongoose.Schema({
  contractAddress: String,
  abi:String,
  date:String,
  contractNumber:String,
  version:String
});

const contractInfo = module.exports = mongoose.model('contractInfo', contractInfoSchema);

//Function to add new user
module.exports.addContractInfo = function(newContract, callback){
	newContract.save(callback);
};

//Function to get count for contract
module.exports.getCount = function(contractNumber,callback){
	contractInfo.count({contractNumber:contractNumber},callback);
};

//Function to delete contract
module.exports.deleteContract = function(contractAddress,callback){
	contractInfo.deleteOne({contractAddress:contractAddress},callback);
};

//Function to get all contracts
module.exports.getAllContracts = function(callback){
	contractInfo.find({},callback);
};

//Function to get contract information
module.exports.getContractInfo = function(contractAddress,callback){
	contractInfo.findOne({contractAddress:contractAddress},callback);
};
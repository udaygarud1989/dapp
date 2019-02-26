/*
=========================================================================================
File description:
    Filename    : users.js
    Module      : Database module for contract Info collection
	Description :
			      This file contains code for executing queries on users collection
	Developed By: PLM LOGIX
=========================================================================================
Date         	Developer Name          Description of Change
24-Dec-2016  	Uday Garud              Added function to add new user in database (addUser)
24-Dec-2016  	Uday Garud              Added function to return username from db using user address (getUserByAddress)
24-Dec-2016  	Uday Garud              Added function to get user's details from db (getUser)
24-Dec-2016  	Uday Garud              Added function to get user's details from db using username and password(findUser)
26-Dec-2016  	Uday Garud              Added function to all suppliers from database (getSuppliers)
=======================================================================================
*/
/* jshint node: true */
"use strict()";
/*globals require:false */
/*globals module:false */

//Start of imports and global variable declarations
var mongoose = require('mongoose');
// user Schema
var userSchema = mongoose.Schema({
  username: String,
  email:String,
  password:String,
  role:String,
  address:String
});

const users = module.exports = mongoose.model('users', userSchema);

//Function to add new user
module.exports.addUser = function(newUser, callback){
	newUser.save(callback);
};

//Function to get user details
module.exports.getUser = function(username,callback){
	users.findOne({username:username},callback);
};

// Function to find user
module.exports.findUser = function(username,password,callback){
	users.findOne({username:username,password:password},callback);
};

//Function to get all suppliers
module.exports.getSuppliers = function(callback){
	users.find({role:"Supplier"},{username:1},callback);
};

module.exports.getUserByAddress = function(address,callback){
	users.findOne({address:address},callback);
};















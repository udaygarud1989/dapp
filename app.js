/*
=========================================================================================
File description:
    Filename    : app.js
    Module      : Main Module
	Dependency  : 
			      ../config.js
			      ./mail.js
			      ./api/mainaccount.js
			      ./api/supplieraccount.js
			      ./contract/part_request.sol
	Description :
			      This file contains Server Initialization code,User Management, Session Management of Users, Client Request Router
	Developed By: PLM LOGIX
=========================================================================================
Date         	Developer Name          Description of Change
19-Dec-2016  	Uday Garud              Initial Version
19-Dec-2016  	Uday Garud 				Added function to start node server
19-Dec-2016  	Uday Garud              Added imports and global variables
19-Dec-2016  	Uday Garud              Added function for session management
19-Dec-2016  	Uday Garud              Added function to parse incoming request
19-Dec-2016  	Uday Garud              Created objects for routing
20-Dec-2016  	Uday Garud              Added function to connect to mongodb database
21-Dec-2016  	Nisha Mane              Added service to check user existence
21-Dec-2016  	Uday Garud              Added function to encrypt user password (encrypt)
21-Dec-2016  	Uday Garud              Added function to decrypt user password (decrypt)
22-Dec-2016  	Uday Garud              Added service for user registration
22-Dec-2016  	Uday Garud              Added service for user validation
23-Dec-2016  	Uday Garud              Added service for redirecting user according to role
23-Dec-2016  	Uday Garud              Added service for user logout
24-Dec-2016  	Nisha Mane              Added service to get user details
24-Dec-2016  	Nisha Mane              Added function to return user address from db using username (getaddressforuser)
24-Dec-2016  	Nisha Mane              Added function to return username from db using user address (getusername)
26-Dec-2016  	Uday Garud              Added service for compiling contract and get contract's code and abi
26-Dec-2016  	Uday Garud              Added function to unlock ethereum account (unlockAccount)
27-Dec-2016  	Uday Garud              Added function to return contract abi from db using contract address (getContractAbi)
20-Jan-2017  	Uday Garud              Added service to return instructions from config file
23-Jan-2017  	Uday Garud              Added service to return ether balance of user
06-Feb-2017  	Uday Garud              Added service to return properties from config file
16-Feb-2017  	Nisha Mane              Moved function to common module(getUserEmail)
16-Feb-2017  	Uday Garud              Moved function to common module (getContractAbi)
16-Feb-2017  	Nisha Mane              Moved function to common module (getusername)
17-Feb-2017  	Nisha Mane              Moved function to common module (getaddressforuser)
17-Feb-2017  	Uday Garud              Moved function to common module (unlockAccount)
17-Feb-2017  	Uday Garud              Moved function to common module (decrypt)
======================================================================================= 
*/
/* jshint node: true */

//Start of imports and global variable declarations
"use strict";
var express = require('express');
var props = require('./config/config');
var common = require('./api/common');
var app = express();
var fs = require("fs");
var path = require('path');
var crypto = require("crypto");
var solc = require('solc');
var jsdom = require('jsdom');
var bodyParser = require("body-parser");
var session = require('client-sessions');
const mongoose = require('mongoose');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const config = require('./config/database');
var users = require('./dbmodels/users');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
mongoose.connect(config.database);

//Created objects for routing client requests
var mainaccount = require('./api/mainaccount');
var supplieraccount = require('./api/supplieraccount');

//Redirect requests to specific files
app.use('/', express.static(__dirname + '/app')); // Redirect to app folder
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // Redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // Redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // Redirect CSS bootstrap
app.use('/csscustom', express.static(__dirname + '/app/css')); // Redirect CSS bootstrap
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/fonts')); // Redirect CSS bootstrap

//End of imports and global variable declarations

// Function for session management
app.use(session({
    cookieName: 'session',
    secret: 'random_string_goes_here',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

//Function to parse incoming request
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//Routers to route incoming requests
app.use('/mainaccount', mainaccount);
app.use('/supplieraccount', supplieraccount);
//End of router

//Function to connect to mongodb database
// On Connection
mongoose.connection.on('connected', () => {
  console.log('Connected to database '+config.database);
});
// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err);
});

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {

//Service to return ether balance of user
app.post('/getBalance', function(req, res) {
    var json = {};
    var balance = web3.fromWei(web3.eth.getBalance('' + req.body.address + ''), "ether");
    json.balance = balance;
    res.send(json);

});

//Service for user registration
app.post('/registerUsers', function(req, res) {
    var address;
    jsdom.env("",["http://code.jquery.com/jquery.min.js"], function(err, window) {
        var $ = window.$;
        $.support.cors = true;
        $.ajax({
            type: 'POST',
            url: 'http://localhost:8545',
            data: '{"jsonrpc":"2.0","method":"personal_newAccount","params":["' + req.body.password + '"],"id":1}',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function(response) {
                var newUser = new users({
					username:req.body.username,
					email:req.body.email,
					password:encrypt(req.body.password),
					role:req.body.role,
					address:response.result
				})
				users.addUser(newUser,(err,addUserRes)=>{
					if(err){
						res.end("Register Failed");
					} else {
						res.end("Register Successful");
					}
				})
            },
            error: function(error) {
                res.end("Register Failed");
            }
        });
    });
});

//Service to check if user already exist
app.get('/checkUsers/:username', function(req, res) {
	users.getUser(req.params.username,(error,result)=>{
		if(error){
			res.end("NotExist");
		} else if (result === null){
			res.end("NotExist");
		} else {
			res.end("Exist");
		}
	})
});

//Service to validate user credentials
app.post('/loginUser', function(req, res) {
    var msg = "";
    var encryptPass = encrypt(req.body.password);
	users.findUser(req.body.username,encryptPass,(error,user)=>{
		if(error){
			res.end("Login Failed");
		} else if(user === null){
			res.end("Login Failed");
		} else {
			req.session.user = user.username;
			req.session.role = user.role;
			req.session.password = user.password;
			req.session.address = user.address;
			req.session.email = user.email;
			res.end("Login Successful");
		}
	})
});

//Service to redirect user after successful login
app.get('/account', function(req, res) {
    if (req.session.role == "Main Account") {
        res.sendFile(path.join(__dirname + '/app', 'mainaccount.html'));
    } else if (req.session.role == "Supplier") {
        res.sendFile(path.join(__dirname + '/app', 'supplier.html'));
    } else {
		res.sendFile(path.join(__dirname + '/app', 'index.html'));
	}
});

//Service for user logout
app.get('/logout', function(req, res) {
    req.session.reset();
    res.sendFile(path.join(__dirname + '/app', 'index.html'));
});

//Service to return configuration properties from config file
app.post('/getstatusfromconfigFile', function(req, res) {
    var json = {};
    json.ethereumPort = props.ethereumPORT,
    json.ethereumIP = props.ethereumIP,
    json.created = props.status_created,
    json.republished = props.status_republished,
    json.completed = props.status_completed,
    json.pending = props.status_pending,
    json.accepted = props.status_accepted,
    json.rejected = props.status_rejected,
    json.outofstatus = props.status_outofstatus,
    json.status_terms_updated = props.status_terms_updated;
    res.send(json);
});

//Service to return instructions from config file
app.post('/getinstructions', function(req, res) {
    if (req.body.role == 'Main Account') {
        if (req.body.ln == "en") {
            res.send(props.mainaccountinstructions_english);
        } else if (req.body.ln == "fr") {
            res.send(props.mainaccountinstructions_french);
        }
    } else if (req.body.role == 'Supplier') {
        if (req.body.ln == "en") {
            res.send(props.supplieraccountinstructions_english);
        } else if (req.body.ln == "fr") {
            res.send(props.supplieraccountinstructions_french);
        }
    }
});

//Service for compiling contract and get contract's code and abi
app.get('/compileContract', function(req, res) {
    var code;
    var abi;
    var contents = fs.readFileSync('contract/part_request.sol', 'utf8');
    var input = {
        'cont.sol': 'import "contract/part_request.sol"; '
    };
    function findImports(path) {
        if (path === 'contract/part_request.sol') {
            return {
                contents: contents
            };
		}
        else {
            return {
                error: 'File not found'
            };
		}
    }
    var output = solc.compile({
        sources: input
    }, 1, findImports);
    for (var contractName in output.contracts) {
        if (output.contracts.hasOwnProperty(contractName)) {
            code = output.contracts[contractName].bytecode;
            abi = output.contracts[contractName].interface;
        }
    }
    var obj;
    if (code === undefined) {
        obj = {
            "code": code,
            "abi": abi,
            "address": req.session.address,
            "error": "Error in contract"
        };
    } else {
        obj = {
            "code": code,
            "abi": abi,
            "address": req.session.address,
            "error": null
        };
    }
    res.send(obj);
});

//Service to get user details
app.get('/getUserAddress', function(req, res) {
    if (req.session.password !== undefined) {
        var password = common.decrypt(req.session.password);
        var address = req.session.address;
        var userData = {
            "password": password,
            "address": address,
            "Role": req.session.role,
            "username": req.session.user
        };
        res.send(userData);
    } else {
        res.send("No data found");
    }
});

//Function to encrypt user password
function encrypt(text) {
    var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

//Function to start node server 
var server = app.listen(props.appport, "0.0.0.0", function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
    console.log(server.address());
});

console.log(`Worker ${process.pid} started`);
}
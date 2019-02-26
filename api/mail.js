/*
=========================================================================================
File description:
    Filename    : mail.js
    Module      : E-mail Module
	Dependency  : 
			      ../config.js
	Description :
			      This file contains server side code for Sending E-mails to Each User after specific actions.
=========================================================================================
Date         	Developer Name          Description of Change
03-Feb-2017  	Uday Garud              Initial Version
06-Feb-2017  	Uday Garud              Added function to send Email (sendEmail)  
=======================================================================================*/

"use strict";
/* jshint node: true */
//Start of imports and global variable declarations
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var props = require('../config/config');
//End of imports and global variable declarations

module.exports = {

//Function to send Email  
sendEmail :function (emailto, subject, text) {
    var transporter = nodemailer.createTransport(smtpTransport({
        host: props.Email_SMTP_Address, //mail.example.com (your server smtp)
        port: props.Email_SMTP_Port, //2525 (specific port)
        secureConnection: true, //true or false
        auth: {
            user: props.Email_Sender_Address , //user@mydomain.com
            pass: props.Email_Sender_Password //password from specific user mail
        }
    }));
	console.log("sender "+props.Email_Sender_Address);
	var mailOptions = {
		from: props.Email_Sender_Address, // sender address
		to: emailto, // list of receivers
		subject: subject, // Subject line
		html: text //, // Html body body
	};
	
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
        return 'Error';
    }else{
        console.log('Message sent: ' + info.response);
        return 'Success';
    }
});
 
}
};

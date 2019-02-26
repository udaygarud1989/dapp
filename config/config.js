/*
=========================================================================================
File description:
    Filename    : config.js
    Module      : Configuration Module
	Description :
			      This file contains all Configuration Properties for the application
	Developed By: PLM LOGIX
=========================================================================================
Date         	Developer Name          Description of Change
16-Dec-2016  	Uday Garud              Initial Version
16-Dec-2016  	Uday Garud              Added Configurable status fields
16-Dec-2016  	Uday Garud              Added email configuration
16-Dec-2016  	Uday Garud              Added configurable instructions
16-Dec-2016  	Uday Garud              Added configurable email subjects and email text
16-Dec-2016  	Uday Garud              Added configurable success and error message for login and registration 
16-Dec-2016  	Uday Garud              Added configurable success and error message for main account 
16-Dec-2016  	Uday Garud              Added configurable success and error message for supplier account 
=======================================================================================*/
"use strict";
/* jshint node: true */

var props = {};
props.appport = 8000;    // Application Port Number
props.ethereumIP = 'localhost'; // Ethereume Node IP Address
props.ethereumPORT = '8545';  // Ethereum Node Port Number

//Configurable status fields
props.status_created = 'Published';  
props.status_republished = 'Re-Published';
props.status_completed = 'Completed';
props.status_pending = 'Pending';
props.status_accepted = 'Accepted';
props.status_rejected = 'Rejected';
props.status_outofstatus = 'Out Of Status';
props.status_terms_updated = 'Terms-Updated';    

//Email configuration
props.Email_SMTP_Address = 'smtp.gmail.com';  //Example smtp.zoho.com
props.Email_SMTP_Port = 465;
props.Email_Sender_Address = ''; //Example 'abc@sample.com'
props.Email_Sender_Password = '';//example 'password'

//Configurable email subjects and email text

props.email_publish_subject_en = "New Contract %s is Published";
props.email_publish_body_en = '<p>Dear %s ,<br/><br/> New Contract %s is Published. Please Login to your account for more details.</p>';

props.email_publish_subject_fr = "Nouveau contrat %s publié";
props.email_publish_body_fr = '<p>cher %s ,<br/><br/>Nouveau contrat %s publié. Veuillez vous connecter à votre compte pour vérifier les détails.</p>';

props.email_republish_subject_en = "Contract %s is Re-Published";
props.email_republish_body_en = '<p>Dear %s ,<br/><br/> Contract %s is Re-Published with updated terms. Please Login to your account for more details.</p>';

props.email_republish_subject_fr = "Le contrat %s est re-publié ";
props.email_republish_body_fr = '<p>cher %s ,<br/><br/> Le contrat %s est re-publié avec des termes mis à jour. Veuillez vous connecter à votre compte pour vérifier les détails.</p>';

props.email_accept_contract_subject_en = "Contract %s is Accepted by Supplier %s ";
props.email_accept_contract_body_en = '<p>Dear %s , <br/><br/> Contract %s is Accepted by Supplier %s. Please Login to your account for more details.</p>';

props.email_accept_contract_subject_fr = "Le contrat %s est accepté par le fournisseur %s";
props.email_accept_contract_body_fr = '<p>cher %s , <br/><br/>Le contrat %s est accepté par le fournisseur %s. Veuillez vous connecter à votre compte pour vérifier les détails.</p>';

props.email_reject_contract_subject_en = "Contract %s is Rejected by Supplier %s ";
props.email_reject_contract_body_en = '<p>Dear %s , <br/><br/> Contract %s is Rejected by Supplier %s. Please Login to your account for more details.</p>';

props.email_reject_contract_subject_fr = "Le contrat %s est rejeté par le fournisseur %s";
props.email_reject_contract_body_fr = '<p>cher %s , <br/><br/>Le contrat %s est rejeté par le fournisseur %s. Veuillez vous connecter à votre compte pour vérifier les détails.</p>';

module.exports = props;


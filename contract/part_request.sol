/*
=========================================================================================
File description:
    Filename    : part_request.sol
    Module      : Ethereum Contract
	Description :
			      This file contains Ethereum Contract written in solidity language.
	Developed By: PLM LOGIX
=========================================================================================
  Date         	Developer Name          Description of Change
16-Dec-2016  	Uday Garud              Initial Version
16-Dec-2016  	Uday Garud              Added global variables and constructor
16-Dec-2016  	Uday Garud              Added function to add assignee (addAssignee)
16-Dec-2016  	Uday Garud              Added function to change status of assignee (signbyAssignee)
16-Dec-2016  	Nisha Mane              Added function to get total tasks (gettasksCount)
16-Dec-2016  	Nisha Mane              Added function to get individual task (gettask) 
16-Dec-2016  	Nisha Mane              Added function to get total assignees (getassigneeCount)
16-Dec-2016  	Nisha Mane              Added function to get individual assignees (getassignee) 
16-Dec-2016  	Uday Garud              Added function to get total status updates (getstatusupdateCount)
16-Dec-2016  	Uday Garud              Added function to get individual status update (getstatusupdate) 
16-Dec-2016  	Uday Garud              Added function to get total comments (getcommentsCount)
16-Dec-2016  	Nisha Mane              Added function to get individual comment (getcomment)
16-Dec-2016  	Nisha Mane              Added function to add comment (addcomment)
16-Dec-2016  	Nisha Mane             Added function to update amount and due date of contract (updatedateandamount)
16-Dec-2016  	Uday Garud              Added function to verify supplier (checkifSupplierpresent)
=======================================================================================*/
pragma solidity ^ 0.4 .2;

//Contract name
contract Partrequest {
    //Start of global variables and contructor declarations
    address public owner; // store owner address
    uint public createddate; // store contract creation date
    string public contractNumber; // store contract Number
    string public contractDescription; // store contract Description
    string public contractOwnedby; // store contract owned by
    string public filehashkey; // store owner file hash key from IPFS
    string public suppfilehashkey; // store supplier file hash key from IPFS
    uint public numberofParts; // store number of parts
    uint public contractamount; // store contract amount
    string public contractduedate; // store contract due date
	//Constructor is called when contract is deployed
    function Partrequest(string _contractNumber, string _contractDescription, string _contractOwnedby, string _filehashkey, uint _numberofParts, uint _contractamount, string _contractduedate, string _status) {
        owner = msg.sender;
        createddate = now;
        contractNumber = _contractNumber;
        contractDescription = _contractDescription;
        contractOwnedby = _contractOwnedby;
        numberofParts = _numberofParts;
        contractamount = _contractamount;
        contractduedate = _contractduedate;
        filehashkey = _filehashkey;
        addAssignee(msg.sender, true, now, _status, ''); //add supplier address into assignee when contract is deployed
    }
    struct Comments {
        address useradress;
        uint createddate;
        string remarks;
    }
    //Store comments in array
    Comments[] public comment;
    struct StatusUpdates {
        string contractid;
        address useradress;
        uint signeddate;
        string status;
        string remarks;
    }
    //Store updates in array
    StatusUpdates[] public statusupdates;
    //modifier for owner to execute function
    modifier onlyOwner {
        if (msg.sender != owner) {
            throw;
        } else {
            _;
        }
    }
    //only owner can execute exitcontract function
    function exitcontract() onlyOwner {
        suicide(owner);
    }
    struct Assigneeinfo {
        address assigneaddress;
        bool isSigned;
        uint signeddate;
        string status;
    }
    //Store assignee in array
    Assigneeinfo[] public assignees;
    //Store tasklist in array
    string[] public taskslist;
    //End of global variables and contructor declarations
    //Function to add task
    function addtasks(string _task) {
        taskslist.push(_task);
    }
    //Function to add assignee
    function addAssignee(address _assigneaddress, bool _isSigned, uint _signeddate, string _status, string _remarks) {
        Assigneeinfo memory assi = Assigneeinfo({
            assigneaddress: _assigneaddress,
            isSigned: _isSigned,
            signeddate: _signeddate,
            status: _status
        });
        assignees.push(assi);
        StatusUpdates memory status = StatusUpdates({
            contractid: contractNumber,
            useradress: _assigneaddress,
            signeddate: _signeddate,
            status: _status,
            remarks: _remarks
        });
        statusupdates.push(status);
    }
    //Function to change status of assignee
    function signbyAssignee(address _supplieraddress, bool _isSigned, string _status, string _comments, string _remarks, bool _isStatusUpdate) {
        for (uint i = 0; i < assignees.length; i++) {
            if (assignees[i].assigneaddress == _supplieraddress) {
                assignees[i].isSigned = _isSigned;
                assignees[i].signeddate = now;
                assignees[i].status = _status;
                if (_isStatusUpdate == true) {
                    StatusUpdates memory status1 = StatusUpdates({
                        contractid: contractNumber,
                        useradress: _supplieraddress,
                        signeddate: now,
                        status: _status,
                        remarks: _remarks
                    });
                    statusupdates.push(status1);
                    Comments memory comments1 = Comments({
                        useradress: _supplieraddress,
                        createddate: now,
                        remarks: _comments
                    });
                    comment.push(comments1);
                }
            }
        }
    }
    //Function to get total tasks
    function gettasksCount() public constant returns(uint) {
        return taskslist.length;
    }
    //Function to get individual task
    function gettask(uint index) public constant returns(string) {
        return (taskslist[index]);
    }
    //Function to get total assignees
    function getassigneeCount() public constant returns(uint) {
        return assignees.length;
    }
    //Function to get individual assignees
    function getassignee(uint index) public constant returns(address, bool, uint, string) {
        return (assignees[index].assigneaddress, assignees[index].isSigned, assignees[index].signeddate, assignees[index].status);
    }
    //Function to get total status updates
    function getstatusupdateCount() public constant returns(uint) {
        return statusupdates.length;
    }
    //Function to get individual status update
    function getstatusupdate(uint index) public constant returns(string, address, uint, string, string) {
        return (statusupdates[index].contractid, statusupdates[index].useradress, statusupdates[index].signeddate, statusupdates[index].status, statusupdates[index].remarks);
    }
    //Function to get total comments
    function getcommentsCount() public constant returns(uint) {
        return comment.length;
    }
    //Function to get individual comment
    function getcomment(uint index) public constant returns(address, uint, string) {
        return (comment[index].useradress, comment[index].createddate, comment[index].remarks);
    }
    //Function to add comment
    function addcomment(address _address, uint _datecreated, string _comment) {
        Comments memory comm = Comments({
            useradress: _address,
            createddate: _datecreated,
            remarks: _comment
        });
        comment.push(comm);
    }
    //Function to update amount and due date of contract
    function updatedateandamount(string _modifieddate, uint _updatedcontractamount, string _status, string _remarks) {
        StatusUpdates memory status1 = StatusUpdates({
            contractid: contractNumber,
            useradress: msg.sender,
            signeddate: now,
            status: _status,
            remarks: _remarks
        });
        statusupdates.push(status1);
        contractamount = _updatedcontractamount;
        contractduedate = _modifieddate;
    }
    //Function to verify supplier
    function checkifSupplierpresent(address _username) public constant returns(bool) {
        for (uint i = 0; i < assignees.length; i++) {
            if (assignees[i].assigneaddress == _username) {
                return true;
            }
        }
        return false;
    }
}
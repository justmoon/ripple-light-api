var check = require("validator").check;

function AccountHistory(options){
  check(options.account).notNull().isAlphanumeric();
  this.account = options.account;
  this.includeMeta = false;
  this.limit = 50;
  this.fromLedger = -1; 
}

AccountHistory.prototype.getPayments = function(){
}

module.exports = AccountHistory;

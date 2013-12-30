var check = require("validator").check;

function AccountHistory(options){
  check(options.account).notNull().isAlphanumeric();
  this.account = options.account;
  this.includeMeta = false;
  this.limit = 50;
  this.fromLedger = -1; 
	this.resultTransactions = [];
}

AccountHistory.prototype.addFormattedTransactions = function(transactions) {
	formattedTransactions = transactions.map(function (entry) {
		return {
			engine_result: entry.meta.TransactionResult,
			tx: entry.tx,
			meta: entry.meta,
			validated: entry.validated
		};
	});

	this.resultTransactions = this.resultTransactions.concat(formattedTransactions);
}

AccountHistory.prototype.getPayments = function() {

}

AccountHistory.prototype.filterTransactions = function(transactions) {
  var accountHistory = this;
	var filtered = transactions.filter(function(entry) {
		var isFromAccount = (entry.tx.Account == accountHistory.account);
		var isToAccount = (entry.tx.Destination == accountHistory.account);
	  return true && (entry.tx.TransactionType == 'Payment') &&
			(isFromAccount || isToAccount);	
	});

	return filtered;
}

module.exports = AccountHistory;

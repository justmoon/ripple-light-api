var check = require("validator").check;
var remote = require('./remote');

function AccountHistory(options){
  check(options.account).notNull().isAlphanumeric();
  this.account = options.account;
  this.includeMeta = false;
  this.limit = 50;
  this.fromLedger = -1; 
	this.resultTransactions = [];
	this.resultLedgerIndex = null;
	this.resultEnoughLedger = null;
  this.remote = options.remote || remote;
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

AccountHistory.handleTransactions = function(err, result) {
	if (err) {
		//handleError(res, err);
		return;
	}

	debug("getAccountPayments: Transactions received: "+result.transactions.length);
	// Once we have enough transactions, we want to write down the ledger
	// number, so we can later make sure that that ledger is loaded
	// completely.
	if (this.resultTransactions.length >= this.limit && !this.resultEnoughLedger) {
		this.resultEnoughLedger = this.resultTransactions[this.resultTransactions.length-1].tx.ledger_index;
	}
	
	this.continueProcessingOrFinish(result);
	filtered = this.filterTransactions(result.transactions);
	this.addFormattedTransactions(filtered);
}

AccountHistory.prototype.getPayments = function() {
  this.getMoreTransactions();
}

AccountHistory.prototype.getMoreTransactions = function(marker) {
  this.remote.request_account_tx({
		account: this.account,
		ledger_index_min: this.fromLedger,
		ledger_index_max: -1,
		limit: 50, 
		forward: true,
		marker: marker
	}, this.handleTransactions);
}

AccountHistory.prototype.continueProcessingOrFinish = function(result, finish) {
	if(!result.marker) {
		this.resultLedgerConsidered = result.ledgerIndexMax;
		finish(false);
 	} else if (this.resultTransactions.length < this.limit) {
	  this.getMoreTransactions(result.marker);
  } else if (+result.marker.ledger === +this.resultEnoughLedger) {
	  this.getMoreTransactions(result.marker);
	} else {
		var lastTransaction = this.resultTransactions[this.resultTransactions.length-1];
		this.resultLedgerConsidered = lastTransaction.tx.ledger_index;
		finish(true);
	}
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

var debug = require('debug')('handler');
var AccountHistory  = require('../account_history');

var remote = require('../remote');

// Usually expects "db" as an injected dependency to manipulate the models
module.exports = function (db) {
	debug('setting up handlers...');

  function handleError(res, message) {
    if ("object" !== typeof message) {
      message = {
        message: message
      };
    }
    message.result = "error";
    res.json(message);
  }

	return {
		getPayments: function(req, res){

		});
		renderIndex: function (req, res) {
			res.render('index', {title: "Express Boilerplate"});
		},

    /**
     * Get payments for an account.
     *
     * This API is intended to be used to get a complete set of payment
     * transactions to and from a Ripple account.
     */
    getAccountPayments: function (req, res) {
			var accountHistory = new AccountHistory({
				account: req.params.account,
				includeMeta: req.query.meta,
				limit: req.query.limit,
				fromLedger: req.query.from_ledger
			});
	
			accountHistory.getPayments(function() {
			
			})

      var account = req.params.account,
          includeMeta = req.query.meta,
          limit = +req.query.limit || 50,
          fromLedger = req.query.from_ledger || -1;

      if (limit < 1) {
        handleError(res, "Limit parameter must be 1 or higher.");
        return;
      }

      var resultTransactions = [],
          resultEnoughLedger,
          resultLedgerConsidered;

			function handleTransactions(err, result) {
				if (err) {
					handleError(res, err);
					return;
				}

				debug("getAccountPayments: Transactions received: "+result.transactions.length);
				// Once we have enough transactions, we want to write down the ledger
				// number, so we can later make sure that that ledger is loaded
				// completely.
				if (resultTransactions.length >= limit && !resultEnoughLedger) {
					resultEnoughLedger = resultTransactions[resultTransactions.length-1].tx.ledger_index;
				}
				
				continueProcessingOrFinish(result);
				filtered = accountHistory.filterTransactions(result.transactions);
				addFormattedTransactions(filtered);
      }

			function addFormattedTransactions(transactions) {
				formattedTransactions = transactions.map(function (entry) {
					return {
						engine_result: entry.meta.TransactionResult,
						tx: entry.tx,
						meta: entry.meta,
						validated: entry.validated
					};  
				}); 

		   	resultTransactions.concat(formattedTransactions);
			}

			function continueProcessingOrFinish(result) {
				if (!result.marker) {
					// We were able to get all transactions up to ledger_index_max
					resultLedgerConsidered = result.ledger_index_max;
					debug('getAccountPayments: Loaded complete result');
					sendResult(false);
				} else if (resultTransactions.length < limit) {
					// We don't have as many transactions as the user wanted yet
					debug('getAccountPayments: Need to get more transactions');
					getMoreTransactions(result.marker);
				} else if (+result.marker.ledger === +resultEnoughLedger) {
					// We have enough transactions, but the last transaction is part of
					// a ledger that we may not have loaded completely, so we need to
					// keep loading until we have it completed.
					debug('getAccountPayments: Need to get the rest of ledger ' +
								resultEnoughLedger);
					getMoreTransactions(result.marker);
				} else {
					// We have enough transactions to return our result
					var lastTransaction = resultTransactions[resultTransactions.length-1];
					resultLedgerConsidered = lastTransaction.tx.ledger_index;
					debug('getAccountPayments: Loaded partial result');
					sendResult(true);
				}
			}

      function getMoreTransactions(marker) {
        remote.request_account_tx({
          account: account,
          ledger_index_min: fromLedger,
          ledger_index_max: -1,
          limit: 50,
          forward: true,
          marker: marker
        }, handleTransactions);
      }

      function sendResult(hasMore) {
        // Strip the metadata if the user didn't explicitly request it
        if (!includeMeta) {
          resultTransactions.forEach(function (entry) {
            delete entry.meta;
          });
        }

        debug('getAccountPayments: Delivering '+resultTransactions.length+' transactions');

        res.json({
          result: "success",
          transactions: resultTransactions,

          // This is the last ledger we have completely returned the
          // transactions from. The next poll should set from_ledger to
          // this value + 1
          last_ledger_considered: resultLedgerConsidered,

          has_more: hasMore
        });
      }

      getMoreTransactions();
    }
	};
};

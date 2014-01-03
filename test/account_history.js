var assert = require('assert');
var expect = require('expect.js');
var sinon = require("sinon");
var AccountHistory = require("../lib/account_history.js");

describe('AccountHistory', function() {
	describe('initialization', function() {
    it("should have an empty array of resultTransactions", function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
			assert(history.resultTransactions.length == 0);
    });
	
		it('should have a resultLedgerIndex of null', function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
			assert(history.resultLedgerIndex == null);
		});

		it('should have a resultEnoughLedger of null', function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
			assert(history.resultEnoughLedger == null);
		});
  });

  describe('#getPayments()', function() {
    var account = 'somerippleaccount'; 

    before(function(done){
      account = 'somerippleaccount';
      done();
    });

    it('should return true', function(){
      history = new AccountHistory({ account: account });
      assert((typeof history.getPayments) == 'function');
    });

    it('should create a valid account history object', function(){
      expect(function(){ 
        history = new AccountHistory({
          account: account 
        });
      }).to.not.throwError();
    });

    it('should require an account', function() {
      expect(function() {
        AccountHistory.getPayments()
      }).to.throwError();
    });

    it('should set the account historys account', function() {
      history = new AccountHistory({ account: account });
      assert(history.account == account);
    });

    it('should default includeMeta flag to false', function() {
      history = new AccountHistory({ account: account });
      assert(history.includeMeta == false);
    });

    it('should by default limit the number of transactions to 50', function() {
      history = new AccountHistory({ account: account });
      assert(history.limit == 50);

    });

    it('should by default start from the accounts first ledger', function() {
      history = new AccountHistory({ account: account });
      assert(history.fromLedger == -1);
    });
  });


	describe('filtering transactions to subset of payments', function() {
		beforeEach(function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
			validPaymentTo = {
		    tx: { TransactionType: 'Payment', Destination: account }	
      };
			validPaymentFrom = {
		    tx: { TransactionType: 'Payment', Account: account }	
      };
    });

		it('should have #filter_payments function', function() {
			assert(typeof history.filterTransactions == 'function');			
		});

		it('#filter_payments should reject transactions that are not payments', function(){
			var entry = { tx: { TransactionType: 'NotAPayment'}};
			assert(history.filterTransactions([entry]).length == 0);
    });

		it('#filter_payments should accept transactions that are payments', function(){
			var entry = new Object(validPaymentFrom);
			assert(history.filterTransactions([entry]).length == 1);
    });

	  it('#filter_payments should reject payments not to or from the account', function(){
			var entry = { tx: { TransactionType: 'Payment'}};
			entry.tx.Destination = null;
			entry.tx.Account = null;
			assert(history.filterTransactions([entry]).length == 0);
			entry.tx.Account = history.account;
			entry.tx.Account = null;
			entry.tx.Destination = history.account;
			assert(history.filterTransactions([entry]).length == 1);
    });
  });

	describe('adding formatted transactions', function(){
		before(function(){
			unformattedTransaction = {
				tx: 'transaction',
				meta: { TransactionResult: 'tesSUCCESS' }, 
			  validated: 'validated'
			}
			history.resultTransactions = [];
		});

		it('should format the transactions', function() {
			assert((typeof history.addFormattedTransactions) == 'function');
		});

		it('should push them all to the resultTransactions', function() {
			assert(history.resultTransactions.length == 0);
			history.addFormattedTransactions([unformattedTransaction]);
			assert(history.resultTransactions.length == 1);
			assert(JSON.stringify(history.resultTransactions[0]) == JSON.stringify({
		    engine_result: 'tesSUCCESS',	
				tx: unformattedTransaction.tx,
				meta: unformattedTransaction.meta,
				validated: unformattedTransaction.validated
			}));
		});
	});

	describe('deciding to continue or finish', function(){
		describe("no marker on the result", function() {
			beforeEach(function(){
				result = {};	
				finish = sinon.spy(); 
			});

			it('should set the resultLedgerConsidered without the result market', function(){
				history.continueProcessingOrFinish(result, finish);	
				assert(history.resultLedgerConsidered == result.ledgerIndexMax);
			});
		});

		describe('having less transactions than the user specified', function(){
			beforeEach(function(){
				finish = sinon.spy(); 
				result = { marker: 21 };
				history.getMoreTransactions = sinon.spy();
			});

	    it('should get more transactions', function(){
		    history.limit = 50;
				history.resultTransactions = [1,2,3];
				history.continueProcessingOrFinish(result, finish);
				assert(history.getMoreTransactions.calledWith(result.marker));
			});		

			it('should finish loading the ledger even if limit is reached', function(){
		    history.limit = 3;
				history.resultTransactions = [1,2,3];
				history.resultEnoughLedger = 999;
				result.marker = { ledger: 999 };
				history.continueProcessingOrFinish(result, finish);
				assert(history.getMoreTransactions.calledWith(result.marker));
			});

			describe('loaded partial result', function(){
			  it('should set the resultLedgerConsidered to the ledger index of the last transaction', function() {
					lastTransaction = { tx: { ledger_index: 43 }};
					history.resultTransactions = [{}, {}, lastTransaction];
					history.continueProcessingOrFinish(result, finish);
					assert(history.resultLedgerConsidered == 43);
				})	
			});
		});
	});

	describe('getting more transactions', function(){
    before(function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
    });
		it('#getMoreTransactions should be a function', function(){
			assert((typeof history.getMoreTransactions) == 'function');
		});

		it('should call ripple account_tx with the configuration', function(){
	    history.remote.request_account_tx = sinon.spy();
			history.getMoreTransactions('marker');
			assert(history.remote.request_account_tx.called);
    });
	});

  describe('handling transactions', function(){
    before(function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
    });
  
    it('should filter the transactions', function(){
      history.filterTransactions = sinon.spy();
      history.addFormattedTransactions = sinon.stub();
      history.continueProcessingOrFinish = sinon.stub();
      var result = { transactions: [] };
      history.handleTransactions(null, result);
      assert(history.filterTransactions.calledWith(result.transactions));
    });
  });

  describe('getting payments with callback', function(){
    it('should set the payment history callback when getPayments is called', function(){
			var account = 'somerippleaccount'; 
      history = new AccountHistory({ account: account });
      assert.equal(history.callback,console.log);
    });
  });
})

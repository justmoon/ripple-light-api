var assert = require('assert');
var expect = require('expect.js');
var AccountHistory = require("../lib/account_history.js");

describe('AccountHistory', function() {
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
})

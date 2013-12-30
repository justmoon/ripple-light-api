var assert = require('assert');
var expect = require('expect.js');
var validator = require("node-validator");
var AccountHistory = require("../lib/account_history.js");

describe('AccountHistory', function() {
  describe('#getPayments()', function() {
    var account = 'somerippleaccount'; 

    before(function(done){
      account = 'somerippleaccount';
      done();
    });

    it('should return true', function(){
      console.log('history');
      history = new AccountHistory({ account: account });
      console.log(history);
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
})

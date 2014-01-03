var AccountHistory = require("../lib/account_history");
var remote = require("../lib/remote");

var accountHistory = new AccountHistory({ 
  account: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
  remote: remote
});

accountHistory.getPayments(function(transactions){
  console.log(accountHistory.resultLedgerIndex);
  console.log(transactions);
});

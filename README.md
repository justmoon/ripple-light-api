# Robust Transaction Detection

The purpose of this module is to keep a record of all the payments made to an
account starting with a particular ledger sequence number.

Future payments can then be found by querying the service again with the 
previously last ledger number once more ledgers have been validated in the
system.

This mechanism is designed to work along side websocket listening for 
account payments since websockets sometimes drop messages.

## Running the Tests

    mocha

Mocha will run all the tests in the /test directory

const models = require('../models');
const auth = require('tokens');
const hashAuthToken = require('hash-auth-token'); 
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {

  auth.createSession(function (response) {
    // console.log('sessionToken      : %s', response.sessionToken);
    // console.log('nonce             : %s', response.nonce);
    // console.log('expirationDateTime: %s', response.expirationDateTime);
    console.log('sessionToken      : %s', hashAuthToken.generate({username: res.body.username}));
    console.log('nonce             : %s', res.nonce);
    console.log('expirationDateTime: %s', res.expirationDateTime);
    next();  
  },
  function(error) {
    console.log('error message: %s', error.message);
  });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/


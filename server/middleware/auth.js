const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // authenticate session
  
  // we need to check if the person is logged in first,
  // if yes, direct to webisite, 
  // if not, direct to login page 
  // CREATE SESSION itself, on the other hand, could just be used to store 
  
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/


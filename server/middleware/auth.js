const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // authenticate session
  
  // we need to check if the person is logged in first,
  // if yes, direct to webisite, 
  // if not, direct to login page 
  // CREATE SESSION itself, on the other hand, could just be used to store 
  Promise.resolve(req.cookies.shortlyId)
    .then(hash => {
      if(!hash){
        throw hash; 
      }
      return models.Sessions.get({ hash }); 
    })
    .tap(session => {
      if (!session){
        throw session; 
      }
    })

    // initialize new session 
    .catch(() => {
      return models.Sessions.create()
        .then(results => {
          return models.Sessions.get({ id: results.insertId})
        })
        .tap(session => {
          res.cookie('shortlyId', session.hash); 
        })
    })
    .then(session => {
      req.session = session; 
      next(); 
    }); 
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  if (!models.Sessions.isLoggedIn(req.session)){
    res.redirect('/login');
  } else {
    next(); 
  }
}


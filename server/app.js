const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const db = require('./db');


const app = express();

// ?? dubayouTF mate ?? // 
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', 
(req, res) => {
  res.render('login');
  
});

app.get('/signup', 
(req, res) => {
  res.render('signup');
});


app.get('/create', 
(req, res) => {
  res.render('index');
});

app.get('/links', 
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login', (req, res, next) => {
  console.log('/LOGIN: post request');
  
  var queryStr = 'SELECT users.password, users.salt FROM users WHERE users.username = ${req.body.username}';
  db.queryAsync(queryStr, function(err, results) {
    models.Users.compare(req.body.password, results[0].password, results[0].salt);
  });
  
  // if success, 
    //.then to generate access token
     
    // store access token/session_id to database
    // sign session id
    // nodeCookie.create(res, user, username, secretCode(token?));
    // append cookie w/token to response message (be sure to add expiration time to session)
  res.end();
});

app.post('/signup', (req, res, next) => {
  console.log('/SIGNUP: post request');

  // RETURNED: PROMISE OBJECT  
  models.Users.create(req.body);

  // FOR NOW //
  // if user exists
  // redirect to login page
  // else 
  // end

  res.end();
});


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;

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


app.get('/', (req, res) => {
// this if stmt is used because req doesn't have session prop yet
  if (!req.session) {
    res.redirect('login'); 
    res.end(); 
// would be correct if stmt when req.session exists
  } else if (models.Sessions.isLoggedIn(req.session)) {
    res.render('index');
  } else {
    res.redirect('login');
  }
});

app.get('/login', (req, res) => {
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

app.get('/index', 
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

const executeQuery = (query, values) => {
  return db.queryAsync(query, values).spread(results => results);
};

app.post('/login', (req, res, next) => {
  console.log('inside /LOGIN: post request');
  console.log('username:', req.body.username);

  // authenticate password
  var queryStr = 'SELECT password, salt FROM users WHERE username = ?';
  var params = [req.body.username]; 

  db.query(queryStr, params, (err, results) => {
    console.log('inside database Query');
    console.log('results: ', results);
    
    var isAuthenticated = models.Users.compare(req.body.password, results[0].password, results[0].salt);
    
    if (isAuthenticated) { // if authenticated

      // create new session w/ user_id
      return models.Sessions.create()
        .then(() => {

          // let queryString = `INSERT INTO ${this.tablename} SET ?`;
          // db.queryAsync(queryString, params);
     
          // GET the userId associated with session 
          // GET user profile for this userId
          // user.models.get(USER'S SHORTLY PAGE);

          // redirect to shortly page
          console.log('inside authentication Promise'); 
          // return app.sendRedirect(res, USERSPECIFICSHORTLYPAGE, 302);
          return res.redirect('index');
        })
        .catch((err) => {
          throw err;
        });
    } else { // if not authentic 
      console.log('NOT authentic: inside redirect to login');
      // redirect back to login page
      res.redirect('login');
    }
  });
});

app.post('/signup', (req, res, next) => {
  console.log('/SIGNUP: post request');

  // RETURNED: PROMISE OBJECT  
  models.Users.create(req.body);
  return models.Sessions.create()
    .then(() => {
      // user.models.get(USER'S SHORTLY PAGE);
    
      // redirect to shortly page
      console.log('inside authentication Promise'); 
      // return app.sendRedirect(res, USERSPECIFICSHORTLYPAGE, 302);
      return res.redirect('index');
    })
    .catch((err) => {
      throw err;
    });
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

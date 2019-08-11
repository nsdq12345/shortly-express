const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const CookieParse = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(CookieParse);
app.use(Auth.createSession);
// app.use()


app.all('/logout',(req,res,next) => {
  var shortlyCookie = req.cookies.shortlyid;
  models.Sessions.delete({hash: shortlyCookie})
  .then(() => {
    res.clearCookie('shortlyid');
    res.cookie('shortlyid', '');
  });
})

app.all('/',
(req, res) => {

  // req.redirect('/login');
  var session = req.session;
  if (!models.Sessions.isLoggedIn(session)) {
    res.redirect('/login');
  } else {
     res.render('index');
  }
});

app.get('/create',
(req, res) => {
  if(!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login')
  } else {
    res.render('index');
  }
});

app.get('/links',
(req, res, next) => {
  // if(!models.Sessions.isLoggedIn(req.session)) {
  //   res.redirect('/login');
  // }

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


app.post('/signup', (req,res) => {
   return models.Users.get(req.body)
   .then ((data)=> {
      if(data === undefined) {
        return models.Users.create(req.body)
        .then ((respond)=>{
          return models.Sessions.update({hash: res.cookies.shortlyid.value}, {userId: respond.insertId})
            .then((data) => {
              res.redirect('/');
            })
          //res.setHeader('location', '/')gi
          // console.log('REDIRECTING', req.bodyy);

          //res.send('User created!');
        })
      } else {
        res.redirect('/signup');
        res.send('User exist!');
      }
   })
})

app.get('/login', (req, res) => {
  console.log('HELP');
  app.render('login');
});

app.post('/login',(req, res) => {
  return models.Users.get(req.body)
  .then ((data)=>{
    if (data === undefined) {
      res.redirect('/login');
      res.send('User does not exist. Try again!');

    } else {
      if (models.Users.compare(req.body.password, data.password, data.salt)) {
        res.redirect(300, '/');
        // Cookiparse(req, res, next = () => {});
        // return Auth.createSession(req, res, next = () => {})
        // .then(() => {res.send('Success Login!')})

      } else {

        // res.statusCode = 404;
        res.redirect('/login');
        res.send('Bad login. Try again!');
      }
    }
  })
})

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

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const { OidcStrategy, buildOpenIdClient } = require('./services/oidc-strategy');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { generators } = require('openid-client');

async function createServer() {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const ISSUER = 'http://localhost:3312';
  var app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', indexRouter);
  app.use(passport.initialize());

  const client = await buildOpenIdClient();
  const strategy = new OidcStrategy(client);
  passport.use(
    'oidc',
    strategy
  );

  app.get('/code_start', (_req, res) => {
    const url = client.authorizationUrl({
      scope: 'openid',
      codeChallenge_method: 'S256',
      codeChallenge,
    });
    console.log('Redirected to ', url);
    res.redirect(url);
  });

  app.get('/callback', (req, res) => {
    const params = client.callbackParams(req);
    client.callback(`${ISSUER}/callback`, params, { codeVerifier }) // => Promise
      .then((tokenSet) => {
        client.tokenSet = tokenSet;
        console.log(`Redirected to ${ISSUER}/code_userinfo`);
        res.redirect(`${ISSUER}/code_userinfo`);
      });
  });

  app.get('/code_userinfo', (_req, res) => {
    client.userinfo(client.tokenSet.access_token) // => Promise
      .then((userinfo) => {
        res.send({
          tokenSet: client.tokenSet,
          userinfo,
        });
      });
  });


  app.use('/users', usersRouter);


  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return { app };
}

module.exports = createServer;

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const helpers = require('./helpers');

app.use(cookieSession({
  name: 'session',
  keys: ['tinyapp'],
}));
app.use(bodyParser.urlencoded({extended: true}));
// middleware to check authentification
// app.use('/', (req, res, next) => {
//   const userObject = users[req.session.user_id];
//   const whiteList = ['/', '/login', '/register'];

//   if (userObject || whiteList.includes(req.path)) {
//     return next();
//   }
//   res.redirect('/')
// })

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    timestamp: "2021/07/07",
    visits: 0,
    visitedUser: 0,
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    timestamp: "2021/07/07",
    visits: 0,
    visitedUser: 0,
  }
};

// users database
const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  const userLoginCookie = req.session.user_id;

  // if logged in
  if (userLoginCookie) {
    return res.redirect('/urls');
  } else { // if not logged in
    return res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const userLoginCookie = req.session.user_id;

  // if the user logged in,
  if (userLoginCookie) {
    // find the user urls from the database
    const urls = helpers.urlsForUser(userLoginCookie, urlDatabase);
    const templateVars = {
      user: users[userLoginCookie],
      urls
    };
    return res.render("urls_index", templateVars);
  } else {
    const error = 'User not found!'
    return res.render('404_error', {error});
  }

});

app.get('/urls/new', (req, res) => {
  const userLoginCookie = req.session.user_id;
  const templateVars = {
    user: users[userLoginCookie]
  };
  // check the cookie
  if (userLoginCookie) {
    return res.render('urls_new', templateVars);
  } else {
    return res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const userLoginCookie = req.session.user_id;
  const userUrl = helpers.urlsForUser(userLoginCookie, urlDatabase);
  const currentShortURL = req.params.shortURL;
  const templateVars = {
    user: users[userLoginCookie]
  };
  if (userUrl[currentShortURL].longURL) {
    templateVars.shortURL = currentShortURL;
    templateVars.longURL = urlDatabase[currentShortURL].longURL;
    return res.render('urls_show', templateVars);
  } else {
    return res.render('login_required', templateVars);
  }
});

app.get('/u/:shortURL', (req, res) => {
  for (const shortURL in urlDatabase) {
    if (shortURL === req.params.shortURL) {
      const longURL = urlDatabase[req.params.shortURL].longURL;
      return res.redirect(longURL);
    }
  }
  return res.status(404).send('Error!');
});

app.get('/login', (req, res) => {
  const userLoginCookie = req.session.user_id;
  const templateVars = {
    user: users[userLoginCookie]
  };
  if (userLoginCookie) {
    return res.redirect('/urls');
  } else {
    return res.render('login', templateVars);
  }
});

app.get('/register', (req, res) => {
  const userLoginCookie = req.session.user_id;
  const templateVars = {
    user: users[userLoginCookie]
  };
  if (userLoginCookie) {
    return res.redirect('/urls');
  } else {
    return res.render('register', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const userLoginCookie = req.session.user_id;
  // if the user is logged in,
  if (userLoginCookie) {
    const shortURL = helpers.generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: userLoginCookie
    };
    return res.redirect(`/urls/${shortURL}`);
  } else {
    return res.status(403).send('Error! Please login to add an url');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  // delete the shortURL from the database.
  const userLoginCookie = req.session.user_id;
  const currentShortURL = req.params.shortURL;
  if (urlDatabase[currentShortURL].userID === userLoginCookie) {
    delete urlDatabase[currentShortURL];
    return res.redirect('/urls');
  } else {
    return res.status(403).render('login_required', { user: users[userLoginCookie] });
  }
});

app.post('/urls/:shortURL', (req, res) => {
  // add the shortURL to the database.
  const userLoginCookie = req.session.user_id;
  const currentShortURL = req.params.shortURL;
  const currentLongURL = req.body.longURL;
  if (urlDatabase[currentShortURL].userID === userLoginCookie) {
    urlDatabase[currentShortURL].longURL = currentLongURL;
    return res.redirect('/urls');
  } else {
    return res.status(403).render('login_required', { user: users[userLoginCookie] });
  }
});

app.post('/login', (req, res) => {
  // Extract relevant data
  const { email, password } = req.body;
  const loginUser = users[helpers.getUserByEmail(email, users)];

  // if loginUser is exist, email is valid
  if (loginUser) {
    // password check
    if (bcrypt.compareSync(password, loginUser.password)) {
      // create a cookie
      req.session.user_id = loginUser.id;
      return res.redirect('/urls');
    } else {
      return res.status(403).send("Error! Please check your password!");
    }
  } else {
    return res.status(403).send("Error! Please check your email!");
  }
});

app.post('/logout', (req, res) => {
  // click logout btn => clear the cookies
  req.session.user_id = null;
  return res.redirect('/urls');
});

app.post('/register', (req, res) => {
  // generate a random string
  const userId = helpers.generateRandomString();
  const userEmail = req.body.email;
  // bcrypt the password
  const userPassword = bcrypt.hashSync(req.body.password, 10);

  // login failed
  if (!userEmail || !userPassword) {
    return res.status(400).send('Error! Please enter valid email and password.');
  } else if (helpers.getUserByEmail(userEmail, users)) {
    return res.status(400).send('Error! Existing email address.');
  } else { // login success
    users[userId] = {
      id: userId,
      email: userEmail,
      password: userPassword
    };
    req.session.user_id = userId;
    return res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
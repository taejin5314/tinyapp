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
    timestamp: "7/8/2021, 5:55:55 PM",
    visits: 0,
    visitedUser: [],
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    timestamp: "7/8/2021, 2:22:22 PM",
    visits: 0,
    visitedUser: [],
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
  const loggedInUser = req.session.user_id;

  // if logged in
  if (loggedInUser) {
    return res.redirect('/urls');
  } else { // if not logged in
    return res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const loggedInUser = req.session.user_id;

  // if the user logged in,
  if (loggedInUser) {
    // find the user urls from the database
    const urls = helpers.urlsForUser(loggedInUser, urlDatabase);
    const templateVars = {
      user: users[loggedInUser],
      urls
    };
    return res.render("urls_index", templateVars);
  } else {
    const error = 'User not found!'
    return res.render('404_error', {error});
  }

});

app.get('/urls/new', (req, res) => {
  const loggedInUser = req.session.user_id;
  const templateVars = {
    user: users[loggedInUser]
  };
  // check the cookie
  if (loggedInUser) {
    return res.render('urls_new', templateVars);
  } else {
    return res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const loggedInUser = req.session.user_id;
  const userUrl = helpers.urlsForUser(loggedInUser, urlDatabase);
  const currentShortURL = req.params.shortURL;
  const templateVars = {
    user: users[loggedInUser]
  };

  // if the user logged in
  if (loggedInUser) {
    // if the given shortURL is in database
    if (urlDatabase && Object.keys(urlDatabase).includes(currentShortURL)) {
      // if the user url database has the given shortURL
      if (userUrl[currentShortURL].longURL) {
        templateVars.shortURL = currentShortURL;
        templateVars.longURL = urlDatabase[currentShortURL].longURL;
        templateVars.timestamp = urlDatabase[currentShortURL].timestamp;
        templateVars.visits = urlDatabase[currentShortURL].visits++;
        // if the logged in user has never visited the given shortURL,
        if (!urlDatabase[currentShortURL].visitedUser.includes(loggedInUser)) {
          urlDatabase[currentShortURL].visitedUser.push(bcrypt.hashSync(loggedInUser));
        }
        templateVars.visitedUser = urlDatabase[currentShortURL].visitedUser;
        return res.render('urls_show', templateVars);
      } else {
        const error = "You're not on proper account!";
        return res.render('404_error', {error});
      }
    } else {
      const error = "Given short URL does not exist!";
      return res.render('404_error', {error})
    }
  } else {
    const error = "Please log in!";
    return res.render('404_error', {error})
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
  const loggedInUser = req.session.user_id;
  const templateVars = {
    user: users[loggedInUser]
  };
  if (loggedInUser) {
    return res.redirect('/urls');
  } else {
    return res.render('login', templateVars);
  }
});

app.get('/register', (req, res) => {
  const loggedInUser = req.session.user_id;
  const templateVars = {
    user: users[loggedInUser]
  };
  if (loggedInUser) {
    return res.redirect('/urls');
  } else {
    return res.render('register', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const loggedInUser = req.session.user_id;
  // if the user is logged in,
  if (loggedInUser) {
    const shortURL = helpers.generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: loggedInUser,
      timestamp: new Date().toLocaleString(),
      visits: 0,
      visitedUser: []
    };
    return res.redirect(`/urls`);
  } else {
    return res.status(403).send('Error! Please login to add an url');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  // delete the shortURL from the database.
  const loggedInUser = req.session.user_id;
  const currentShortURL = req.params.shortURL;
  if (urlDatabase[currentShortURL].userID === loggedInUser) {
    delete urlDatabase[currentShortURL];
    return res.redirect('/urls');
  } else {
    return res.status(403).render('login_required', { user: users[loggedInUser] });
  }
});

app.post('/urls/:shortURL', (req, res) => {
  // add the shortURL to the database.
  const loggedInUser = req.session.user_id;
  const currentShortURL = req.params.shortURL;
  const currentLongURL = req.body.longURL;

  // check the logged in user
  if (urlDatabase[currentShortURL].userID === loggedInUser) {
    urlDatabase[currentShortURL].longURL = currentLongURL;
    urlDatabase[currentShortURL].timestamp = new Date().toLocaleString();
    urlDatabase[currentShortURL].visits = 0;
    urlDatabase[currentShortURL].visitedUser = [];
    return res.redirect('/urls');
  } else {
    return res.status(403).render('login_required', { user: users[loggedInUser] });
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
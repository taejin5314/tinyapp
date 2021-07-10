const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {generateRandomString, getUserByEmail, getUserByID, urlsForUser} = require('./helpers');
const methodOverride = require('method-override');

app.set('trust proxy', 1);

// cookie session
app.use(cookieSession({
  name: 'session',
  keys: ['taejin'],
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

// urls database
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

// home page
app.get("/", (req, res) => {
  const loggedInUser = req.session.userID;

  // if logged in
  if (loggedInUser) {
    return res.redirect('/urls');
  } else { // if not logged in
    return res.redirect('/login');
  }
});

// url pages
app.get('/urls', (req, res) => {
  const loggedInUser = req.session.userID;

  // if the user logged in,
  if (loggedInUser) {
    // find the user urls from the database
    const urls = urlsForUser(loggedInUser, urlDatabase);
    const templateVars = {
      user: users[loggedInUser],
      urls
    };
    return res.render("urls_index", templateVars);
  } else {
    return res.status(401).send('<h1>401 - You are not authorized!</h1><a href="/">Go back</a>');
  }
});

// create new URL
app.get('/urls/new', (req, res) => {
  const loggedInUser = req.session.userID;
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

// URL edit page
app.get('/urls/:shortURL', (req, res) => {
  const loggedInUser = req.session.userID;
  const userUrl = urlsForUser(loggedInUser, urlDatabase);
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
        templateVars.visits = ++urlDatabase[currentShortURL].visits;
        // if the logged in user has never visited the given shortURL,
        if (!urlDatabase[currentShortURL].visitedUser.includes(loggedInUser)) {
          urlDatabase[currentShortURL].visitedUser.push(loggedInUser);
        }
        templateVars.visitedUser = urlDatabase[currentShortURL].visitedUser;
        return res.render('urls_show', templateVars);
      } else {
        // even the user doesn't own the url, it will increase visits and visitedUser
        urlDatabase[currentShortURL].visits++;
        if (!urlDatabase[currentShortURL].visitedUser.includes(loggedInUser)) {
          urlDatabase[currentShortURL].visitedUser.push(loggedInUser);
        }
        return res.status(401).send('<h1>401 - You are not authorized!</h1><a href="/">Go back</a>');
      }
    } else {
      return res.status(404).send('<h1>404 - Given short url does not exist!</h1><a href="/">Go back</a>');
    }
  } else {
    return res.status(401).send('<h1>401 - Please log in!</h1><a href="/">Go back</a>');
  }
});

// link to longURL
app.get('/u/:shortURL', (req, res) => {
  for (const shortURL in urlDatabase) {
    if (shortURL === req.params.shortURL) {
      const longURL = urlDatabase[req.params.shortURL].longURL;
      return res.redirect(longURL);
    }
  }
  return res.status(404).send('<h1>404 - URL does not exist!</h1><a href="/">Go back</a>');
});

// login page
app.get('/login', (req, res) => {
  const loggedInUser = req.session.userID;
  const templateVars = {
    user: users[loggedInUser]
  };

  // if user is logged in
  if (getUserByID(loggedInUser, users)) {
    return res.redirect('/urls');
  } else {
    return res.render('login', templateVars);
  }
});

// registration
app.get('/register', (req, res) => {
  const loggedInUser = req.session.userID;
  const templateVars = {
    user: users[loggedInUser]
  };

  // if user is logged in
  if (getUserByID(loggedInUser, users)) {
    return res.redirect('/urls');
  } else {
    return res.render('register', templateVars);
  }
});

// post a new url
app.post('/urls', (req, res) => {
  const loggedInUser = req.session.userID;
  // if the user is logged in,
  if (loggedInUser) {
    // generating random short url
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: loggedInUser,
      timestamp: new Date().toLocaleString(),
      visits: 0,
      visitedUser: []
    };
    return res.redirect(`/urls/${shortURL}`);
  } else {
    return res.status(401).send('<h1>401 - You must log in to create url!</h1><a href="/">Go back</a>');
  }
});

// method override - delete
app.delete('/urls/:shortURL', (req, res) => {
  const loggedInUser = req.session.userID;
  const currentShortURL = req.params.shortURL;

  // if the logged in user owns the url
  if (urlDatabase[currentShortURL].userID === loggedInUser) {
    delete urlDatabase[currentShortURL];
    return res.redirect('/urls');
  } else if (!loggedInUser) {
    return res.status(401).send('<h1>401 - Please log in!</h1><a href="/">Go back</a>');
  } else {
    return res.status(401).send('<h1>401 - You are not authorized!</h1><a href="/">Go back</a>');
  }
});

// method override - put
app.put('/urls/:shortURL', (req, res) => {
  // add the shortURL to the database.
  const loggedInUser = req.session.userID;
  const currentShortURL = req.params.shortURL;
  const currentLongURL = req.body.longURL;

  // if the logged in user owns the url
  if (urlDatabase[currentShortURL] && urlDatabase[currentShortURL].userID === loggedInUser) {
    // updating url info
    urlDatabase[currentShortURL].longURL = currentLongURL;
    urlDatabase[currentShortURL].timestamp = new Date().toLocaleString();
    urlDatabase[currentShortURL].visits = 0;
    urlDatabase[currentShortURL].visitedUser = [];
    return res.redirect('/urls');
  } else if (!loggedInUser) {
    return res.status(401).send('<h1>401 - Please log in!</h1><a href="/">Go back</a>');
  } else {
    return res.status(401).send('<h1>401 - You are not authorized!</h1><a href="/">Go back</a>');
  }
});

// login page
app.post('/login', (req, res) => {
  // Extract relevant data
  const { email, password } = req.body;
  const loginUser = users[getUserByEmail(email, users)];

  // if loginUser is exist, email is valid
  if (loginUser) {
    // password check
    if (bcrypt.compareSync(password, loginUser.password)) {
      // create a cookie
      req.session.userID = loginUser.id;
      return res.redirect('/urls');
    } else {
      return res.status(400).send('<h1>400 - Invalid credentials. Please check your password!</h1><a href="/">Go back</a>');
    }
  } else {
    return res.status(400).send('<h1>400 - Invalid credential. Please check your email!</h1><a href="/">Go back</a>');
  }
});

// logout
app.post('/logout', (req, res) => {
  // click logout btn => clear the cookies
  req.session = null;
  return res.redirect('/urls');
});

// create an account
app.post('/register', (req, res) => {
  // generate a random string
  const userID = generateRandomString();
  const userEmail = req.body.email;
  // bcrypt the password
  const userPassword = req.body.password;

  // if email or password are empty
  if (!userEmail || !userPassword) {
    return res.status(400).send('<h1>400 - Please enter valid email and password!</h1><a href="/">Go back</a>');
  } else if (getUserByEmail(userEmail, users)) { // if email already exists
    return res.status(400).send('<h1>400 - Email is already in use!</h1><a href="/">Go back</a>');
  } else {
    // create a new user
    users[userID] = {
      id: userID,
      email: userEmail,
      password: bcrypt.hashSync(userPassword, 10)
    };
    // sets a cookie
    req.session.userID = userID;
    return res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
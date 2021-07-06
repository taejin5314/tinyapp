const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// url database
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

// users database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Functions
const generateRandomString = function() {
  let result = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    result += characters[Math.floor(Math.random() * charactersLength)];
  }
  return result;
};

// Look up helper function
const lookUp = function(value, field) {
  for (const userId in users) {
    if (users[userId][field] === value) {
      return true;
    }
  }
  return false;
};

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get('/hello', (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get('/urls/new', (req, res) => {
  const userCookie = req.cookies["user_id"];
  const templateVars = {
    user: users[userCookie]
  };
  // check the cookie
  if (userCookie) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  for (const shortURL in urlDatabase) {
    if (shortURL === req.params.shortURL) {
      const longURL = urlDatabase[req.params.shortURL].longURL;
      res.redirect(longURL);
    }
  }
  res.status(404).send('Error!');
});

app.get('/login', (req, res) => {
  const userCookie = req.cookies["user_id"];
  const templateVars = {
    user: users[userCookie]
  };
  if (userCookie) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});

app.get('/register', (req, res) => {
  const userCookie = req.cookies["user_id"];
  const templateVars = {
    user: users[userCookie]
  };
  if (userCookie) {
    res.redirect('/urls');
  } else {
    res.render('register', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const userCookie = req.cookies['user_id'];
  if (userCookie) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: userCookie
    };
    console.log(urlDatabase);
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send('Error! Please login to add an url');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  let match = false;
  for (const userId in users) {
    if (users[userId].password === req.body.password && users[userId].email === req.body.email) {
      match = true;
      res.cookie('user_id', userId).redirect('/urls');
    }
  }
  if (!match) {
    res.status(403).send("Error! Please check your email and password");
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id').redirect('/urls');
});

app.post('/register', (req, res) => {
  const userId = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if (!userEmail || !userPassword) {
    res.status(400).send('Error! Please enter valid email and password.');
  } else if (lookUp(userEmail, 'email')) {
    res.status(400).send('Error! Existing email address.');
  } else {
    users[userId] = {
      id: userId,
      email: userEmail,
      password: userPassword
    };
    res.cookie('user_id', userId).redirect('/urls');
  }
  // console.log(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
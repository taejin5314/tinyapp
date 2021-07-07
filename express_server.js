const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

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

// find url which belongs to the user
const urlsForUser = function(userId) {
  let results = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      results[shortURL] = urlDatabase[shortURL];
    } else {
      results[shortURL] = {
        longURL: undefined,
        userID: urlDatabase[shortURL].userID
      };
    }
  }
  return results;
};

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls', (req, res) => {
  const userCookie = req.cookies["user_id"];
  const urls = urlsForUser(userCookie);
  const templateVars = {
    user: users[userCookie],
    urls
  };
  console.log(users)
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
  const userCookie = req.cookies["user_id"];
  const userUrl = urlsForUser(userCookie);
  const currentShortURL = req.params.shortURL;
  const templateVars = {
    user: users[userCookie]
  };
  if (userUrl[currentShortURL].longURL) {
    templateVars.shortURL = currentShortURL;
    templateVars.longURL = urlDatabase[currentShortURL].longURL;
    res.render('urls_show', templateVars);
  } else {
    res.render('login_required', templateVars);
  }
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
  // if the user is logged in,
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
  // delete the shortURL from the database.
  const userCookie = req.cookies['user_id'];
  const currentShortURL = req.params.shortURL;
  if (urlDatabase[currentShortURL].userID === userCookie) {
    delete urlDatabase[currentShortURL];
    res.redirect('/urls');
  } else {
    res.status(403).render('login_required', { user: users[userCookie] });
  }
});

app.post('/urls/:shortURL', (req, res) => {
  // add the shortURL to the database.
  const userCookie = req.cookies['user_id'];
  const currentShortURL = req.params.shortURL;
  const currentLongURL = req.body.longURL;
  if (urlDatabase[currentShortURL].userID === userCookie) {
    urlDatabase[currentShortURL].longURL = currentLongURL;
    res.redirect('/urls');
  } else {
    res.status(403).render('login_required', { user: users[userCookie] });
  }
});

app.post('/login', (req, res) => {
  let emailMatch = false;
  let passwordMatch = false;
  for (const userId in users) {
    // if the entered password and email is valid,
    if (users[userId].email === req.body.email) {
      emailMatch = true;
      if (bcrypt.compareSync(req.body.password, users[userId].password)) {
        passwordMatch = true;
        res.cookie('user_id', userId).redirect('/urls');
      }
    }
  }
  if (!emailMatch) {
    res.status(403).send("Error! Please check your email!");
  } else if (!passwordMatch) {
    res.status(403).send("Error! Please check your password!");
  }
});

app.post('/logout', (req, res) => {
  // click logout btn => clear the cookies
  res.clearCookie('user_id').redirect('/urls');
});

app.post('/register', (req, res) => {
  const userId = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = bcrypt.hashSync(req.body.password, 10);
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
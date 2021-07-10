const generateRandomString = function() {
  let result = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    result += characters[Math.floor(Math.random() * charactersLength)];
  }
  return result;
};

const getUserByEmail = function(email, database) {
  for (const userID in database) {
    if (database[userID].email === email) {
      return userID;
    }
  }
  return undefined;
};

const getUserByID = function(id, database) {
  for (const userID in database) {
    if (userID === id) {
      return userID;
    }
  }
  return undefined;
};

// find url which belongs to the user
const urlsForUser = function(userId, database) {
  let results = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === userId) {
      results[shortURL] = database[shortURL];
    } else {
      results[shortURL] = {
        longURL: undefined,
        userID: database[shortURL].userID,
        timestamp: database[shortURL].timestamp,
        visits: database[shortURL].visits,
        visitedUser: database[shortURL].visitedUser
      };
    }
  }
  return results;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  getUserByID,
  urlsForUser
};
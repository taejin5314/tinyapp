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
  for (const userId in database) {
    if (database[userId].email === email) {
      return userId;
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
        userID: database[shortURL].userID
      };
    }
  }
  return results;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};
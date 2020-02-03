const jwt = require('jsonwebtoken');
const { models } = require('./db');
const secret = 'catpack';

/**
 * takes a user object and creates  jwt out of it
 * using user.id and user.role
 * @param {Object} user the user to create a jwt for
 */
const createToken = ({ id, role }) => jwt.sign({ id, role }, secret);

/**
 * will attemp to verify a jwt and find a user in the
 * db associated with it. Catches any error and returns
 * a null user
 * @param {String} token jwt from client
 */
const getUserFromToken = token => {
  try {
    const user = jwt.verify(token, secret);
    return models.User.findOne({ id: user.id });
  } catch (e) {
    return null;
  }
};

/**
 * checks if the user is on the context object
 * continues to the next resolver if true
 * @param {Function} next next resolver function ro run
 */
const authenticated = next => (root, args, context, info) => {
  console.log('authen');
  if (!context.user) {
    throw new Error('Not authenticated');
  }
  return next(root, args, context, info);
};

/**
 * checks if the user on the context has the specified role.
 * continues to the next resolver if true
 * @param {String} role enum role to check for
 * @param {Function} next next resolver function to run
 */
const authorized = (role, next) => (root, args, context, info) => {
  console.log('author');
  if (context.user.role !== role) {
    throw new Error('Not authorized');
  }
  return next(root, args, context, info);
};

// admin
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InhrdFZOaFFHSERqejVxMHNXZGNQVyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTU4MDcyMDM0Nn0.LhFXs7tNP5xAp1wUp5MTSg1kVgdrq8N9vtnPwynOVe0

// member
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJCSjZGWHFlNkFHc19fdWVDcUZMcSIsInJvbGUiOiJNRU1CRVIiLCJpYXQiOjE1ODA3MjA0MDh9.cxGji7Kyc8n3_96RlBgi6zi42GZQ5AWeLa8wqZw0vm0

module.exports = {
  getUserFromToken,
  authenticated,
  authorized,
  createToken,
};

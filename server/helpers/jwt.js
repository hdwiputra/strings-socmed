const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const signToken = (obj) => {
  return jwt.sign(obj, JWT_SECRET);
};

const verifyToken = (signToken) => {
  return jwt.verify(signToken, JWT_SECRET);
};

module.exports = {
  signToken,
  verifyToken,
};

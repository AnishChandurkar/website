const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "authentication required!! try logging in again :(" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "session expired :( please log in again." });
  }
};

module.exports = auth;

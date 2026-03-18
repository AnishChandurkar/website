const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, emailid: user.emailid },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const register = async (req, res) => {
  try {
    const { first_name, surname, emailid, password } = req.body;

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE emailid = ?",
      [emailid],
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      "INSERT INTO users (first_name, surname, emailid, password_hash) VALUES (?, ?, ?, ?)",
      [first_name, surname, emailid, password_hash],
    );

    const user = { id: result.insertId, emailid };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered!!",
      user: { id: user.id, first_name, surname, emailid },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailid, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE emailid = ?", [
      emailid,
    ]);
    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
    );

    // Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        first_name: user.first_name,
        surname: user.surname,
        emailid: user.emailid,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Refesh token required" });

  try {
    const [tokenRows] = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [refreshToken],
    );

    if (tokenRows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = { id: decoded.id };
    const [userRows] = await pool.query(
      "SELECT id, emailid FROM users WHERE id = ?",
      [decoded.id],
    );
    if (userRows.length === 0)
      return res.status(403).json({ message: "User not found" });

    const newAccessToken = generateAccessToken(userRows[0]);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Refresh token expired or invalid" });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [
      refreshToken,
    ]);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, first_name, surname, emailid, profile_url, created_at FROM users WHERE id = ?",
      [req.user.id],
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profileUrl = `/uploads/avatars/${req.file.filename}`;

    await pool.query("UPDATE users SET profile_url = ? WHERE id = ?", [
      profileUrl,
      req.user.id,
    ]);

    res.json({ message: "Profile picture updated", profile_url: profileUrl });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { register, login, refresh, logout, getProfile, updateProfilePicture };

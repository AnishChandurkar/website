import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import fs from "fs";
import path from "path";

export interface AuthRequest extends Request {
  user?: { id: number; emailid?: string; projectRole?: string } | undefined;
}

interface UserRow extends RowDataPacket {
  id: number;
  first_name: string;
  surname: string;
  emailid: string;
  password_hash: string;
  profile_url?: string;
  created_at?: Date;
}

const generateAccessToken = (id: number, emailid: string): string => {
  return jwt.sign({ id, emailid }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id: number): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

const setAccessTokenCookie = (res: Response, token: string) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 mins
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { first_name, surname, emailid, password } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE emailid = ?",
      [emailid]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (first_name, surname, emailid, password_hash) VALUES (?, ?, ?, ?)",
      [first_name, surname, emailid, password_hash]
    );

    const userId = result.insertId;
    const accessToken = generateAccessToken(userId, emailid);
    const refreshToken = generateRefreshToken(userId);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: userId, first_name, surname, emailid },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailid, password } = req.body;

    const [users] = await pool.query<UserRow[]>(
      "SELECT * FROM users WHERE emailid = ?",
      [emailid]
    );

    const user = users[0];
    if (!user) {
      return res.status(400).json({ message: "Invalid Email-ID!!" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password!!" });
    }

    const accessToken = generateAccessToken(user.id, user.emailid);
    const refreshToken = generateRefreshToken(user.id);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        first_name: user.first_name,
        surname: user.surname,
        emailid: user.emailid,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const [tokenRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [refreshToken]
    );

    if (tokenRows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { id: number };

    const [userRows] = await pool.query<UserRow[]>(
      "SELECT id, emailid FROM users WHERE id = ?",
      [decoded.id]
    );

    const user = userRows[0];
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user.id, user.emailid);
    setAccessTokenCookie(res, newAccessToken);

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [users] = await pool.query<UserRow[]>(
      "SELECT id, first_name, surname, emailid, profile_url, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ message: "No avatar provided" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await pool.query(
      "UPDATE users SET profile_url = ? WHERE id = ?",
      [avatar, req.user.id]
    );

    res.json({ message: "Profile picture updated", profile_url: avatar });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized to do this" });

    const { first_name, surname, emailid } = req.body;

    if (emailid) {
      const [existing] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE emailid = ? AND id != ?",
        [emailid, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already exists, maybe try adding a few special characters towards the end instead?" });
      }
    }

    const sets: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) { sets.push("first_name = ?"); values.push(first_name); }
    if (surname !== undefined) { sets.push("surname = ?"); values.push(surname); }
    if (emailid !== undefined) { sets.push("emailid = ?"); values.push(emailid); }

    if (sets.length === 0) return res.status(400).json({ message: "Nothing to update" });

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);

    const [updated] = await pool.query<UserRow[]>(
      "SELECT id, first_name, surname, emailid, profile_url, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({ message: "Profile updated", user: updated[0] });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const [users] = await pool.query<UserRow[]>(
      "SELECT password_hash FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.user.id]);

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

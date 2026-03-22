import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../controllers/authController";

// check if user is authenticated
const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "authentication required!! try logging in again :(" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; emailid: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "session expired :( please log in again." });
  }
};

export default auth;

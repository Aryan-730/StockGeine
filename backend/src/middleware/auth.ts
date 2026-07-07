import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const protect = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No authentication token provided");
    }
    const token = header.split(" ")[1];
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("User no longer exists or is inactive");
    }

    req.user = payload;
    next();
  }
);

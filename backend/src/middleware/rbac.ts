import { Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { AuthRequest } from "./auth";
import { UserRole } from "../models/User";

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not permitted to perform this action`
      );
    }
    next();
  };
}

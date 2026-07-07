import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { User } from "../models/User";
import { Business } from "../models/Business";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { businessName, businessType, name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const business = await Business.create({
    name: businessName,
    type: businessType || "hybrid",
    owner: undefined,
  });

  const user = await User.create({
    name,
    email,
    password,
    role: "owner",
    business: business._id,
  });

  business.owner = user._id as any;
  await business.save();

  const token = signToken({
    userId: String(user._id),
    role: user.role,
    businessId: String(business._id),
  });

  sendSuccess(
    res,
    {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      business: { id: business._id, name: business.name, type: business.type },
    },
    "Account created successfully",
    201
  );
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password").populate("business");
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const populatedBusiness = user.business as unknown as { _id: string };

  const token = signToken({
    userId: String(user._id),
    role: user.role,
    businessId: String(populatedBusiness._id),
  });

  sendSuccess(res, {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    business: user.business,
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId).populate("business");
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    business: user.business,
  });
});

export const inviteTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const user = await User.create({
    name,
    email,
    password,
    role,
    business: req.user!.businessId,
  });

  sendSuccess(
    res,
    { id: user._id, name: user.name, email: user.email, role: user.role },
    "Team member added successfully",
    201
  );
});

export const listTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await User.find({ business: req.user!.businessId }).select(
    "name email role isActive createdAt"
  );
  sendSuccess(res, team);
});

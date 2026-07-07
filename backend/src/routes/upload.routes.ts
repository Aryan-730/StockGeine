import { Router, Response } from "express";
import { protect, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

const router = Router();

router.post(
  "/image",
  protect,
  upload.single("image"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw ApiError.badRequest("No image file provided");
    sendSuccess(res, { path: `/uploads/${req.file.filename}` }, "Image uploaded");
  })
);

export default router;

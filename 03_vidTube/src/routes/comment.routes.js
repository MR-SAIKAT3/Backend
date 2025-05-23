import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  getVideoComment,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controllers.js";

const router = Router()
router.use(verifyJWT)

router.route("/:videoId").get(getVideoComment).post(addComment)
router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router
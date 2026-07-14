import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/messageController";
import { validate } from "../middleware/validate";
import { createMessageSchema } from "../schemas/messageSchema";

const router = Router({ mergeParams: true });

router.post("/", validate(createMessageSchema), sendMessage);
router.get("/", getMessages);

export default router;

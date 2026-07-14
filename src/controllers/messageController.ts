import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  findConsultationForParty,
  assertActiveForMessaging,
} from "../services/consultationService";
import type { CreateMessageInput } from "../schemas/messageSchema";

const messageInclude = {
  sender: { select: { id: true, name: true, role: true } },
} satisfies Prisma.MessageInclude;

type MessageWithSender = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

const toMessageDto = (m: MessageWithSender) => ({
  id: m.id,
  content: m.content,
  createdAt: m.createdAt,
  sender: { id: m.sender.id, name: m.sender.name, role: m.sender.role },
});

export const sendMessage = asyncHandler(async (req, res) => {
  const consultationId = Number(req.params.id);
  const { content } = req.body as CreateMessageInput;
  const userId = req.user!.userId;

  const consultation = await findConsultationForParty(consultationId, userId);
  assertActiveForMessaging(consultation.status);

  const message = await prisma.message.create({
    data: { consultationId, senderId: userId, content },
    include: messageInclude,
  });

  res.status(201).json(toMessageDto(message));
});

export const getMessages = asyncHandler(async (req, res) => {
  const consultationId = Number(req.params.id);
  const userId = req.user!.userId;

  await findConsultationForParty(consultationId, userId);

  const messages = await prisma.message.findMany({
    where: { consultationId },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  });

  res.json(messages.map(toMessageDto));
});

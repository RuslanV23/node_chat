import { randomUUID } from 'node:crypto';
import { messages, rooms, users } from '../store/store.js';
import type { Message, Room, User } from '../utils/types/types.js';
import express, { type Request, type Response } from 'express';
import EventEmitter from 'node:events';
import { authMiddleware } from '../midleware/auth.middleware.js';

interface MassageEvents {
  createMessage: [message: Message];
}

export const messageRouter = express.Router();

export const messageEmitter = new EventEmitter<MassageEvents>();

messageRouter.get(
  '/',
  authMiddleware,
  (req: Request<{}, {}, {}, { roomId?: string }>, res: Response) => {
    const { roomId } = req.query;

    const userId = res.locals.user.id;
    if (!roomId) {
      return res.sendStatus(400);
    }

    const foundRoom = rooms.find((item) => item.id === roomId);

    if (!foundRoom) {
      return res.sendStatus(404);
    }

    const accessInRoom =
      foundRoom.usersId.some((id) => id === userId) ||
      foundRoom.ownerId === userId;

    if (!accessInRoom) {
      return res.sendStatus(401);
    }
    const messagesInRoom = messages.filter((message) => {
      return roomId === message.roomId;
    });

    console.log(messagesInRoom);

    res.send(messagesInRoom);
  },
);

messageRouter.post(
  '/',
  authMiddleware,
  (
    req: Request<{}, {}, { roomId?: string; text?: string }, {}>,
    res: Response,
  ) => {
    const { roomId, text } = req.body;

    const userId = res.locals.user.id;
    if (!roomId || !text) {
      return res.sendStatus(400);
    }

    const foundRoom = rooms.find((item) => item.id === roomId);

    if (!foundRoom) {
      return res.sendStatus(404);
    }

    const accessInRoom =
      foundRoom.usersId.some((id) => id === userId) ||
      foundRoom.ownerId === userId;

    if (!accessInRoom) {
      return res.sendStatus(401);
    }

    const newMessage: Message = {
      id: randomUUID().toString(),
      text,
      userId: res.locals.user.id,
      userName: res.locals.user.userName,
      time: new Date(),
      roomId,
    };

    messageEmitter.emit('createMessage', newMessage);

    // console.log(newMessage);
    messages.push(newMessage);

    // console.log(messages);


    res.send(200);
  },
);

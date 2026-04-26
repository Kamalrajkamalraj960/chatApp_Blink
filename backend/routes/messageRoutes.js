import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

import {
    getMessages,
    sendMessage,
    deleteMessage,
    clearChat,
    markMessagesSeen
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/:id', protect, getMessages);

router.post('/:id', protect, upload.single('file'), sendMessage);

router.delete('/:id', protect, deleteMessage);

router.delete('/clear/:id', protect, clearChat);

router.put('/seen/:id', protect, markMessagesSeen);


export default router;

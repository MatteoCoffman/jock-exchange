import { Router } from "express";
import { authMiddleware } from "../lib/auth.js";
import { sendRouteError } from "../lib/log.js";
import { executeTrade } from "../lib/trading.js";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { playerId, side, qty } = req.body;
    const result = await executeTrade({
      userId: req.userId,
      playerId,
      side,
      qty: Math.trunc(Number(qty)),
    });
    res.status(201).json(result);
  } catch (err) {
    sendRouteError(res, err, "trades.post");
  }
});

export default router;

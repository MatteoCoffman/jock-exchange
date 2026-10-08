import { Router } from "express";
import { authMiddleware, getUserById, login, publicUser, signup } from "../lib/auth.js";
import { sendRouteError } from "../lib/log.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const result = await signup(req.body.email, req.body.password);
    res.status(201).json(result);
  } catch (err) {
    sendRouteError(res, err, "auth.signup");
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    sendRouteError(res, err, "auth.login");
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    sendRouteError(res, err, "auth.me");
  }
});

export default router;

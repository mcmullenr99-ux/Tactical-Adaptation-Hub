import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import twofaRouter from "./twofa";
import usersRouter from "./users";
import messagesRouter from "./messages";
import staffApplicationsRouter from "./staff-applications";
import milsimRouter from "./milsim";
import adminRouter from "./admin";
import friendsRouter from "./friends";
import securityRouter from "./security";
import notificationsRouter from "./notifications";
import eventsRouter from "./events";
import milsimApplicationsRouter from "./milsim-applications";
import postsRouter from "./posts";
import storageRouter from "./storage";
import stripeRouter from "./stripe";
import motdRouter from "./motd";
import dutyRouter from "./duty";
import qualificationsRouter from "./qualifications";
import milsimOpsRouter from "./milsim-ops";
import aarsRouter from "./aars";
import briefingsRouter from "./briefings";
import statsRouter from "./stats";
import { db } from "@workspace/db";
import { sql as rawSql } from "drizzle-orm";

const router: IRouter = Router();

router.use((req, res, next) => {
  const userId = (req as any).session?.userId;
  if (userId) {
    db.execute(rawSql`UPDATE users SET last_seen_at = now() WHERE id = ${userId}`).catch(() => {});
  }
  next();
});

router.use(healthRouter);
router.use(authRouter);
router.use(twofaRouter);
router.use(usersRouter);
router.use(messagesRouter);
router.use(staffApplicationsRouter);
router.use(milsimRouter);
router.use(adminRouter);
router.use(friendsRouter);
router.use(securityRouter);
router.use(notificationsRouter);
router.use(eventsRouter);
router.use(milsimApplicationsRouter);
router.use(postsRouter);
router.use(storageRouter);
router.use(stripeRouter);
router.use(motdRouter);
router.use(dutyRouter);
router.use(qualificationsRouter);
router.use(milsimOpsRouter);
router.use(aarsRouter);
router.use(briefingsRouter);
router.use(statsRouter);

export default router;

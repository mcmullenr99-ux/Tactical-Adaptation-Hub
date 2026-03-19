import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
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

export default router;

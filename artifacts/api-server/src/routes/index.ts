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

export default router;

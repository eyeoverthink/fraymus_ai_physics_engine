import { Router, type IRouter } from "express";
import sfaRouter from "./sfa";

const router: IRouter = Router();

router.use(sfaRouter);

export default router;

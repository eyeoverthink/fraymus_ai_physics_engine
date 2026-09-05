import { Router, type IRouter } from "express";
import { createSfaRouter, type SfaRouterOptions } from "./sfa";

export default function router(options: SfaRouterOptions = {}): IRouter {
  const router: IRouter = Router();
  router.use(createSfaRouter(options));
  return router;
}

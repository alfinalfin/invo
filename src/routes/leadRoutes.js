import { Router } from "express";
import { scrapeLeads } from "../controllers/leadController.js";

const router = Router();

router.post("/discover-opportunities", scrapeLeads);

export default router;

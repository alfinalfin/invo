import { Router } from "express";
import { scrapeLeads } from "../controllers/leadController.js";

const router = Router();

router.post("/scrape-leads", scrapeLeads);

export default router;

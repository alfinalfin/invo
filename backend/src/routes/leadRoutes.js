import { Router } from "express";
import multer from "multer";
import * as leadController from "../controllers/leadController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/scrape-leads", leadController.scrapeLeads);
router.post("/generate-email", leadController.generateEmail);
router.post("/enrich-single-lead-ai", leadController.enrichSingleLeadAi);
router.post("/import-leads", upload.single("file"), leadController.importLeads);
router.post("/wipe-leads", leadController.wipeLeads);

export default router;

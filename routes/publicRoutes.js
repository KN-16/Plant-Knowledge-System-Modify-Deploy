import express from "express";
import {
  getHomeData,
  getVarietyDetail,
  getPublicVarietiesList,
  getCompareVarieties,
  getTaxonomyTree,
  incrementViewCount,
  checkHealth,
  getTaxonomyPageSmartSelectOptions,
  getTaxonomyList,
  getCompareDataTaxonomy,
  getTaxonomyDetail,
  getTaxonomyTreeSmartSelectOptions,
} from "../controllers/publicController.js";
const router = express.Router();

router.get("/home-data", getHomeData);
router.get("/varieties", getPublicVarietiesList);
router.post("/varieties/compare", getCompareVarieties);
router.get("/taxonomy/smart-select-options", getTaxonomyPageSmartSelectOptions);
router.get("/taxonomy", getTaxonomyList);
router.post("/taxonomy/compare", getCompareDataTaxonomy);
router.get("/taxonomy/detail/:id", getTaxonomyDetail);
router.get("/taxonomy-tree", getTaxonomyTree);
router.get(
  "/taxonomy-tree/smart-select-options",
  getTaxonomyTreeSmartSelectOptions,
);
router.get("/health", checkHealth);
router.get("/varieties/:id", getVarietyDetail);
router.post("/varieties/:id/view", incrementViewCount);

export default router;

import express from "express";

import {
  createCategory,updateCategoryIcons
} from "../controller/category.controller.js"

import {
  createSubCategory,
} from "../controller/subcategory.controller.js";

const router = express.Router();

router.post("/categories", createCategory);
router.patch("/categories/icons", updateCategoryIcons);

router.post("/subcategories", createSubCategory);

export default router;
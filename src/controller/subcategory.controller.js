import mongoose from "mongoose";

import Category from "../model/category.model.js";
import SubCategory from "../model/subcategory.model.js";

export const createSubCategory = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Convert single object to array
    |--------------------------------------------------------------------------
    */

    const subcategories = Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (!subcategories.length) {
      return res.status(400).json({
        success: false,
        message: "Subcategory data is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Allowed Solved By Types
    |--------------------------------------------------------------------------
    */

    const allowedSolvedBy = [
      "CITIZEN",
      "BUSINESS",
      "GOVERNMENT",
    ];

    /*
    |--------------------------------------------------------------------------
    | Basic Validation
    |--------------------------------------------------------------------------
    */

    for (const item of subcategories) {
      if (!item.categoryId) {
        return res.status(400).json({
          success: false,
          message: "categoryId is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.categoryId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid categoryId: ${item.categoryId}`,
        });
      }

      if (!item.subcategoryName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Subcategory name is required",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate Level
      |--------------------------------------------------------------------------
      */

      const level = Number(item.unlockOnLevel?.level || 1);

      if (level < 1 || level > 20) {
        return res.status(400).json({
          success: false,
          message: `Invalid unlock level for ${item.subcategoryName}. Level must be between 1 and 20`,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate solvedBy
      |--------------------------------------------------------------------------
      */

      if (item.solvedBy !== undefined) {
        if (!Array.isArray(item.solvedBy)) {
          return res.status(400).json({
            success: false,
            message: `solvedBy must be an array for ${item.subcategoryName}`,
          });
        }

        const invalidSolvedBy = item.solvedBy.filter(
          (value) => !allowedSolvedBy.includes(value),
        );

        if (invalidSolvedBy.length) {
          return res.status(400).json({
            success: false,
            message: `Invalid solvedBy value for ${item.subcategoryName}: ${invalidSolvedBy.join(", ")}`,
          });
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Categories
    |--------------------------------------------------------------------------
    */

    const categoryIds = [
      ...new Set(
        subcategories.map((item) =>
          String(item.categoryId),
        ),
      ),
    ];

    const categories = await Category.find({
      _id: {
        $in: categoryIds,
      },
    }).select("_id");

    if (categories.length !== categoryIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more category IDs do not exist",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prepare Data
    |--------------------------------------------------------------------------
    */

    const data = subcategories.map((item) => ({
      categoryId: item.categoryId,

      subcategoryName: item.subcategoryName.trim(),

      description: item.description?.trim() || "",

      icon: item.icon || "",

      unlockOnLevel: {
        level: Number(item.unlockOnLevel?.level || 1),
      },

      requiresImage: item.requiresImage === true,

      solvedBy:
        Array.isArray(item.solvedBy) &&
        item.solvedBy.length > 0
          ? [...new Set(item.solvedBy)]
          : ["CITIZEN"],
    }));

    /*
    |--------------------------------------------------------------------------
    | Insert
    |--------------------------------------------------------------------------
    */

    const createdSubCategories =
      await SubCategory.insertMany(data);

    return res.status(201).json({
      success: true,

      message:
        createdSubCategories.length === 1
          ? "Subcategory created successfully"
          : `${createdSubCategories.length} subcategories created successfully`,

      data: createdSubCategories,
    });
  } catch (error) {
    console.error("Create subcategory error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create subcategories",
    });
  }
};
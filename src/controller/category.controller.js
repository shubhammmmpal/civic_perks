import Category from "../model/category.model.js"

export const createCategory = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Support single object AND array
    |--------------------------------------------------------------------------
    |
    | Single:
    | {
    |   "categoryName": "Hazards"
    | }
    |
    | Multiple:
    | [
    |   { "categoryName": "Hazards" },
    |   { "categoryName": "Resources" }
    | ]
    |
    */

    const categories = Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (!categories.length) {
      return res.status(400).json({
        success: false,
        message: "Category data is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    for (const category of categories) {
      if (!category.categoryName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize
    |--------------------------------------------------------------------------
    */

    const normalizedCategories = categories.map((category) => ({
      categoryName: category.categoryName.trim(),
    }));

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    const createdCategories = await Category.insertMany(
      normalizedCategories,
    );

    return res.status(201).json({
      success: true,

      message:
        createdCategories.length === 1
          ? "Category created successfully"
          : `${createdCategories.length} categories created successfully`,

      data: createdCategories,
    });
  } catch (error) {
    console.error("Create category error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create categories",
    });
  }
};

export const updateCategoryIcons = async (req, res) => {
  try {
    const categories = Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (!categories.length) {
      return res.status(400).json({
        success: false,
        message: "Category data is required",
      });
    }

    const operations = categories.map((item) => ({
      updateOne: {
        filter: {
          _id: item.categoryId,
        },

        update: {
          $set: {
            icon: item.icon,
          },
        },
      },
    }));

    const result = await Category.bulkWrite(operations);

    const updatedCategories = await Category.find({
      _id: {
        $in: categories.map((item) => item.categoryId),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category icons updated successfully",
      data: updatedCategories,
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Update category icons error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category icons",
    });
  }
};
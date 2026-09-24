import mongoose from "mongoose";
import Question from "../model/question.model.js"
import User from "../model/user.model.js"
import Category from "../model/category.model.js";
import SubCategory from "../model/subcategory.model.js";

// @desc   Create new question
// @route  POST /api/questions
// @access Admin (ya protected)
export const createQuestion = async (req, res) => {
  try {
    const { questionIndex, question, categories } = req.body;

    // basic validation
    if (!questionIndex || !question || !categories) {
      return res.status(400).json({
        success: false,
        message: "questionIndex, question and categories are required"
      });
    }

    // check duplicate questionIndex
    const exists = await Question.findOne({ questionIndex });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "QuestionIndex already exists"
      });
    }

    const newQuestion = await Question.create({
      questionIndex,
      question,
      categories
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: newQuestion
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// export const getQuestion = async (req, res) => {
//   try {
//     const { identifier } = req.params;

//     let query = {};

//     // check if identifier is Mongo ObjectId
//     if (mongoose.Types.ObjectId.isValid(identifier)) {
//       query._id = identifier;
//     } else if (!isNaN(identifier)) {
//       query.questionIndex = Number(identifier);
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid identifier. Must be _id or numeric questionIndex"
//       });
//     }

//     const question = await Question.findOne(query);

//     if (!question) {
//       return res.status(404).json({
//         success: false,
//         message: "Question not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: question
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

export const getQuestion = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | GET LOGGED-IN USER
    |--------------------------------------------------------------------------
    */

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "level levelName activeMode status",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | USER LEVEL
    |--------------------------------------------------------------------------
    */

    const userLevel = Number(user.level || 1);

    /*
    |--------------------------------------------------------------------------
    | CHECK VANGUARD / GOD MODE
    |--------------------------------------------------------------------------
    |
    | Requirement:
    |
    | Vanguard + Level 1-5
    |     => Show ALL categories + ALL subcategories
    |
    | Normal User
    |     => Show subcategories unlocked up to user's level
    |
    */

    const isVanguardGodMode =
      user.activeMode === "vanguard" &&
      userLevel >= 1 &&
      userLevel <= 5;

    /*
    |--------------------------------------------------------------------------
    | BUILD SUBCATEGORY FILTER
    |--------------------------------------------------------------------------
    */

    const subCategoryFilter = {};

    if (!isVanguardGodMode) {
      subCategoryFilter["unlockOnLevel.level"] = {
        $lte: userLevel,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE SUBCATEGORIES
    |--------------------------------------------------------------------------
    */

    const subCategories = await SubCategory.find(
      subCategoryFilter,
    )
      .select(
        "_id categoryId subcategoryName icon unlockOnLevel requiresImage",
      )
      .lean();

    /*
    |--------------------------------------------------------------------------
    | GET CATEGORY IDS
    |--------------------------------------------------------------------------
    |
    | Only categories having at least one available subcategory
    | will be returned.
    |
    */

    const categoryIds = [
      ...new Set(
        subCategories.map((item) =>
          item.categoryId.toString(),
        ),
      ),
    ];

    /*
    |--------------------------------------------------------------------------
    | GET CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categories = await Category.find({
      _id: {
        $in: categoryIds,
      },
    })
      .select("_id categoryName icon")
      .lean();

    /*
    |--------------------------------------------------------------------------
    | ATTACH SUBCATEGORIES TO CATEGORIES
    |--------------------------------------------------------------------------
    */

    const data = categories.map((category) => {
      const categorySubCategories = subCategories
        .filter(
          (subcategory) =>
            subcategory.categoryId.toString() ===
            category._id.toString(),
        )
        .map((subcategory) => ({
          _id: subcategory._id,

          subcategoryName:
            subcategory.subcategoryName,

          icon: subcategory.icon,

          unlockOnLevel:
            subcategory.unlockOnLevel,

          requiresImage:
            subcategory.requiresImage,
        }));

      return {
        _id: category._id,

        categoryName: category.categoryName,

        icon: category.icon,

        subcategories: categorySubCategories,
      };
    });

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      question: "What's the issue?",

      user: {
        level: userLevel,
        levelName: user.levelName,
        activeMode: user.activeMode,
        godMode: isVanguardGodMode,
      },

      data,
    });
  } catch (error) {
    console.error("Get question error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get question",
    });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({})
      .sort({ questionIndex: 1 }); // ordered response

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
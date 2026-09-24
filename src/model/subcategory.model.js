import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subcategoryName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    icon: {
      type: String,
      default: "",
    },

    unlockOnLevel: {
      level: {
        type: Number,
        default: 1,
        min: 1,
        max: 20,
      },
    },

    requiresImage: {
      type: Boolean,
      default: false,
    },
    solvedBy: {
      type: [
        {
          type: String,
          enum: ["CITIZEN", "BUSINESS", "GOVERNMENT"],
        },
      ],
      default: ["CITIZEN"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("SubCategory", subCategorySchema);

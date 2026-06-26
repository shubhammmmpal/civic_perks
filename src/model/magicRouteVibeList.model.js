import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }
}, { _id: false });

const magicRouteVibeListSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },

  subCategories: [subCategorySchema]

}, {
  timestamps: true
});

export default mongoose.model(
  "MagicRouteVibeList",
  magicRouteVibeListSchema
);
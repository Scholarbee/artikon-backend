const expressAsyncHandler = require("express-async-handler");
const Category = require("../models/categoryModel");

/**
 * Get all categories
 */
exports.getCategories = expressAsyncHandler(async (req, res) => {
  const categories = await Category.find({});

  if (categories) {
    res.status(200).json({ success: true, categories });
  } else {
    res.status(400);
    throw new Error("Server error");
  }
});

/**
 * All new category
 */
exports.addCategory = expressAsyncHandler(async (req, res) => {
  if (!req.body.category) {
    res.status(400);
    throw new Error("Category is required");
  }

  const categoryExist = await Category.findOne({ Category: req.body.category });

  if (categoryExist) {
    res.status(400);
    throw new Error("Category already exist.");
  }

  const category = await Category.create({ category: req.body.category });

  if (category) {
    res.status(201).json({ success: true, category });
  } else {
    res.status(400);
    throw new Error("Server error");
  }
});

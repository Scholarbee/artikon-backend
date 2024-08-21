const router = require("express").Router();
const {
  getCategories,
  addCategory,
} = require("../controllers/categoryController");

router.get("/", getCategories);
router.post("/add-category", addCategory);
// router.put("/edit-category", editCategory);
// router.delete("/delete-category", editCategory);

module.exports = router;

const router = require("express").Router();
const {
  deltUser,
  edittUser,
  getUser,
  getUsers,
  addtUser,
} = require("../controllers/userController");

router.get("/all-users", getUsers);
router.get("/user/:id", getUser);
router.post("/add-user", addtUser);
router.put("/edit-user", edittUser);
router.delete("/delete-user", deltUser);

module.exports = router;

const router = require("express").Router();
const userInfo = require("../middleWare/authMiddleware");
const {
  deltUser,
  edittUser,
  getUser,
  getUsers,
  addtUser,
  login,
  logout,
  loginStatus,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

router.get("/all-users", getUsers);
router.get("/user/:id", getUser);
router.post("/add-user", addtUser);
router.put("/edit-user/:id", edittUser);
router.delete("/delete-user/:id", deltUser);

// Auth
router.post("/login", login);
router.get("/logout", logout);
router.get("/login-status", loginStatus);

router.post("/change-password", userInfo, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);

module.exports = router;

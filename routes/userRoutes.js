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
  unblockUser,
  blockUser,
} = require("../controllers/userController");

router.get("/", userInfo, getUsers);
router.get("/user", userInfo, getUser);
router.post("/add-user", addtUser);
router.put("/edit-user", userInfo, edittUser);
router.put("/block-user/:id", blockUser);
router.put("/unblock-user/:id", unblockUser);
router.delete("/delete-user/:id", deltUser);

// Auth
router.post("/login", login);
router.get("/logout", logout);
router.get("/login-status", loginStatus);

router.post("/change-password", userInfo, changePassword);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);

module.exports = router;

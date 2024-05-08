const userRouter = require("express").Router();
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

userRouter.get("/all-users", getUsers);
userRouter.get("/user/:id", getUser);
userRouter.post("/add-user", addtUser);
userRouter.put("/edit-user", userInfo, edittUser);
userRouter.delete("/delete-user/:id", deltUser);

// Auth
userRouter.post("/login", login);
userRouter.get("/logout", logout);
userRouter.get("/login-status", loginStatus);

userRouter.post("/change-password", userInfo, changePassword);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password/:resetToken", resetPassword);

module.exports = userRouter;

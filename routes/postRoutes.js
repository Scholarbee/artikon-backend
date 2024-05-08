const postRouter = require("express").Router();
const userInfo = require("../middleWare/authMiddleware");
const {
  createPost,
  myPosts,
  allPosts,
  editPost,
  addLike,
  removeLike,
  addComment,
  deletePost,
} = require("../controllers/postController");

postRouter.get("/all-posts", allPosts);
postRouter.get("/my-posts", myPosts);
// postRouter.get("/user/:id", getUser);
postRouter.post("/create-post", userInfo , createPost);
postRouter.put("/edit-post/:id", userInfo, editPost);
postRouter.put("/add-like/:id", userInfo, addLike);
postRouter.put("/remove-like/:id", userInfo, removeLike);
postRouter.put("/comment/:id", userInfo, addComment);
postRouter.delete("/delete-post/:id", userInfo, deletePost);

module.exports = postRouter;

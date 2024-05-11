const router = require("express").Router();
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

router.get("/all-posts", allPosts);
router.get("/my-posts", myPosts);
// router.get("/user/:id", getUser);
router.post("/create-post", userInfo, createPost);
router.put("/edit-post/:id", userInfo, editPost);
router.put("/add-like/:id", userInfo, addLike);
router.put("/remove-like/:id", userInfo, removeLike);
router.put("/comment/:id", userInfo, addComment);
router.delete("/delete-post/:id", userInfo, deletePost);

module.exports = router;

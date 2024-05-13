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
const Multer = require("multer");

const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});

router.get("/all-posts", allPosts);
router.get("/my-posts", userInfo, myPosts);
router.post("/create-post", upload.single("my_file"), userInfo, createPost);
router.put("/edit-post/:id", userInfo, editPost);
router.put("/add-like/:id", userInfo, addLike);
router.put("/remove-like/:id", userInfo, removeLike);
router.put("/comment/:id", userInfo, addComment);
router.delete("/delete-post/:id", userInfo, deletePost);

module.exports = router;

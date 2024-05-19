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
  getPost,
  getPostInfo,
  bookAppointment,
  placeOrder,
} = require("../controllers/postController");
const Multer = require("multer");

const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});

router.get("/all-posts", allPosts);
router.get("/post/:id", getPost);
router.get("/post-info/:id", getPostInfo);
router.get("/my-posts", userInfo, myPosts);
router.post("/create-post", upload.single("my_file"), userInfo, createPost);
router.put("/edit-post/:id", userInfo, editPost);
router.put("/add-like/:id", userInfo, addLike);
router.put("/remove-like/:id", userInfo, removeLike);
router.put("/add-comment/:id", userInfo, addComment);
router.delete("/delete-post/:id", userInfo, deletePost);

router.put("/post/book-appointment/:id", userInfo, bookAppointment);
router.put("/post/place-order/:id", userInfo, placeOrder);

module.exports = router;

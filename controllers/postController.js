const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Post = require("../models/postModel");
// const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Create post
exports.createPost = expressAsyncHandler(async (req, res, next) => {
  const { title, content, image } = req.body;

  //upload image in cloudinary
  //   const result = await cloudinary.uploader.upload(image, {
  //     folder: "artikon",
  //     width: 1200,
  //     crop: "scale",
  //   });

  //   if (!result) {
  //     res.status(500);
  //     throw new Error("Unable to save image");
  //   }
  const post = await Post.create({
    title,
    content,
    postedBy: req.user._id,
    // image: {
    //   public_id: result.public_id,
    //   url: result.secure_url,
    // },
  });
  if (post) {
    res.status(201).json({
      success: true,
      post,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Update post
exports.editPost = expressAsyncHandler(async (req, res) => {
  const { title, content, image } = req.body;
  const currentPost = await Post.findById(req.params.id);

  //build the object data
  const data = {
    title: title || currentPost.title,
    content: content || currentPost.content,
    // image: image || currentPost.image,
  };

  //modify post image conditionally
  //   if (req.body.image !== "") {
  //     const ImgId = currentPost.image.public_id;
  //     if (ImgId) {
  //       await cloudinary.uploader.destroy(ImgId);
  //     }

  // const newImage = await cloudinary.uploader.upload(req.body.image, {
  //   folder: "posts",
  //   width: 1200,
  //   crop: "scale",
  // });

  // data.image = {
  //   public_id: newImage.public_id,
  //   url: newImage.secure_url,
  // };
  //   }

  const postUpdate = await Post.findByIdAndUpdate(req.params.id, data, {
    new: true,
  });

  if (postUpdate) {
    res.status(200).json({
      success: true,
      postUpdate,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

//delete post
exports.deletePost = expressAsyncHandler(async (req, res, next) => {
  const currentPost = await Post.findById(req.params.id);

  //delete post image in cloudinary
  //   const ImgId = currentPost.image.public_id;
  //   if (ImgId) {
  //     await cloudinary.uploader.destroy(ImgId);
  //   }

  const isDeleted = await Post.findByIdAndDelete(req.params.id);
  if (isDeleted) {
    res.status(200).json({
      success: true,
      message: "post deleted",
      data: isDeleted,
    });
  } else {
    res.status(400);
    throw new Error("Post not found");
  }
});

// Get all posts
exports.allPosts = expressAsyncHandler(async (req, res) => {
  res.send("All posts");
});

// Get post by user id (My posts)
exports.myPosts = expressAsyncHandler(async (req, res) => {
  res.send("My posts");
});

//add comment
exports.addComment = async (req, res, next) => {
  const { comment } = req.body;
  const postComment = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: { comments: { text: comment, postedBy: req.user._id } },
    },
    { new: true }
  );
  const post = await Post.findById(postComment._id).populate(
    "comments.postedBy",
    "name email"
  );
  if (post) {
    res.status(200).json({
      success: true,
      post,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
};

//add like
exports.addLike = async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { likes: req.user._id },
    },
    { new: true }
  );
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("postedBy", "name");
  //   main.io.emit("add-like", posts);

  if (post && posts) {
    res.status(200).json({
      success: true,
      post,
      posts,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
};

//remove like
exports.removeLike = async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { likes: req.user._id },
    },
    { new: true }
  );

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("postedBy", "name");
  //   main.io.emit("remove-like", posts);

  if (post && posts) {
    res.status(200).json({
      success: true,
      post,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
};

//add comment
exports.addComment = async (req, res, next) => {
  const { comment } = req.body;
  const postComment = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: { comments: { text: comment, postedBy: req.user._id } },
    },
    { new: true }
  );
  const post = await Post.findById(postComment._id).populate(
    "comments.postedBy",
    "name email"
  );

  if (post) {
    res.status(200).json({
      success: true,
      post,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
};

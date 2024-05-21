const cloudinary = require("../utils/cloudinary");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const Multer = require("multer");

const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});

// Create post
exports.createPost = expressAsyncHandler(async (req, res, next) => {
  const { title, description, businessType } = req.body;

  // upload image in cloudinary
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const result = await cloudinary.handleUpload(dataURI);

  if (!result) {
    res.status(400);
    throw new Error("Unable to save image to cloudinary");
  }
  const post = await Post.create({
    title,
    description,
    businessType,
    postedBy: req.user._id,
    coverPhoto: {
      public_id: result.public_id,
      url: result.secure_url,
    },
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

// Get my posts
exports.myPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find({ postedBy: req.user.id }).sort("-createdAt");
  // console.log(posts);
  res.status(200).json(posts);
});

// Get all posts
exports.allPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find({}).sort("-createdAt");
  // console.log(posts);
  res.status(200).json(posts);
});

// Get post by id
exports.getPost = expressAsyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "comments.postedBy",
    "name"
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
});

// Get post info by id
exports.getPostInfo = expressAsyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "postedBy",
    "name city phone email"
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

//add comment
exports.addComment = async (req, res, next) => {
  const { comment } = req.body;
  // console.log(req.body);
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

// // Get post by user id (My posts)
exports.bookAppointment = expressAsyncHandler(async (req, res) => {
  const { phone, address, appointmnetDate } = req.body;
  const newDate = new Date(appointmnetDate);

  console.log(req.body);
  console.log(newDate);
  const bookedAppointment = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        appointments: {
          bookedBy: req.user._id,
          phone: phone,
          // appointmentDate: newDate,
          address: address,
        },
      },
    },
    { new: true }
  );

  if (bookedAppointment) {
    res.status(200).json({
      success: true,
      bookedAppointment,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
});

exports.placeOrder = expressAsyncHandler(async (req, res) => {
  const { phone, address, quantity, ownerName, ownerEmail, ownerPhone } =
    req.body;
  const ordered = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        orders: {
          orderedBy: req.user._id,
          phone,
          address,
          quantity: parseInt(quantity),
        },
      },
    },
    { new: true }
  );
  // Sending Email after placing order
  const message1 = `
      <h2>Hello, ${req.user.name}</h2>
      <p>Please your order request has been sent to ${ownerName}, the owner of the brand.</p>  
      <p>Visit ArtiKon official website for more info.</p>
      <p>You can also call ${ownerName} on ${ownerPhone} for follow-ups.</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>"https://artikon-alx-2qcy.onrender.com"</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const message2 = `
      <h2>Hello, ${ownerName}</h2>
      <p>Please your have received new order(s) from ${req.user.name}.</p>  
      <p>Visit ArtiKon official website for more info.</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>"https://artikon-alx-2qcy.onrender.com"</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject1 = "Placement Of Order(s)";
  const subject2 = "New Order(s)";
  const send_to1 = req.user.email;
  const send_to2 = ownerEmail;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject1, message1, send_to1, sent_from);
    await sendEmail(subject2, message2, send_to2, sent_from);
    res.status(200).json({ success: true, ordered });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

/**
 * Find posts created by the user
 * And extract all appointments from the found posts
 *
 * @param {*} req
 * @param {*} res
 */
exports.getUserReceivedAppointments = async (req, res) => {
  // Find posts created by the user
  const posts = await Post.find({ postedBy: req.user._id }, "appointments")
    .populate("appointments.bookedBy", "name")
    .select("appointments title");
  // .select("appointments");

  // Extract all appointments from the found posts
  const appointments = posts.flatMap((post) =>
    post.appointments.map((appointment) => ({
      ...appointment.toObject(), // Convert Mongoose document to plain object
      postTitle: post.title,
    }))
  );

  if (posts && appointments) {
    res.status(200).json({
      success: true,
      appointments,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
};

/**
 * Find posts created by the user
 * And extract all oders from the found posts
 *
 * @param {*} req
 * @param {*} res
 */
exports.getUserReceivedOrders = async (req, res) => {
  // Find posts created by the user
  const posts = await Post.find({ postedBy: req.user._id }, "orders")
    .populate("orders.orderedBy", "name")
    .select("orders title");
  // .select("appointments");

  // Extract all appointments from the found posts
  const orders = posts.flatMap((post) =>
    post.orders.map((order) => ({
      ...order.toObject(), // Convert Mongoose document to plain object
      postTitle: post.title,
    }))
  );

  if (posts && orders) {
    res.status(200).json({
      success: true,
      orders,
    });
  } else {
    res.status(400);
    throw new Error("Error");
  }
};

const cloudinary = require("../utils/cloudinary");
const expressAsyncHandler = require("express-async-handler");
const Post = require("../models/postModel");
const sendEmail = require("../utils/sendEmail");

/**
 * Add new post
 */
exports.createPost = expressAsyncHandler(async (req, res, next) => {
  const { title, description, businessType, price, category } = req.body;
  console.log(req.body);

  if (
    !title ||
    !description ||
    !businessType ||
    !price ||
    !category ||
    !req.file
  ) {
    res.status(400);
    throw new Error("All fields are required");
  }

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
    price,
    category,
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

/**
 * Get my posts
 */
exports.myPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find({ postedBy: req.user.id }).sort("-createdAt");
  // console.log(posts);
  res.status(200).json(posts);
});

/**
 * Get all posts
 */
exports.allPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find({ isActive: true })
    .populate("postedBy", "name email photo")
    .sort("-createdAt");
  // console.log(posts);
  if (posts) {
    res.status(200).json({ success: true, posts });
  } else {
    res.status(500);
    throw new Error("Mongodb error");
  }
});

/**
 * Get all posts
 */
exports.getPosts = expressAsyncHandler(async (req, res) => {
  const posts = await Post.find({})
    .populate("postedBy", "name email photo")
    .sort("-createdAt");

  if (posts) {
    res.status(200).json({ success: true, posts });
  } else {
    res.status(500);
    throw new Error("Mongodb error");
  }
});

/**
 * Get post by id
 */
exports.getPost = expressAsyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "comments.postedBy",
    "name photo"
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

/**
 * Get post info by id
 */
exports.getPostInfo = expressAsyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("postedBy", "name city phone email brand")
    .populate("category", "category");
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

/**
 * Update post
 */
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

/**
 * delete post
 */
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

/**
 * add comment
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
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

/**
 * add like
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
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

/**
 * remove like
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
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

/**
 * Get post by user id (My posts)
 */
exports.bookAppointment = expressAsyncHandler(async (req, res) => {
  const { phone, address, appointmnetDate, ownerName, ownerEmail } = req.body;
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

  const message = `
      <h2>Hello, ${ownerName}</h2>
      <p>New Appointment has been booked by ${req.user.name}.</p>  
      <p>Visit ArtiKon official website for more info.</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>"https://artikon-alx-2qcy.onrender.com"</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "Booking Of Appointment";
  const send_to = ownerEmail;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
  // });
});

exports.placeOrder = expressAsyncHandler(async (req, res) => {
  const { phone, address, quantity, ownerName, ownerEmail } = req.body;
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
  const message = `
      <h2>Hello, ${ownerName}</h2>
      <p>Please your have received new order(s) from ${req.user.name}.</p>  
      <p>Visit ArtiKon official website for more info.</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>"https://artikon-alx-2qcy.onrender.com"</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "New Order(s)";
  const send_to = ownerEmail;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
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
    .select("title");
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

/**
 * Find orders created by the user
 * And extract all oders from the found posts
 *
 * @param {*} req
 * @param {*} res
 */
exports.getUserPlacedOrders = async (req, res) => {
  const posts = await Post.find(
    { "orders.orderedBy": req.user._id },
    { "orders.$": 1 } // Projection to include only matched orders
  )
    .select("postedBy title _id")
    .populate("postedBy", "name email phone")
    .sort("-createdAt")
    .exec();

  // Extract the matched orders
  const orders = posts.flatMap((post) =>
    post.orders.map((order) => ({
      ...order.toObject(), // Convert Mongoose document to plain object
      postTitle: post.title,
      postId: post._id,
      postedBy: post.postedBy,
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

/**
 *
 * @param {*} req
 * @param {*} res
 */
exports.getUserBookedAppointments = async (req, res) => {
  const posts = await Post.find(
    { "appointments.bookedBy": req.user._id },
    { "appointments.$": 1 } // Projection to include only matched orders
  )
    .select("postedBy title _id")
    .populate("postedBy", "name email phone")
    .populate("appointments.bookedBy", "name email phone")
    .sort("-createdAt")
    .exec();

  // Extract the matched orders
  const appointments = posts.flatMap((post) =>
    post.appointments.map((appointment) => ({
      ...appointment.toObject(), // Convert Mongoose document to plain object
      postTitle: post.title,
      postId: post._id,
      postedBy: post.postedBy,
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
 * block post
 */
exports.blockPost = expressAsyncHandler(async (req, res) => {
  const { postTitle, ownerName, ownerEmail } = req.body;
  let { id } = req.params;
  const result = await Post.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  // Send Email
  const message = `
      <h2>Hello, ${ownerName}</h2>
      <p>Please your post with the title \"${postTitle}\" & Ref \"${id}\" has been blocked</p>  
      <p>If you think this is wrong, please file a report to the system administrators via the website</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>Click here to place a report</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "Post Blocked";
  const send_to = ownerEmail;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

/**
 * Unblock post
 */
exports.unblockPost = expressAsyncHandler(async (req, res) => {
  const { postTitle, ownerName, ownerEmail } = req.body;
  let { id } = req.params;
  const result = await Post.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  // Send Email
  const message = `
      <h2>Hello, ${ownerName}</h2>
      <p>Please your post with the title \"${postTitle}\" & Ref \"${id}\" has been unblocked</p>  
      <p>For more info, visit ArtiKon official website</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>Click here to visit the site</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "Post Unblocked";
  const send_to = ownerEmail;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

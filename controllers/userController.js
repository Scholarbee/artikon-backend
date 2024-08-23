const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("../utils/cloudinary");

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Sign Up
exports.addtUser = asyncHandler(async (req, res) => {
  const { name, email, city, phone, password } = req.body;

  if (!name || !email || !password || !city || !phone) {
    res.status(400);
    throw new Error("Please all fields are required.");
  }

  const userExist = await User.findOne({ email: email });
  if (userExist) {
    res.status(400);
    throw new Error("Please email has been used. Choose another.");
  }

  // upload image in cloudinary
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const result = await cloudinary.handleUpload(dataURI);

  if (!result) {
    res.status(400);
    throw new Error("Unable to save image to cloudinary");
  }

  const user = await User.create({
    name,
    email,
    city,
    // brand,
    phone,
    password,
    photo: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });

  //   Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("artikonToken", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, brand, city, phone, photo, role } = user;
    res.status(201).json({
      _id,
      name,
      email,
      city,
      brand,
      phone,
      role,
      photo: photo.url,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Get user info
exports.getUser = asyncHandler(async (req, res) => {
  // let { id } = req.params;
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, dob, gender, city, phone, bio, userType, email, photo } =
      user;
    res.status(201).json({
      _id,
      name,
      dob,
      gender,
      phone,
      city,
      bio,
      userType,
      email,
      photo,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Get all users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.status(200).json({ success: true, users });
});

// Edit user
exports.edittUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, dob, gender, phone, bio, userType, email, photo } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.gender = req.body.gender || gender;
    user.dob = req.body.dob || dob;
    user.userType = req.body.userType || userType;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      gender: updatedUser.gender,
      dob: updatedUser.dob,
      userType: updatedUser.userType,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Delete user
exports.deltUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  const result = await User.findByIdAndDelete(id);
  if (result) {
    res.status(200).json({ success: true, result });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  // Email auth
  const user = await User.findOne({ email: email });
  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  // Password auth
  const verified = await bcrypt.compare(password, user.password);
  if (!verified) {
    res.status(400);
    throw new Error("Wrong Email or Password.");
  }

  //   Generate Token
  const token = generateToken(user._id);

  if (verified) {
    // Send HTTP-only cookie
    res.cookie("artikonToken", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });
  }
  if (user && verified) {
    const { _id, name, email, brand, photo, city, phone, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      city,
      brand,
      phone,
      role,
      photo: photo.url,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Logout User
exports.logout = asyncHandler(async (req, res) => {
  res.cookie("artikonToken", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get Login Status
exports.loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.artikonToken;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

// Forgot password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reste Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/#/reset-password/${resetToken}`;

  // Reset Email
  const message = `
      <h2>Hello, ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>

      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  console.log(password);
  console.log(resetToken);
  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  console.log(userToken);
  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

// Block user
exports.blockUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  // Reset Email
  const message = `
      <h2>Hello, ${user.name}</h2>
      <p>Please your account has been suspended</p>  
      <p>If you think this is wrong, please file \n a report to the system administrators via the website</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>Click here to place a report</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "Suspention Of Account";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Unblock user
exports.unblockUser = asyncHandler(async (req, res) => {
  let { id } = req.params;
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );
  // Reset Email
  const message = `
      <h2>Hello, ${user.name}</h2>
      <p>Please your account has been reactivated</p>  
      <p>Visit the official website for more info.</p>

      <a href="https://artikon-alx-2qcy.onrender.com" clicktracking=off>Click here to place a report</a>

      <p>Regards...</p>
      <p>Artikon Team</p>
    `;
  const subject = "Suspention Of Account";
  const send_to = user.email;
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
 * Register as an agent
 */
exports.registerAgent = asyncHandler(async (req, res) => {
  const { brandName, brandLocation, brandContact } = req.body;

  if (!brandName || !brandLocation || !brandContact) {
    res.status(400);
    throw new Error("All fields are required.");
  }

  const brandExist = await User.findOne({ "brand.brandName": brandName });
  if (brandExist) {
    res.status(400);
    throw new Error(
      "Brand name has been registered already. Please choose another."
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      brand: { brandName, brandLocation, brandContact },
      role: "agent",
    },
    { new: true }
  );

  if (user) {
    res.status(200).json({ success: true, user });
  } else {
    res.status(500);
    throw new Error("Internal server error");
  }
});

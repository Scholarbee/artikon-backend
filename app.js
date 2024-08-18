const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleWare/errorMiddleware");
require("dotenv").config();
// const path = require("path");
// const bodyParser = require("body-parser");
const port = process.env.PORT || 2001;

// Initiating app...
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Setting up routes
app.get("/", (req, res) => {
  res.send("Server started successfully...");
});

const userRouter = require("./routes/userRoutes");
const postRouter = require("./routes/postRoutes");
const contactRouter = require("./routes/contactRoute");
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/contact", contactRouter);

// Error display format
app.use(errorHandler);
// Setting up databse and starting the API server
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to mongoDB");
  app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
  });
});

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

dotenv.config({ path: "./config.env" });
const { dbConnection } = require("./config/connect");
const globalerrorHandler = require("./middlewares/globalErrorMiddleware");

//routes
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");
const connectionRoute = require("./routes/connectionRoute");
const notificationRoute = require("./routes/notificationRoute");

//express app
const app = express();

//database connect
dbConnection();

//middlewares
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));

// Dynamically handle CORS for both Docker and local development
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//mount routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute);
app.use("/api/v1/connections", connectionRoute);
app.use("/api/v1/notifications", notificationRoute);

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, "client/dist")));

// Catch-all route for frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

//global error handler
app.use(globalerrorHandler);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// rejection outside express server
process.on("unhandledRejection", (err) => {
  console.log("unhandledRejection", err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

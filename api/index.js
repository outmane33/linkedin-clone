const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
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

// const __dirname = path.resolve();

//express aapp
const app = express();

//database connect
dbConnection();

//middlewares
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//mout routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute);
app.use("/api/v1/connections", connectionRoute);
app.use("/api/v1/notifications", notificationRoute);

app.use(express.static(path.join(__dirname, "client/dist")));
// app.use(express.static(path.join(__dirname, "uploads")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});
//global error handler
app.use(globalerrorHandler);

const server = app.listen(8000, () => {
  console.log("Server started on port 8000");
});

// rejection outside express server
process.on("unhandledRejection", (err) => {
  console.log("unhandledRejection", err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

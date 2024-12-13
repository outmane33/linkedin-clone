const express = require("express");
const { signUp, signIn, signOut } = require("../services/authServcie");
const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/signout", signOut);

module.exports = router;

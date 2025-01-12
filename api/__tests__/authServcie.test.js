const { sendWelcomeEmail } = require("../emails/emailHandlers");
const User = require("../models/userModel");
const { signUp, signIn, signOut, protect } = require("../services/authServcie");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../models/userModel");
jest.mock("../utils/generateToken");
jest.mock("bcryptjs");
jest.mock("../emails/emailHandlers");
jest.mock("jsonwebtoken");

describe("signUp", () => {
  it("should create a new user, generate a token, set a cookie, and send a welcome email", async () => {
    const req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        username: "johndoe",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    const mockUser = {
      _id: "mockUserId",
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      username: "johndoe",
    };
    User.create.mockResolvedValue(mockUser);

    const mockToken = "mockToken";
    generateToken.mockReturnValue(mockToken);

    sendWelcomeEmail.mockResolvedValue(true);

    await signUp(req, res, next);

    expect(User.create).toHaveBeenCalledWith({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
    });
    expect(generateToken).toHaveBeenCalledWith(mockUser);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      "access_token",
      mockToken,
      expect.any(Object)
    );
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      user: mockUser,
    });
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.name,
      `${process.env.FRONTEND_URL}/profile/${mockUser.username}`
    );
  });
  it("should handle errors if sendWelcomeEmail fails", async () => {
    const req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        username: "johndoe",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    const mockUser = {
      _id: "mockUserId",
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      username: "johndoe",
    };
    User.create.mockResolvedValue(mockUser);

    const mockToken = "mockToken";
    generateToken.mockReturnValue(mockToken);

    sendWelcomeEmail.mockRejectedValue(new Error("Welcome email failed"));

    await signUp(req, res, next);

    expect(User.create).toHaveBeenCalledWith({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
    });
    expect(generateToken).toHaveBeenCalledWith(mockUser);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      "access_token",
      mockToken,
      expect.any(Object)
    );
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      user: mockUser,
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("signIn", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        username: "johndoe",
        password: "password123",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should sign in the user with valid credentials and return a token", async () => {
    const mockUser = {
      _id: "mockUserId",
      username: "johndoe",
      password: "hashedPassword123",
    };
    const mockToken = "mockToken";

    // Mocking User.findOne to return a valid user
    User.findOne.mockResolvedValue(mockUser);

    // Mock bcrypt.compare to return true (password matches)
    bcrypt.compare.mockResolvedValue(true);

    // Mock generateToken
    generateToken.mockReturnValue(mockToken);

    // Call signIn
    await signIn(req, res, next);

    // Assertions
    expect(User.findOne).toHaveBeenCalledWith({ username: req.body.username });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      req.body.password,
      mockUser.password
    );
    expect(generateToken).toHaveBeenCalledWith(mockUser);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith(
      "access_token",
      mockToken,
      expect.objectContaining({
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: "strict",
      })
    );
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      user: mockUser,
    });
  });

  test("should return 401 if username or password is incorrect", async () => {
    const mockUser = {
      _id: "mockUserId",
      username: "johndoe",
      password: "hashedPassword123",
    };

    User.findOne.mockResolvedValue(mockUser);

    bcrypt.compare.mockResolvedValue(false);

    await signIn(req, res, next);

    console.log(next);
    expect(next).toHaveBeenCalled();
  });

  test("should return 401 if user is not found", async () => {
    // Mock User.findOne to return null (user not found)
    User.findOne.mockResolvedValue(null);

    // Call signIn
    await signIn(req, res, next);

    // Assertions
    expect(next).toHaveBeenCalled();
  });
});

describe("signOut", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should clear the access_token cookie and send a success response", async () => {
    await signOut(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.clearCookie).toHaveBeenCalledWith("access_token");
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
    });
  });

  test("should not call next since no error is expected", async () => {
    await signOut(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});

describe("protect middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {
        access_token: "mockToken",
      },
    };
    res = {};
    next = jest.fn().mockReturnThis();
  });

  it("should return an error if no token is provided", async () => {
    req.cookies.access_token = null;

    await protect(req, res, next);

    console.log(next.mock.calls[0][0]); // Add this line to see the error object

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    console.log(next.mock.calls[0][0]);
    expect(next.mock.calls[0][0].message).toBe("You are not logged in");
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("should return an error if token verification fails", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "mockToken",
      process.env.JWT_SECRET
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error)); // Expect any standard Error
    expect(next.mock.calls[0][0].message).toBe("Invalid token");
  });

  it("should return an error if the user does not exist", async () => {
    jwt.verify.mockReturnValue({ id: "mockUserId" });
    User.findById.mockResolvedValue(null);

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith("mockUserId");
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].message).toBe("User not found");
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it("should add the user to req and call next on success", async () => {
    const mockUser = {
      id: "mockUserId",
      email: "test@example.com",
      fullName: "John Doe",
    };
    jwt.verify.mockReturnValue({ id: "mockUserId" });
    User.findById.mockResolvedValue(mockUser);

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "mockToken",
      process.env.JWT_SECRET
    );
    expect(User.findById).toHaveBeenCalledWith("mockUserId");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
  });
});

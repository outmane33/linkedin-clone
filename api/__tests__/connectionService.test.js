const { sendConnectionAcceptedEmail } = require("../emails/emailHandlers");
const ConnectionRequest = require("../models/connectionRequestModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const {
  sendConnectionRequest,
  acceptConnectionRequest,
} = require("../services/connectionService");
const ApiError = require("../utils/apiError");

jest.mock("../models/connectionRequestModel");
jest.mock("../models/userModel");
jest.mock("../models/notificationModel");
jest.mock("../emails/emailHandlers");
describe("sendConnectionRequest", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { userId: "someUserId" },
      user: { _id: "senderUserId", connections: [] },
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it("should return 400 if the sender tries to send a request to themselves", async () => {
    req.params.userId = "senderUserId";
    await sendConnectionRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can't send a request to yourself",
    });
  });

  it("should return 400 if the sender is already connected with the recipient", async () => {
    req.user.connections = ["someUserId"];
    await sendConnectionRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are already connected",
    });
  });

  it("should return 400 if there is already a pending connection request", async () => {
    ConnectionRequest.findOne.mockResolvedValue({
      sender: "senderUserId",
      recipient: "someUserId",
      status: "pending",
    });
    await sendConnectionRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "A connection request already exists",
    });
  });

  it("should send a connection request successfully if all checks pass", async () => {
    req.user.connections = ["anotherUserId"];
    ConnectionRequest.findOne.mockResolvedValue(null); // No existing request
    const newRequest = { save: jest.fn().mockResolvedValue("saved") };
    ConnectionRequest.mockReturnValue(newRequest);

    await sendConnectionRequest(req, res, next);

    expect(ConnectionRequest.findOne).toHaveBeenCalledWith({
      sender: req.user._id,
      recipient: req.params.userId,
      status: "pending",
    });
    expect(newRequest.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Connection request sent successfully",
    });
  });
});

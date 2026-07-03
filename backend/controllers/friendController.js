const { prisma } = require("../lib/prisma.js");

const RELATION_STATUS = {
  NONE: "NONE",
  FRIENDS: "FRIENDS",
  REQUEST_SENT: "REQUEST_SENT",
  REQUEST_RECEIVED: "REQUEST_RECEIVED",
  REJECTED: "REJECTED",
};

function buildRelationStatus(userId, request) {
  if (!request) return { relation: RELATION_STATUS.NONE };

  if (request.status === "ACCEPTED") {
    return { relation: RELATION_STATUS.FRIENDS, requestId: request.id };
  }

  if (request.status === "PENDING") {
    if (request.requesterId === userId) {
      return { relation: RELATION_STATUS.REQUEST_SENT, requestId: request.id };
    }
    return { relation: RELATION_STATUS.REQUEST_RECEIVED, requestId: request.id };
  }

  return { relation: RELATION_STATUS.NONE, requestId: request.id };
}

async function searchUsers(req, res) {
  const currentUserId = Number(req.user.userId);
  const query = String(req.query.query || "").trim();

  if (!query) {
    return res.json({ users: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
        NOT: {
          id: currentUserId,
        },
      },
      orderBy: {
        username: "asc",
      },
      select: {
        id: true,
        username: true,
      },
      take: 20,
    });

    const userIds = users.map((user) => user.id);

    const requests = userIds.length
      ? await prisma.friendRequest.findMany({
          where: {
            OR: [
              {
                requesterId: currentUserId,
                receiverId: { in: userIds },
              },
              {
                requesterId: { in: userIds },
                receiverId: currentUserId,
              },
            ],
          },
        })
      : [];

    const results = users.map((user) => {
      const request = requests.find(
        (r) => r.receiverId === user.id || r.requesterId === user.id
      );
      return {
        id: user.id,
        username: user.username,
        ...buildRelationStatus(currentUserId, request),
      };
    });

    res.json({ users: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error searching users" });
  }
}

async function getPendingRequests(req, res) {
  const currentUserId = Number(req.user.userId);

  try {
    const incoming = await prisma.friendRequest.findMany({
      where: {
        receiverId: currentUserId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: { id: true, username: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const outgoing = await prisma.friendRequest.findMany({
      where: {
        requesterId: currentUserId,
        status: "PENDING",
      },
      include: {
        receiver: {
          select: { id: true, username: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      incoming: incoming.map((request) => ({
        requestId: request.id,
        username: request.requester.username,
        userId: request.requester.id,
      })),
      outgoing: outgoing.map((request) => ({
        requestId: request.id,
        username: request.receiver.username,
        userId: request.receiver.id,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching pending requests" });
  }
}

async function sendFriendRequest(req, res) {
  const currentUserId = Number(req.user.userId);
  const receiverId = Number(req.body.receiverId);

  if (!receiverId || receiverId === currentUserId) {
    return res.status(400).json({ error: "Invalid receiverId" });
  }

  try {
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const sameDirection = await prisma.friendRequest.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: currentUserId,
          receiverId: receiverId,
        },
      },
    });

    if (sameDirection) {
      if (sameDirection.status === "PENDING") {
        return res.status(409).json({ error: "Friend request already sent" });
      }
      if (sameDirection.status === "ACCEPTED") {
        return res.status(409).json({ error: "You are already friends" });
      }
      const updatedRequest = await prisma.friendRequest.update({
        where: { id: sameDirection.id },
        data: { status: "PENDING" },
      });
      return res.json({ request: updatedRequest });
    }

    const reverseDirection = await prisma.friendRequest.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: receiverId,
          receiverId: currentUserId,
        },
      },
    });

    if (reverseDirection) {
      if (reverseDirection.status === "PENDING") {
        const acceptedRequest = await prisma.friendRequest.update({
          where: { id: reverseDirection.id },
          data: { status: "ACCEPTED" },
        });
        return res.json({ request: acceptedRequest, accepted: true });
      }
      if (reverseDirection.status === "ACCEPTED") {
        return res.status(409).json({ error: "You are already friends" });
      }
    }

    const request = await prisma.friendRequest.create({
      data: {
        requester: { connect: { id: currentUserId } },
        receiver: { connect: { id: receiverId } },
      },
    });

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error sending friend request" });
  }
}

async function acceptFriendRequest(req, res) {
  const currentUserId = Number(req.user.userId);
  const requestId = Number(req.params.requestId);

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.receiverId !== currentUserId) {
      return res.status(404).json({ error: "Friend request not found" });
    }
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Friend request is not pending" });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error accepting friend request" });
  }
}

async function rejectFriendRequest(req, res) {
  const currentUserId = Number(req.user.userId);
  const requestId = Number(req.params.requestId);

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.receiverId !== currentUserId) {
      return res.status(404).json({ error: "Friend request not found" });
    }
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Friend request is not pending" });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error rejecting friend request" });
  }
}

async function cancelFriendRequest(req, res) {
  const currentUserId = Number(req.user.userId);
  const requestId = Number(req.params.requestId);

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.requesterId !== currentUserId) {
      return res.status(404).json({ error: "Friend request not found" });
    }
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending requests can be cancelled" });
    }

    await prisma.friendRequest.delete({
      where: { id: requestId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cancelling friend request" });
  }
}

async function getFriends(req, res) {
  const currentUserId = Number(req.user.userId);

  try {
    const friends = await prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        requester: {
          select: { id: true, username: true },
        },
        receiver: {
          select: { id: true, username: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json({
      friends: friends.map((request) => {
        const friend = request.requesterId === currentUserId ? request.receiver : request.requester;
        return {
          requestId: request.id,
          id: friend.id,
          username: friend.username,
          connectedAt: request.updatedAt,
        };
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching friends" });
  }
}

async function removeFriend(req, res) {
  const currentUserId = Number(req.user.userId);
  const friendId = Number(req.params.friendId);

  try {
    const friendship = await prisma.friendRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            requesterId: currentUserId,
            receiverId: friendId,
          },
          {
            requesterId: friendId,
            receiverId: currentUserId,
          },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    await prisma.friendRequest.delete({
      where: { id: friendship.id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error removing friend" });
  }
}

module.exports = {
  searchUsers,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend,
};

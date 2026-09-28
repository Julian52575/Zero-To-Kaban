"use strict";

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function init() {
  await prisma.$connect();
  console.log("auth: connected to database via Prisma");
}

async function teardown() {
  await prisma.$disconnect();
}

function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

function findUserByUsername(username) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
}

class UsernameTakenError extends Error {
  constructor(username) {
    super(`username already taken: ${username}`);
    this.name = "UsernameTakenError";
  }
}

async function createUser(username, passwordHash) {
  const name = username.toLowerCase();
  try {
    return await prisma.user.create({ data: { username: name, passwordHash } });
  } catch (err) {
    if (err && err.code === "P2002") {
      throw new UsernameTakenError(name);
    }
    throw err;
  }
}

async function bumpTokenVersion(id) {
  const user = await prisma.user.update({
    where: { id },
    data: { tokenVersion: { increment: 1 } },
  });
  return user.tokenVersion;
}

async function deleteUser(id) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.user.deleteMany({ where: { id } });
    if (count === 0) {
      return false;
    }
    await tx.outboxEvent.create({
      data: {
        type: "user.deleted.v1",
        payload: { userId: id, occurredAt: new Date().toISOString() },
      },
    });
    return true;
  });
}

function findUsersByIds(ids) {
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, username: true },
  });
}

function listUsers({ q, limit, offset }) {
  return prisma.user.findMany({
    where: q ? { username: { startsWith: q.toLowerCase() } } : undefined,
    select: { id: true, username: true },
    orderBy: [{ username: "asc" }, { id: "asc" }],
    take: limit,
    skip: offset,
  });
}

module.exports = {
  prisma,
  init,
  teardown,
  findUserById,
  findUserByUsername,
  createUser,
  bumpTokenVersion,
  deleteUser,
  findUsersByIds,
  listUsers,
  UsernameTakenError,
};

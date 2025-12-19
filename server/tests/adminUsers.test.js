import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  process.env.NODE_ENV = "test";

  // import after env vars set so server connects to in-memory mongo
  const serverModule = await import("../server.js");
  app = serverModule.app;

  // connect mongoose (server.js already called connectDB during import)
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("GET /api/admin/users returns users for admin", async () => {
  const { Admin } = await import("../Models/AdminModel.js");
  const { Citizen } = await import("../Models/CitizenModel.js");

  // create admin + citizens
  const admin = await Admin.create({
    name: "Admin One",
    email: "admin@example.com",
    password: "x",
  });
  await Citizen.create({ name: "User One", email: "u1@example.com" });
  await Citizen.create({ name: "User Two", email: "u2@example.com" });

  const token = jwt.sign(
    {
      _id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .get("/api/admin/users")
    .set("Cookie", [`token=${token}`])
    .expect("Content-Type", /json/)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.users)).toBe(true);
  expect(res.body.totals.totalUsers).toBe(2);
});

test("GET /api/admin/users?role=admin returns admins only", async () => {
  const { Admin } = await import("../Models/AdminModel.js");
  const { Citizen } = await import("../Models/CitizenModel.js");

  // create an admin and citizen
  const admin = await Admin.create({
    name: "Query Admin",
    email: "qadmin@example.com",
    password: "x",
  });
  await Citizen.create({ name: "Other", email: "other@example.com" });

  const token = jwt.sign(
    {
      _id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .get("/api/admin/users")
    .query({ role: "admin" })
    .set("Cookie", [`token=${token}`])
    .expect("Content-Type", /json/)
    .expect(200);

  expect(res.body.success).toBe(true);
  // should return at least the admin we created
  expect(res.body.users.some((u) => u.email === admin.email)).toBe(true);
  expect(res.body.totals.totalUsers).toBeGreaterThanOrEqual(1);
});

test("POST /api/admin/users/:id/status toggles status and adds audit log", async () => {
  const { Admin } = await import("../Models/AdminModel.js");
  const { Citizen } = await import("../Models/CitizenModel.js");
  const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");

  const admin = await Admin.create({
    name: "Admin Two",
    email: "admin2@example.com",
    password: "x",
  });
  const citizen = await Citizen.create({
    name: "Toggle User",
    email: "toggle@example.com",
  });

  const token = jwt.sign(
    {
      _id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET
  );

  // disable user
  const serverModule = await import("../server.js");
  const io = serverModule.io;
  // spy on emit
  io.emit = jest.fn();

  const res = await request(app)
    .post(`/api/admin/users/${citizen._id}/status`)
    .set("Cookie", [`token=${token}`])
    .send({ status: "Inactive" })
    .expect("Content-Type", /json/)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.user).toHaveProperty("isActive", false);

  // socket emission check
  expect(io.emit).toHaveBeenCalledWith(
    "user:status_updated",
    expect.objectContaining({ id: String(citizen._id), status: "Inactive" })
  );

  // check audit log exists
  const logs = await LogsAndAudit.find({ message: /disabled/ }).lean();
  expect(logs.length).toBeGreaterThanOrEqual(1);
});

test("GET /api/admin/users/:id/history returns activity entries for user", async () => {
  const { Admin } = await import("../Models/AdminModel.js");
  const { Citizen } = await import("../Models/CitizenModel.js");
  const { ActivityHistory } = await import("../Models/ActivityHistory.js");

  const admin = await Admin.create({
    name: "Admin Three",
    email: "admin3@example.com",
    password: "x",
  });
  const citizen = await Citizen.create({
    name: "Hist User",
    email: "hist@example.com",
  });

  // create some activity history (performed by Admin)
  await ActivityHistory.create({
    userId: citizen._id,
    action: "test_action",
    details: "Test entry 1",
    performedBy: admin._id,
    performedByModel: "Admin",
  });
  await ActivityHistory.create({
    userId: citizen._id,
    action: "test_action2",
    details: "Test entry 2",
    performedBy: admin._id,
    performedByModel: "Admin",
  });

  const token = jwt.sign(
    {
      _id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .get(`/api/admin/users/${citizen._id}/history`)
    .set("Cookie", [`token=${token}`])
    .expect("Content-Type", /json/)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.activities)).toBe(true);
  expect(res.body.activities.length).toBeGreaterThanOrEqual(2);
  // performedBy should be populated (admin)
  const populated = res.body.activities.some(
    (a) =>
      a.performedBy &&
      (a.performedBy.email === admin.email || a.performedBy.name === admin.name)
  );
  expect(populated).toBe(true);
});

test("GET /api/admin/users handles special-character search without error", async () => {
  const { Admin } = await import("../Models/AdminModel.js");
  const { Citizen } = await import("../Models/CitizenModel.js");

  const admin = await Admin.create({
    name: "Search Admin",
    email: "sadmin@example.com",
    password: "x",
  });
  const special = await Citizen.create({
    name: "Special (test) User",
    email: "special@example.com",
  });

  const token = jwt.sign(
    {
      _id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .get("/api/admin/users")
    .query({ search: "(test)" })
    .set("Cookie", [`token=${token}`])
    .expect("Content-Type", /json/)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.users)).toBe(true);
  // find our special user
  expect(res.body.users.some((u) => u.email === special.email)).toBe(true);
});

test("GET /api/admin/users handles single-char search without error", async () => {
  const { Admin } = await import("../Models/AdminModel.js");
  const { Citizen } = await import("../Models/CitizenModel.js");

  const admin = await Admin.create({
    name: "Search Admin 2",
    email: "sadmin2@example.com",
    password: "x",
  });
  const small = await Citizen.create({
    name: "Nancy",
    email: "nancy@example.com",
  });

  const token = jwt.sign(
    {
      _id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .get("/api/admin/users")
    .query({ search: "N" })
    .set("Cookie", [`token=${token}`])
    .expect("Content-Type", /json/)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.users)).toBe(true);
  expect(res.body.users.some((u) => u.email === small.email)).toBe(true);
});

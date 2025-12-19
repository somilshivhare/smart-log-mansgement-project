import { Citizen } from "../Models/CitizenModel.js";
import { Admin } from "../Models/AdminModel.js";
import { ActivityHistory } from "../Models/ActivityHistory.js";

// GET /api/admin/users
export const getUsers = async (req, res) => {
  // escape regex for free-form search inputs to avoid invalid regex errors
  const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;
    const { search, role, status } = req.query;

    // If role=admin -> query Admin collection
    if (role && role.toLowerCase() === "admin") {
      const adminMatch = {};
      if (search) {
        const r = new RegExp(escapeRegExp(search), "i");
        adminMatch.$or = [{ name: r }, { email: r }];
        // only include _id match when the search looks like a valid ObjectId
        if (/^[a-fA-F0-9]{24}$/.test(search)) {
          adminMatch.$or.push({ _id: search });
        }
      }

      const [admins, adminCount] = await Promise.all([
        Admin.find(adminMatch)
          .select("name email role createdAt")
          .skip(skip)
          .limit(limit)
          .lean(),
        Admin.countDocuments(adminMatch),
      ]);

      const users = admins.map((a) => ({
        id: String(a._id),
        name: a.name,
        email: a.email,
        role: "Admin",
        status: "Active",
        lastActivity: a.createdAt,
      }));

      users.sort(
        (a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
      );

      const totalUsers = adminCount;
      const payload = {
        success: true,
        users,
        totals: {
          totalUsers,
          activeUsers: totalUsers,
          inactiveUsers: 0,
          adminCount: totalUsers,
        },
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
      };

      return res.status(200).json(payload);
    }

    // default: citizens
    const citizenMatch = {};
    if (status && status !== "all") {
      citizenMatch.isActive = status === "active";
    }
    if (search) {
      const r = new RegExp(escapeRegExp(search), "i");
      citizenMatch.$or = [{ name: r }, { email: r }];
      // only include _id match when the search looks like a valid ObjectId
      if (/^[a-fA-F0-9]{24}$/.test(search)) {
        citizenMatch.$or.push({ _id: search });
      }
    }

    const [citizens, citizenCount] = await Promise.all([
      Citizen.find(citizenMatch)
        .select("name email isActive lastLoginAt createdAt")
        .skip(skip)
        .limit(limit)
        .lean(),
      Citizen.countDocuments(citizenMatch),
    ]);

    // debug logging to help diagnose missing users
    console.log(
      "[AdminUserController.getUsers] admin:",
      req.user?._id,
      "params:",
      { search, role, status, page, limit }
    );
    console.log(
      "[AdminUserController.getUsers] citizenCount:",
      citizenCount,
      "returned (page):",
      citizens.length
    );

    // Format citizens only (admins are not merged into the user listing)
    const users = citizens.map((c) => ({
      id: String(c._id),
      name: c.name,
      email: c.email,
      role: "Citizen",
      status: c.isActive ? "Active" : "Inactive",
      lastActivity: c.lastLoginAt || c.createdAt,
    }));

    // sort by lastActivity desc
    users.sort(
      (a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
    );

    // Totals (citizens only) + admin count for display
    const totalUsers = citizenCount;
    const activeUsers = await Citizen.countDocuments({ isActive: true });
    const inactiveUsers = citizenCount - activeUsers;
    const adminCount = await Admin.countDocuments();

    const payload = {
      success: true,
      users,
      totals: { totalUsers, activeUsers, inactiveUsers, adminCount },
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    };

    // include debug details in non-production to help tracing
    if (process.env.NODE_ENV !== "production") {
      payload.debug = {
        citizenCount,
        returnedCitizens: citizens.length,
        query: citizenMatch,
      };
    }

    res.status(200).json(payload);
  } catch (err) {
    console.error(err);
    const payload = { success: false, message: "Failed to fetch users" };
    if (process.env.NODE_ENV !== "production")
      payload.error = err?.message || String(err);
    res.status(500).json(payload);
  }
};

// POST /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; // 'Active' or 'Inactive'
    if (!id || !status)
      return res
        .status(400)
        .json({ success: false, message: "User id and status required" });
    const isActive = status === "Active";
    const user = await Citizen.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });

    user.isActive = isActive;
    await user.save();

    // log activity
    await ActivityHistory.create({
      userId: user._id,
      action: isActive ? "enable" : "disable",
      details: `Account ${isActive ? "enabled" : "disabled"} by admin`,
      performedBy: req.user?._id,
      performedByModel: "Admin",
    });

    // audit log: write to LogsAndAudit
    try {
      const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
      await LogsAndAudit.log({
        level: "INFO",
        module: "User Management",
        message: `User ${user._id} ${
          isActive ? "enabled" : "disabled"
        } by admin ${req.user?.email || req.user?.name || req.user?._id}`,
        userId: user._id,
        username: req.user?.email || req.user?.name,
      });
    } catch (err) {
      console.warn(
        "Failed to write user status audit log",
        err?.message || err
      );
    }

    // emit socket if available
    try {
      const io = req.app.get("io");
      if (io) io.emit("user:status_updated", { id: String(user._id), status });
    } catch (err) {
      console.warn("Socket emit failed", err?.message || err);
    }

    res.status(200).json({
      success: true,
      message: "User status updated",
      user: { id: String(user._id), isActive },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update user status" });
  }
};

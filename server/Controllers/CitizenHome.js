// Update citizen profile
export const updateCitizenProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { name, email, phone, address, dateOfBirth } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phoneNumber = phone;
    if (address !== undefined) updateFields.address = address;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;

    const citizen = await Citizen.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true, context: "query" }
    ).select("-password");
    if (!citizen) {
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });
    }
    res.status(200).json({
      success: true,
      citizen,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
import { Citizen } from "../Models/CitizenModel.js";
import bcrypt from "bcrypt";

export const getCitizen = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Citizen Home Accessed Successfully",
      user: req.user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getCitizenProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const citizen = await Citizen.findById(userId).select("-password");
    if (!citizen) {
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });
    }
    res.status(200).json({ success: true, citizen });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/user/account/password
export const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { current, newPassword } = req.body;
    if (!current || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Current and new password required" });

    const citizen = await Citizen.findById(userId);
    if (!citizen) {
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });
    }
    const ok = await bcrypt.compare(current, citizen.password);
    if (!ok) {
      return res
        .status(400)
        .json({ success: false, message: "Current password incorrect" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    citizen.password = hashed;
    await citizen.save();
    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (err) {
    console.error("change password error", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};

// Download full account data as JSON
export const downloadAccountData = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const citizen = await Citizen.findById(userId).select("-password");
    if (!citizen) {
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });
    }

    // remove internal id and metadata so user's id is not included in the downloaded file
    const safeCitizen = citizen.toObject ? citizen.toObject() : citizen;
    delete safeCitizen._id;
    delete safeCitizen.__v;

    const fileNameBase = (
      safeCitizen.name
        ? safeCitizen.name.replace(/\s+/g, "_")
        : safeCitizen.email || "user"
    ).replace(/[^a-zA-Z0-9_\-]/g, "");
    const fileName = `account-data-${fileNameBase}-${Date.now()}.json`;

    const data = {
      citizen: safeCitizen,
    };

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to download account data" });
  }
};

// Clear non-essential account data (documents/metadata could be added here)
export const clearAccountData = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const citizen = await Citizen.findById(userId);
    if (!citizen) {
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });
    }

    citizen.govtIds = [];
    citizen.address = undefined;
    citizen.dateOfBirth = undefined;
    await citizen.save();

    return res.status(200).json({
      success: true,
      message: "Account data cleared successfully",
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to clear account data" });
  }
};

// Permanently delete account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const citizen = await Citizen.findById(userId);
    if (!citizen) {
      return res
        .status(404)
        .json({ success: false, message: "Citizen not found" });
    }

    await Citizen.deleteOne({ _id: userId });

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete account" });
  }
};

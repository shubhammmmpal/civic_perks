import PaidPlan from "../model/paidPlans.model.js";
import User from "../model/user.model.js";
import Inventory from "../model/inventory.model.js";
import Megaphone from "../model/megaphone.model.js";
import GoldenCargo from "../model/goldenCargo.model.js";
import BoostLedger from "../model/BoostLedger.model.js";
import Pin from "../model/pin.model.js";
import { BOOSTS } from "../helper/constants.js";
import HexParty from "../model/hexParty.model.js";
import MultiLock from '../model/multiLock.model.js'

// const BOOST_COST = {
//   "X-Ray Filter": 40,
//   "Golden Cargo": 80,
//   "Radar Flare": 150,
//   "Megaphone": 500
// };

// export const buyBoost = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { boostType, quantity = 1 } = req.body;

//     // ✅ Validate boost
//     if (!BOOST_COST[boostType]) {
//       return res.status(400).json({ message: "Invalid boost type" });
//     }

//     const totalCredits = BOOST_COST[boostType] * quantity;

//     const user = await User.findById(userId);

//     // ❌ Not enough credits
//     if (user.credits < totalCredits) {
//       return res.status(400).json({ message: "Insufficient credits" });
//     }

//     // 💸 Deduct credits
//     user.credits -= totalCredits;
//     await user.save();

//     // ⏳ Expiry calculate
//     const expiryDate = new Date();
//     expiryDate.setHours(expiryDate.getHours() + 24 * quantity);

//     // 📦 Create plan
//     const plan = await PaidPlan.create({
//       userID: userId,
//       planType: "boost",
//       boostType,
//       expiryDate
//     });

//     // 🔗 link to user
//     user.plans.push(plan._id);
//     await user.save();

//     return res.status(201).json({
//       message: "Boost activated",
//       plan
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const purchaseBoost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boostType, quantity = 1 } = req.body;

    // Validate boost type
    if (!BOOSTS[boostType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid boost type",
      });
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const boost = BOOSTS[boostType];
    const totalPrice = boost.price * quantity;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check credits
    if (user.credits < totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits",
      });
    }

    const creditsBefore = user.credits;

    // Deduct credits
    user.credits -= totalPrice;
    await user.save();

    const creditsAfter = user.credits;

    await BoostLedger.create({
      userId,
      boostType,
      quantity,
      pricePerBoost: boost.price,
      totalPrice,
      creditsBefore,
      creditsAfter,
      // activatedAt: now,
      // expiresAt,
      transactionType: "PURCHASE",
      status: "SUCCESS",
    });

    // Find/Create inventory
    let inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      inventory = new Inventory({ userId });
    }

    // Add purchased quantity
    inventory.boosts[boostType].quantity += quantity;

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + boost.durationHours * 60 * 60 * 1000,
    );

    // Activate boost
    inventory[boostType] = {
      activatedAt: now,
      expiresAt,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: `${quantity} ${boostType} boost(s) purchased and activated successfully`,
      data: {
        boostType,
        quantity,
        totalPrice,
        activatedAt: now,
        expiresAt,
        remainingCredits: user.credits,
        currentQuantity: inventory.boosts[boostType].quantity,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const useInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boostType } = req.body;

    if (!BOOSTS[boostType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid boost type",
      });
    }

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const boostItem = inventory.boosts[boostType];

    if (boostItem.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No boost available",
      });
    }

    // Check if already active
    if (
      boostItem.active?.expiresAt &&
      boostItem.active.expiresAt > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Boost already active",
      });
    }

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + BOOSTS[boostType].durationHours * 60 * 60 * 1000,
    );

    boostItem.quantity -= 1;

    boostItem.active = {
      activatedAt: now,
      expiresAt,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: `${boostType} activated`,
      data: {
        activatedAt: now,
        expiresAt,
        remainingQuantity: boostItem.quantity,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const useMegaphone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pinIds } = req.body;

    if (!Array.isArray(pinIds) || pinIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "pinIds array is required",
      });
    }

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    if (inventory.boosts.megaphone.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No Megaphone available",
      });
    }

    const now = new Date();

    // Check existing Megaphone
    const existingMegaphone = await Megaphone.findOne({ userId });

    if (
      existingMegaphone &&
      existingMegaphone.expiresAt &&
      existingMegaphone.expiresAt > now
    ) {
      return res.status(400).json({
        success: false,
        message: "Megaphone is already active",
        expiresAt: existingMegaphone.expiresAt,
      });
    }

    const expiresAt = new Date(
      now.getTime() + BOOSTS.megaphone.durationHours * 60 * 60 * 1000,
    );

    // consume inventory
    inventory.boosts.megaphone.quantity -= 1;

    inventory.boosts.megaphone.active = {
      activatedAt: now,
      expiresAt,
    };

    await inventory.save();

    const megaphone = await Megaphone.findOneAndUpdate(
      { userId },
      {
        $set: {
          pinId: pinIds,
          startAt: now,
          expiresAt,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Megaphone activated successfully",
      data: megaphone,
    });
  } catch (error) {
    console.error("useMegaphone error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const useGoldenCargo = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    if (inventory.boosts.goldenCargo.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No Golden Cargo available",
      });
    }

    const existingCargo = await GoldenCargo.findOne({
      userId,
      expiresAt: { $gt: new Date() },
    });

    if (existingCargo) {
      return res.status(400).json({
        success: false,
        message: "Golden Cargo already active",
        expiresAt: existingCargo.expiresAt,
      });
    }

    const activatedAt = new Date();

    const expiresAt = new Date(
      activatedAt.getTime() + BOOSTS.goldenCargo.durationHours * 60 * 60 * 1000,
    );

    const cargo = await GoldenCargo.create({
      userId,
      pinId: [],
      activatedAt,
      expiresAt,
    });

    inventory.boosts.goldenCargo.quantity -= 1;

    inventory.boosts.goldenCargo.active = {
      activatedAt,
      expiresAt,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: "Golden Cargo activated successfully",
      data: cargo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const useHexParty = async (req, res) => {
  try {
    const userId = req.user.id;

    const { hexagonId } = req.body;

    // =========================================
    // VALIDATION
    // =========================================

    if (!hexagonId) {
      return res.status(400).json({
        success: false,
        message: "Hexagon ID is required",
      });
    }

    // =========================================
    // GET INVENTORY
    // =========================================

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // =========================================
    // CHECK HEX-PARTY QUANTITY
    // =========================================

    if (inventory.boosts.HexParty.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No Hex-Party available",
      });
    }

    // =========================================
    // CHECK EXISTING HEX-PARTY
    // =========================================

    const existingHexParty = await HexParty.findOne({
      hexagon_id: hexagonId,
      expiryAt: { $gt: new Date() },
    });

    if (existingHexParty) {
      return res.status(400).json({
        success: false,
        message: "Hex-Party is already active in this hexagon",
        expiresAt: existingHexParty.expiryAt,
      });
    }

    // =========================================
    // ACTIVATE HEX-PARTY
    // =========================================

    const activatedAt = new Date();

    const expiryAt = new Date(
      activatedAt.getTime() +
        BOOSTS.HexParty.durationHours * 60 * 60 * 1000,
    );

    // =========================================
    // CREATE HEX-PARTY
    // =========================================

    const hexParty = await HexParty.create({
      user_id: userId,
      hexagon_id: hexagonId,
      activatedAt,
      expiryAt,
    });

    // =========================================
    // UPDATE INVENTORY
    // =========================================

    inventory.boosts.HexParty.quantity -= 1;

    inventory.boosts.HexParty.active = {
      activatedAt,
      expiresAt: expiryAt,
      active: true,
    };

    await inventory.save();

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(200).json({
      success: true,
      message: "Hex-Party activated successfully",
      data: hexParty,
    });
  } catch (error) {
    console.error("useHexParty error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const useFastTrackJury = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const fastTrackJury = inventory.boosts.FastTrackJury;

    // Check quantity
    if (fastTrackJury.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No Fast Track Jury boost available",
      });
    }

    const now = new Date();

    // Check if already active
    if (
      fastTrackJury.active?.active &&
      fastTrackJury.active.expiresAt &&
      fastTrackJury.active.expiresAt > now
    ) {
      return res.status(400).json({
        success: false,
        message: "Fast Track Jury is already active",
        data: {
          expiresAt: fastTrackJury.active.expiresAt,
        },
      });
    }

    // Duration from BOOSTS config
    // const expiresAt = new Date(
    //   now.getTime() +
    //     BOOSTS.FastTrackJury.durationHours * 60 * 60 * 1000
    // );

    // Consume one boost
    fastTrackJury.quantity -= 1;

    // Activate boost
    fastTrackJury.active = {
      activatedAt: now,
      // expiresAt,
      active: true,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: "Fast Track Jury activated successfully",
      data: {
        activatedAt: now,
        // expiresAt,
        remainingQuantity: fastTrackJury.quantity,
      },
    });
  } catch (error) {
    console.error("useFastTrackJury error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const useBeacon = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const beacon = inventory.boosts.TheBeacon;

    // Check quantity
    if (beacon.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No Beacon available",
      });
    }

    const now = new Date();

    // Check if already active
    if (
      beacon.active?.active 
      // beacon.active?.expiresAt &&
      // beacon.active.expiresAt > now
    ) {
      return res.status(400).json({
        success: false,
        message: "Beacon is already active",
        data: {
          activatedAt: beacon.active.activatedAt,
          expiresAt: beacon.active.expiresAt,
        },
      });
    }

    // Calculate expiry
    // const expiresAt = new Date(
    //   now.getTime() +
    //     BOOSTS.TheBeacon.durationHours * 60 * 60 * 1000
    // );

    // Consume one Beacon
    beacon.quantity -= 1;

    // Activate Beacon
    beacon.active = {
      activatedAt: now,
      // expiresAt,
      active: true,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: "The Beacon activated successfully",
      data: {
        activatedAt: now,
        // expiresAt,
        remainingQuantity: beacon.quantity,
      },
    });
  } catch (error) {
    console.error("useBeacon error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const useMultiLock = async (req, res) => {
  try {
    const userId = req.user.id;

    // =========================================
    // FIND INVENTORY
    // =========================================

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const multiLockBoost = inventory.boosts?.MultiLock;

    if (!multiLockBoost) {
      return res.status(404).json({
        success: false,
        message: "MultiLock boost not found",
      });
    }

    // =========================================
    // CHECK QUANTITY
    // =========================================

    if (multiLockBoost.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No MultiLock boost available",
      });
    }

    const now = new Date();

    // =========================================
    // CHECK ALREADY ACTIVE
    // =========================================

    if (
      // multiLockBoost.active?.active &&
      multiLockBoost.active?.expiresAt &&
      new Date(multiLockBoost.active.expiresAt) > now
    ) {
      return res.status(400).json({
        success: false,
        message: "MultiLock is already active",
        data: {
          activatedAt: multiLockBoost.active.activatedAt,
          expiresAt: multiLockBoost.active.expiresAt,
        },
      });
    }

    // =========================================
    // CALCULATE EXPIRY
    // =========================================

    const durationHours = BOOSTS.MultiLock.durationHours;

    const expiresAt = new Date(
      now.getTime() + durationHours * 60 * 60 * 1000
    );

    // =========================================
    // CONSUME BOOST
    // =========================================

    multiLockBoost.quantity -= 1;

    // =========================================
    // ACTIVATE BOOST
    // =========================================

    multiLockBoost.active = {
      activatedAt: now,
      expiresAt,
      active: true,
    };

    // =========================================
    // CREATE / UPDATE MULTILOCK
    // =========================================

    await MultiLock.findOneAndUpdate(
      { userId },
      {
        userId,
        activeAt: now,
        expireAt: expiresAt,
        activePinCount: 0,
        activePins: [],
      },
      {
        upsert: true,
        new: true,
      }
    );

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: "MultiLock activated successfully",
      data: {
        activatedAt: now,
        expiresAt,
        remainingQuantity: multiLockBoost.quantity,
        maxPins: 3,
      },
    });
  } catch (error) {
    console.error("useMultiLock error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find().populate("userId", "name email");

    return res.status(200).json({
      success: true,
      count: inventories.length,
      data: inventories,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await Inventory.findById(inventoryId).populate(
      "userId",
      "name email",
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getInventoryByUserId = async (req, res) => {
  try {
    const { userId } = req.user._id;

    const inventory = await Inventory.findOne({ userId }).populate(
      "userId",
      "name email",
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getMyInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    await Inventory.findByIdAndDelete(inventoryId);

    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getBoostPurchaseHistory = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    // Normal user can only view their own records
    if (role !== "ADMIN") {
      query.userId = userId;
    }

    // Search by boost type
    if (search) {
      query.boostType = {
        $regex: search,
        $options: "i",
      };
    }

    // Date Filter
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await BoostLedger.countDocuments(query);

    const history = await BoostLedger.find(query)
      .populate("userId", "name username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: history,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

import PaidPlan from "../model/paidPlans.model.js";
import User from "../model/user.model.js";
import Inventory from "../model/inventory.model.js";
import Megaphone from "../model/megaphone.model.js";
import GoldenCargo from "../model/goldenCargo.model.js";
import BoostLedger from "../model/BoostLedger.model.js";
import Pin from "../model/pin.model.js";
import { BOOSTS } from "../helper/constants.js";

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
        message: "Invalid boost type"
      });
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0"
      });
    }

    const boost = BOOSTS[boostType];
    const totalPrice = boost.price * quantity;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check credits
    if (user.credits < totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits"
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
    status: "SUCCESS"
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
      now.getTime() + boost.durationHours * 60 * 60 * 1000
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
        currentQuantity: inventory.boosts[boostType].quantity
      }
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error"
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
      now.getTime() +
      BOOSTS[boostType].durationHours * 60 * 60 * 1000
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
      now.getTime() +
      BOOSTS.megaphone.durationHours * 60 * 60 * 1000
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
      }
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
      activatedAt.getTime() +
      BOOSTS.goldenCargo.durationHours * 60 * 60 * 1000
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


export const getAllInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find()
      .populate("userId", "name email");

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

    const inventory = await Inventory.findById(inventoryId)
      .populate("userId", "name email");

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

    const inventory = await Inventory.findOne({ userId })
      .populate("userId", "name email");

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

    const {
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

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

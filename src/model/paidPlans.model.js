    import mongoose from "mongoose";

    const paidPlanSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    planType: {
        type: String,
        enum: ["boost", "subscription"],
        required: true
    },

    boostType: {
        type: String,
        enum: ["X-Ray Filter", "Golden Cargo", "Radar Flare", "Megaphone"],
    },

    subscriptionType: {
        type: String,
        enum: ["Free_Tier", "Civic_Plus", "Civic_Pro"],
        default: "Free_Tier"
    },

    expiryDate: {
        type: Date,
        index: true
    }

    }, { timestamps: true });


    paidPlanSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

    export default mongoose.model("PaidPlan", paidPlanSchema);
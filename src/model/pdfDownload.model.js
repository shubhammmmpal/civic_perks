import mongoose from "mongoose";

const pdfDownloadSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    reportType: {
        type: String,
        enum: ["FREE", "HIGH", "PRO"],
    },

    downloadedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("PdfDownload", pdfDownloadSchema);
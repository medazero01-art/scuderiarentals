import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: false },
  pricePerDay: { type: Number, required: true },
  available: { type: Boolean, default: true },
  imageUrl: { type: String, required: true},
  description: {type: String, required: false}
}, { timestamps: true });

export default mongoose.model("Car", carSchema);

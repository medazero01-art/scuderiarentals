// Models/Reservation.js
import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  car: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Car', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "completed"], 
    default: "pending" 
  }
}, { timestamps: true });

export default mongoose.model("Reservation", reservationSchema);
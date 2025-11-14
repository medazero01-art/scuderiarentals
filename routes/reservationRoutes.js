// Routes/reservationRoutes.js
import express from "express";
import Reservation from "../Models/Reservation.js";
import Car from "../Models/Car.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

// Créer une nouvelle réservation
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    const userId = req.user.id;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalPrice = rentalDays * car.pricePerDay;

    const newReservation = new Reservation({
      car: carId,
      user: userId,
      startDate,
      endDate,
      totalPrice,
      status: "pending"
    });

    await newReservation.save();
    res.status(201).json(newReservation);
  } catch (err) {
    res.status(500).json({ message: "Failed to create reservation", error: err.message });
  }
});

// Récupérer les réservations de l'utilisateur connecté
router.get("/my-reservations", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate("car")
      .sort({ createdAt: -1 });

    const safeReservations = reservations.map(r => ({
      ...r._doc,
      car: r.car || { name: "Deleted", year: "-", imageUrl: null, pricePerDay: 0 }
    }));

    res.json(safeReservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations", error: err.message });
  }
});

// Admin: récupérer toutes les réservations
router.get("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const reservations = await Reservation.find()
      .populate("car")
      .populate("user", "username email phoneNumber")
      .sort({ createdAt: -1 });

    const safeReservations = reservations.map(r => ({
      ...r._doc,
      car: r.car || { name: "Deleted", year: "-", imageUrl: null, pricePerDay: 0 },
      user: r.user || { username: "Deleted", email: "-", phoneNumber: "-" }
    }));

    res.json(safeReservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all reservations", error: err.message });
  }
});

// Admin: changer le statut d'une réservation
router.put("/:id/status", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const { status } = req.body;
    if (!["approved", "rejected", "completed"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("car")
      .populate("user", "username email phoneNumber");

    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const safeReservation = {
      ...reservation._doc,
      car: reservation.car || { name: "Deleted", year: "-", imageUrl: null, pricePerDay: 0 },
      user: reservation.user || { username: "Deleted", email: "-", phoneNumber: "-" }
    };

    res.json(safeReservation);
  } catch (err) {
    res.status(500).json({ message: "Failed to update reservation status", error: err.message });
  }
});

// Récupérer les dates de réservation APPROUVÉES pour une voiture spécifique
router.get("/car/:carId/approved", async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      car: req.params.carId,
      status: "approved"
    }).select("startDate endDate");

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch approved dates", error: err.message });
  }
});

export default router;

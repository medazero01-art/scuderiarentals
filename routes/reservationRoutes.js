// Routes/reservationRoutes.js
import express from "express";
import Reservation from "../Models/Reservation.js";
import Car from "../Models/Car.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

/**
 * 1. POST: Créer une nouvelle réservation (UTILISATEUR)
 */
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

/**
 * 2. GET: Récupérer les réservations de l'utilisateur connecté
 */
router.get("/my-reservations", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate("car")
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations", error: err.message });
  }
});

/**
 * 3. GET: Récupérer toutes les réservations (ADMIN)
 */
router.get("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const reservations = await Reservation.find()
      .populate("car")
      .populate("user", "username email phoneNumber")
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all reservations", error: err.message });
  }
});

/**
 * 4. PUT: Changer le statut d'une réservation (ADMIN)
 */
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

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Failed to update reservation status", error: err.message });
  }
});

/**
 * 5. GET: Récupérer les dates de réservation APPROUVÉES pour une voiture spécifique
 */
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

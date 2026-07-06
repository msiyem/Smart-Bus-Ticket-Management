import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";

import routeRoutes from "./routes/route.routes.js";
import busRoutes from "./routes/bus.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import operatorRoutes from "./routes/operator.routes.js";
import tripRoutes from "./routes/trip.routes.js";

import corsMiddleware from "./config/cors.js";
const app = express();
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/routes", routeRoutes);

app.use("/api/buses", busRoutes);

app.use("/api/schedules", scheduleRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/operators", operatorRoutes);

app.use("/api/trips", tripRoutes);

app.get("/", (req, res) => {
  res.send("Ticket Management API Running 🚀");
});

export default app;

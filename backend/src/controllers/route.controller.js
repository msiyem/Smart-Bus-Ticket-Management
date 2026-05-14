import { requireFields } from "../validations/requireFields.validate.js";
import pool from "../config/db.js";

export const createRoute = async (req, res) => {
  try {
    requireFields(
      req.body,
      "source_city",
      "destination_city",
      "distance_km",
      "estimated_duration",
    );
    const { source_city, destination_city, distance_km, estimated_duration } =
      req.body;

    const [result] = await pool.execute(
      `INSERT INTO routes
      (source_city, destination_city, distance_km, estimated_duration)
      VALUES (?, ?, ?, ?)`,
      [source_city, destination_city, distance_km, estimated_duration],
    );
    res.status(201).json({
      success: true,
      message: "Route created successfully",
      routeId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllRoutes = async (req, res) => {
  try {
    const [routes] = await pool.execute("SELECT * FROM routes");
    res.status(200).json({
      success: true,
      routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

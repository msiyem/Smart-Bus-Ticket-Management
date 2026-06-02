import pool from "../config/db.js";
import { requireFields } from "../validations/requireFields.validate.js";

export const createBus = async (req, res) => {
  try {
    requireFields(
      req.body,
      "bus_number",
      "bus_type",
      "capacity",
      "operator_name",
    );
    const { bus_number, bus_type, capacity, operator_name } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO buses
      (bus_number, bus_type, capacity, operator_name)
      VALUES (?, ?, ?, ?)`,
      [bus_number, bus_type, capacity, operator_name],
    );

    res.status(201).json({
      success: true,
      busId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllBuses = async (req, res) => {
  try {
    const [buses] = await pool.execute("SELECT * FROM buses");
    res.status(200).json({ success: true, buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

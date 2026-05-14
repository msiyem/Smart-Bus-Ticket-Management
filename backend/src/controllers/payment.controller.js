import pool from "../config/db.js";

export const createPayment = async (req, res) => {
  try {
    requireFields(
      req.body,
      "booking_id",
      "amount",
      "payment_method",
      "transaction_id",
    );
    const { booking_id, amount, payment_method, transaction_id } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO payments
      (booking_id, amount, payment_method, transaction_id, status, paid_at)
      VALUES (?, ?, ?, ?, 'SUCCESS', NOW())`,
      [booking_id, amount, payment_method, transaction_id],
    );

    res.status(201).json({
      success: true,
      paymentId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

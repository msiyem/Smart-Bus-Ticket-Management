import pool from "../config/db.js";

export const requireOperator = async (req, res, next) => {
  try {
    const { role, userId } = req.user || {};
    if (!role || (role !== "admin" && role !== "operator")) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Operator or admin role required.",
      });
    }

    if (role === "operator") {
      const [rows] = await pool.execute(
        `SELECT id, owner_user_id, name, email, phone, address,
                created_at, updated_at
         FROM bus_operators WHERE owner_user_id = ?`,
        [userId],
      );
      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          message:
            "Operator account is not linked to a bus_operator. Contact admin.",
        });
      }
      req.user.bus_operator_id = rows[0].id;
      req.user.operator = rows[0];
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requireOperatorOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { role, bus_operator_id } = req.user || {};
      if (role === "admin") return next();

      if (role !== "operator" || !bus_operator_id) {
        return res.status(403).json({
          success: false,
          message: "Operator role required.",
        });
      }

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid resource id" });
      }

      let resource = null;
      if (resourceType === "trip") {
        const [rows] = await pool.execute(
          `SELECT t.id, t.schedule_id, t.trip_date, t.status, t.fare,
                  b.operator_id
           FROM trips t
           JOIN schedules s ON t.schedule_id = s.id
           JOIN buses b ON s.bus_id = b.id
           WHERE t.id = ?`,
          [id],
        );
        resource = rows[0] || null;
      } else if (resourceType === "bus") {
        const [rows] = await pool.execute(
          `SELECT id, bus_number, operator_id FROM buses WHERE id = ?`,
          [id],
        );
        resource = rows[0] || null;
      } else if (resourceType === "schedule") {
        const [rows] = await pool.execute(
          `SELECT s.id, s.bus_id, b.operator_id
           FROM schedules s
           JOIN buses b ON s.bus_id = b.id
           WHERE s.id = ?`,
          [id],
        );
        resource = rows[0] || null;
      } else if (resourceType === "route") {
        // Routes are admin-only; no operator ownership concept in this model.
        return res.status(403).json({
          success: false,
          message: "Routes are managed by admins only.",
        });
      } else {
        return res
          .status(500)
          .json({ success: false, message: `Unknown resource type: ${resourceType}` });
      }

      if (!resource) {
        return res
          .status(404)
          .json({ success: false, message: `${resourceType} not found` });
      }

      if (Number(resource.operator_id) !== Number(bus_operator_id)) {
        return res.status(403).json({
          success: false,
          message: `You do not own this ${resourceType}.`,
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};
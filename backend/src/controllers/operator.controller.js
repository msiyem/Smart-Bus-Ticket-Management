import pool from "../config/db.js";

const shapeOperator = (row) => ({
  id: row.id,
  owner_user_id: row.owner_user_id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  created_at: row.created_at,
  updated_at: row.updated_at,
  owner_name: row.owner_name ?? null,
  owner_email: row.owner_email ?? null,
});

const SELECT_OPERATOR_BASE = `
  SELECT bo.*,
         u.name AS owner_name, u.email AS owner_email
  FROM bus_operators bo
  LEFT JOIN users u ON bo.owner_user_id = u.id
`;

export const createOperator = async (req, res) => {
  try {
    const { owner_user_id, name, email, phone, address } = req.body;

    const [ownerRows] = await pool.execute(
      `SELECT id, role FROM users WHERE id = ?`,
      [owner_user_id],
    );
    if (ownerRows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Owner user not found" });
    }
    if (ownerRows[0].role !== "operator") {
      return res.status(400).json({
        success: false,
        message:
          "Owner user must have role 'operator'. Update the user first.",
      });
    }

    const [existing] = await pool.execute(
      `SELECT id FROM bus_operators WHERE owner_user_id = ?`,
      [owner_user_id],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This user is already linked to a bus_operator",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO bus_operators
        (owner_user_id, name, email, phone, address)
       VALUES (?, ?, ?, ?, ?)`,
      [owner_user_id, name, email || null, phone || null, address || null],
    );

    res.status(201).json({ success: true, operatorId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOperator = async (req, res) => {
  try {
    const { role, bus_operator_id } = req.user || {};
    if (role !== "operator" || !bus_operator_id) {
      return res
        .status(403)
        .json({ success: false, message: "Operator role required" });
    }
    const [rows] = await pool.execute(
      `${SELECT_OPERATOR_BASE} WHERE bo.id = ?`,
      [bus_operator_id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Operator record not found" });
    }
    res.json({ success: true, data: shapeOperator(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listOperators = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `${SELECT_OPERATOR_BASE} ORDER BY bo.created_at DESC`,
    );
    res.json({ success: true, data: rows.map(shapeOperator) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOperatorById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid operator id" });
    }
    const [rows] = await pool.execute(
      `${SELECT_OPERATOR_BASE} WHERE bo.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Operator not found" });
    }
    res.json({ success: true, data: shapeOperator(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOperator = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid operator id" });
    }

    const allowed = ["name", "email", "phone", "address"];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE bus_operators SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Operator not found" });
    }

    res.json({ success: true, operatorId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOperator = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid operator id" });
    }

    const [busCount] = await pool.execute(
      `SELECT COUNT(*) AS c FROM buses WHERE operator_id = ?`,
      [id],
    );
    if (Number(busCount[0].c) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete operator that still owns buses. Reassign buses first.",
      });
    }

    const [result] = await pool.execute(
      `DELETE FROM bus_operators WHERE id = ?`,
      [id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Operator not found" });
    }
    res.json({ success: true, operatorId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOperatorBuses = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid operator id" });
    }
    const [rows] = await pool.execute(
      `SELECT id, bus_number, bus_type, capacity, operator_name, operator_id,
              status, created_at
       FROM buses WHERE operator_id = ? ORDER BY created_at DESC`,
      [id],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOperatorSchedules = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid operator id" });
    }
    const [rows] = await pool.execute(
      `SELECT s.id, s.route_id, s.bus_id, s.departure_time, s.arrival_time,
              s.fare, s.repeat_days, s.status, s.created_at,
              r.source_city, r.destination_city,
              b.bus_number, b.operator_id
       FROM schedules s
       JOIN buses b ON s.bus_id = b.id
       JOIN routes r ON s.route_id = r.id
       WHERE b.operator_id = ?
       ORDER BY s.created_at DESC`,
      [id],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

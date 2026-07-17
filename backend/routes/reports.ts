import express from "express";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole("Administrador"));

// GET /api/reports/summary?period=week|month — aggregate counts for the admin dashboard.
router.get("/summary", async (req, res) => {
  const period = req.query.period === "month" ? "month" : "week";
  const intervalDays = period === "month" ? 30 : 7;

  const [appointmentsByStatus]: any = await pool.query(
    `SELECT status, COUNT(*) AS total
     FROM agenda_events
     WHERE start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY status`,
    [intervalDays]
  );

  const [totalAppointments]: any = await pool.query(
    `SELECT COUNT(*) AS total FROM agenda_events WHERE start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [intervalDays]
  );

  const [newPatients]: any = await pool.query(
    `SELECT COUNT(*) AS total FROM patients WHERE data_inicio >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [intervalDays]
  );

  const [sessionsLogged]: any = await pool.query(
    `SELECT COUNT(*) AS total FROM sessions WHERE data >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [intervalDays]
  );

  const [activePatients]: any = await pool.query(
    `SELECT COUNT(DISTINCT patient_id) AS total FROM agenda_events WHERE start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [intervalDays]
  );

  const [byDay]: any = await pool.query(
    `SELECT DATE(start_time) AS day, COUNT(*) AS total
     FROM agenda_events
     WHERE start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(start_time)
     ORDER BY day ASC`,
    [intervalDays]
  );

  const statusMap: Record<string, number> = {};
  for (const row of appointmentsByStatus) statusMap[row.status] = row.total;

  res.json({
    period,
    intervalDays,
    totalAppointments: totalAppointments[0]?.total ?? 0,
    appointmentsByStatus: statusMap,
    newPatients: newPatients[0]?.total ?? 0,
    sessionsLogged: sessionsLogged[0]?.total ?? 0,
    activePatients: activePatients[0]?.total ?? 0,
    appointmentsByDay: byDay.map((r: any) => ({ day: r.day, total: r.total })),
  });
});

export default router;

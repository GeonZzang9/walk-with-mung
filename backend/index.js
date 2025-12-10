const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

const padTime = (value) => String(value).padStart(2, '0');

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);
app.use(express.json());

// 모든 강아지 목록 + 최신 예약자 이름
app.get('/api/dogs', async (req, res) => {
  const sql = `
    SELECT
      d.id,
      d.name,
      d.breed,
      d.age,
      d.description,
      d.status,
      d.lastWalkTime,
      d.currentWalkEnd,
      d.image,
      (
        SELECT r.reserver_name
        FROM reservations r
        WHERE r.dog_id = d.id
        ORDER BY r.id DESC
        LIMIT 1
      ) AS reserverName
    FROM dogs d
  `;

  try {
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching dogs', err);
    return res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// 예약 생성
app.post('/api/reservations', async (req, res) => {
  const { dogId, time, reserverName, reserverPhone } = req.body;

  if (!dogId || !time || !reserverName || !reserverPhone) {
    return res
      .status(400)
      .json({ error: 'dogId, time, reserverName, and reserverPhone are required' });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const [result] = await pool.query(
      'INSERT INTO reservations (dog_id, date, time, status, reserver_name, reserver_phone) VALUES (?, ?, ?, ?, ?, ?)',
      [dogId, today, time, 'reserved', reserverName, reserverPhone]
    );

    await pool.query(
      'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ?',
      ['reserved', dogId]
    );

    res.status(201).json({
      id: result.insertId,
      dogId,
      date: today,
      time,
      reserverName,
      reserverPhone,
      status: 'reserved',
    });
  } catch (err) {
    console.error('Error creating reservation', err);
    return res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// 산책 완료 처리
app.post('/api/dogs/:id/complete', async (req, res) => {
  const dogId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  const now = new Date();
  const completedTime = `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;

  const performComplete = async (completedBy = 'manual') => {
    await pool.query(
      'UPDATE dogs SET status = ?, lastWalkTime = ?, currentWalkEnd = NULL WHERE id = ?',
      ['completed', completedTime, dogId]
    );

    await pool.query(
      `UPDATE reservations
       SET status = 'completed', walk_end_time = ?, completed_by = ?
       WHERE id = (
         SELECT MAX(id) FROM reservations WHERE dog_id = ?
       )`,
      [completedTime, completedBy, dogId]
    );

    return res.json({ dogId: Number(dogId), completedTime, status: 'completed' });
  };

  try {
    // 예약자 정보가 함께 온 경우 검증
    if (reserverName && reserverPhone) {
      const [rows] = await pool.query(
        `SELECT reserver_name AS reserverName, reserver_phone AS reserverPhone
         FROM reservations
         WHERE dog_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [dogId]
      );
      const row = rows[0];

      if (
        !row ||
        row.reserverName !== reserverName ||
        row.reserverPhone !== reserverPhone
      ) {
        return res.status(400).json({ error: '예약자 정보가 일치하지 않습니다.' });
      }

      await performComplete('manual');
    } else {
      // 시스템/관리자에 의한 완료 처리
      await performComplete('system');
    }
  } catch (err) {
    console.error('Error completing walk', err);
    return res.status(500).json({ error: 'Failed to complete reservation' });
  }
});

// 산책 시작
app.post('/api/dogs/:id/start-walk', async (req, res) => {
  const dogId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  if (!reserverName || !reserverPhone) {
    return res.status(400).json({ error: 'reserverName and reserverPhone are required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, date, time, status, reserver_name AS reserverName, reserver_phone AS reserverPhone
       FROM reservations
       WHERE dog_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [dogId]
    );
    const row = rows[0];

    if (!row || row.status !== 'reserved') {
      return res.status(400).json({ error: '진행 중인 예약이 없는 상태입니다.' });
    }

    if (row.reserverName !== reserverName || row.reserverPhone !== reserverPhone) {
      return res.status(400).json({ error: '예약자 정보가 일치하지 않습니다.' });
    }

    const now = new Date();
    const startTime = `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;
    const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endTime = `${padTime(endDate.getHours())}:${padTime(endDate.getMinutes())}`;

    await pool.query(
      'UPDATE dogs SET status = ?, currentWalkEnd = ? WHERE id = ?',
      ['walking', endTime, dogId]
    );

    await pool.query(
      'UPDATE reservations SET status = ?, walk_start_time = ?, walk_end_time = ? WHERE id = ?',
      ['walking', startTime, endTime, row.id]
    );

    return res.json({
      dogId: Number(dogId),
      reservationId: row.id,
      status: 'walking',
      currentWalkEnd: endTime,
    });
  } catch (err) {
    console.error('Error starting walk', err);
    return res.status(500).json({ error: 'Failed to start walk' });
  }
});

// 예약 목록
app.get('/api/reservations', async (req, res) => {
  const sql = `
    SELECT
      r.id,
      r.dog_id AS dogId,
      r.date,
      r.time,
      r.status,
      r.reserver_name AS reserverName,
      r.reserver_phone AS reserverPhone,
      r.walk_start_time AS walkStartTime,
      r.walk_end_time AS walkEndTime,
      r.completed_by AS completedBy,
      r.created_at AS createdAt,
      d.name AS dogName,
      d.breed AS dogBreed,
      d.image AS dogImage
    FROM reservations r
    JOIN dogs d ON d.id = r.dog_id
    ORDER BY r.date, r.time, r.id
  `;

  try {
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reservations', err);
    return res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// 예약 ID 기준 취소
app.post('/api/reservations/:id/cancel', async (req, res) => {
  const reservationId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  if (!reserverName || !reserverPhone) {
    return res.status(400).json({ error: 'reserverName and reserverPhone are required' });
  }

  const sql = `
    SELECT
      r.id,
      r.dog_id AS dogId,
      r.status,
      r.reserver_name AS reserverName,
      r.reserver_phone AS reserverPhone,
      d.status AS dogStatus
    FROM reservations r
    JOIN dogs d ON d.id = r.dog_id
    WHERE r.id = ?
  `;

  try {
    const [rows] = await pool.query(sql, [reservationId]);
    const row = rows[0];

    if (!row) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (
      row.reserverName !== reserverName ||
      row.reserverPhone !== reserverPhone ||
      row.status !== 'reserved'
    ) {
      return res
        .status(400)
        .json({ error: '예약 정보가 일치하지 않거나 취소할 수 없는 상태입니다.' });
    }

    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [
      'cancelled',
      reservationId,
    ]);

    await pool.query(
      'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ? AND status = ?',
      ['available', row.dogId, 'reserved']
    );

    return res.json({ id: row.id, dogId: row.dogId, status: 'cancelled' });
  } catch (err) {
    console.error('Error cancelling reservation', err);
    return res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// 강아지 기준 최신 예약 취소
app.post('/api/dogs/:id/cancel-reservation', async (req, res) => {
  const dogId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  if (!reserverName || !reserverPhone) {
    return res.status(400).json({ error: 'reserverName and reserverPhone are required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, status, reserver_name AS reserverName, reserver_phone AS reserverPhone
       FROM reservations
       WHERE dog_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [dogId]
    );
    const row = rows[0];

    if (!row) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (
      row.reserverName !== reserverName ||
      row.reserverPhone !== reserverPhone ||
      row.status !== 'reserved'
    ) {
      return res
        .status(400)
        .json({ error: '예약 정보가 일치하지 않거나 취소할 수 없는 상태입니다.' });
    }

    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [
      'cancelled',
      row.id,
    ]);

    await pool.query(
      'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ? AND status = ?',
      ['available', dogId, 'reserved']
    );

    return res.json({
      dogId: Number(dogId),
      reservationId: row.id,
      status: 'cancelled',
    });
  } catch (err) {
    console.error('Error cancelling reservation by dog', err);
    return res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// 강아지 상태 강제 리셋
app.post('/api/dogs/:id/reset', async (req, res) => {
  const dogId = req.params.id;

  try {
    await pool.query('UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ?', [
      'available',
      dogId,
    ]);

    return res.json({ dogId: Number(dogId), status: 'available' });
  } catch (err) {
    console.error('Error resetting dog to available', err);
    return res.status(500).json({ error: 'Failed to reset dog status' });
  }
});

// 자동으로 산책 완료 처리 + 날짜 지난 completed 리셋
const checkAndCompleteWalks = async () => {
  const sql = `
    SELECT
      id as dogId,
      currentWalkEnd
    FROM dogs
    WHERE status = 'walking'
  `;

  try {
    const [rows] = await pool.query(sql);
    const now = new Date();

    for (const row of rows) {
      if (!row.currentWalkEnd) {
        continue;
      }

      const today = new Date().toISOString().slice(0, 10);
      const endDate = new Date(`${today}T${row.currentWalkEnd}`);

      if (now >= endDate) {
        const lastWalkTime = row.currentWalkEnd;

        await pool.query(
          'UPDATE dogs SET status = ?, lastWalkTime = ?, currentWalkEnd = NULL WHERE id = ?',
          ['completed', lastWalkTime, row.dogId]
        );

        await pool.query(
          `UPDATE reservations
           SET status = 'completed', walk_end_time = ?, completed_by = 'auto'
           WHERE id = (
             SELECT MAX(id) FROM reservations WHERE dog_id = ?
           )`,
          [lastWalkTime, row.dogId]
        );
      }
    }

    // 날짜가 지난 completed 상태 강아지들을 available로 리셋
    const today = new Date().toISOString().slice(0, 10);
    const clearSql = `
      SELECT
        d.id as dogId,
        r.date
      FROM dogs d
      JOIN reservations r ON r.dog_id = d.id
      WHERE d.status = 'completed'
        AND r.id = (
          SELECT MAX(id) FROM reservations r2 WHERE r2.dog_id = d.id
        )
    `;

    const [clearRows] = await pool.query(clearSql);

    for (const row of clearRows) {
      if (row.date < today) {
        await pool.query(
          'UPDATE dogs SET status = ?, lastWalkTime = NULL, currentWalkEnd = NULL WHERE id = ?',
          ['available', row.dogId]
        );
      }
    }
  } catch (err) {
    console.error('Error checking/completing walks', err);
  }
};

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
  checkAndCompleteWalks();
  setInterval(checkAndCompleteWalks, 60 * 1000);
});

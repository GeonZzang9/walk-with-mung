const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

const padTime = (value) => String(value).padStart(2, '0');

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api/dogs', (req, res) => {
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

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching dogs', err);
      return res.status(500).json({ error: 'Failed to fetch dogs' });
    }

    res.json(rows);
  });
});

app.post('/api/reservations', (req, res) => {
  const { dogId, time, reserverName, reserverPhone } = req.body;

  if (!dogId || !time || !reserverName || !reserverPhone) {
    return res
      .status(400)
      .json({ error: 'dogId, time, reserverName, and reserverPhone are required' });
  }

  const today = new Date().toISOString().slice(0, 10);

  db.run(
    'INSERT INTO reservations (dog_id, date, time, status, reserver_name, reserver_phone) VALUES (?, ?, ?, ?, ?, ?)',
    [dogId, today, time, 'reserved', reserverName, reserverPhone],
    function insertCallback(err) {
      if (err) {
        console.error('Error creating reservation', err);
        return res.status(500).json({ error: 'Failed to create reservation' });
      }

      db.run(
        'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ?',
        ['reserved', dogId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating dog status', updateErr);
          }

          res.status(201).json({
            id: this.lastID,
            dogId,
            date: today,
            time,
            reserverName,
            reserverPhone,
            status: 'reserved',
          });
        }
      );
    }
  );
});

app.post('/api/dogs/:id/complete', (req, res) => {
  const dogId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  const now = new Date();
  const completedTime = `${padTime(now.getHours())}:${padTime(
    now.getMinutes()
  )}`;

  const performComplete = (completedBy = 'manual') => {
    db.serialize(() => {
      db.run(
        'UPDATE dogs SET status = ?, lastWalkTime = ?, currentWalkEnd = NULL WHERE id = ?',
        ['completed', completedTime, dogId],
        (err) => {
          if (err) {
            console.error('Error completing walk', err);
          }
        }
      );

      db.run(
        `UPDATE reservations
         SET status = 'completed', walk_end_time = ?, completed_by = ?
         WHERE id = (
           SELECT MAX(id) FROM reservations WHERE dog_id = ?
         )`,
        [completedTime, completedBy, dogId],
        (resErr) => {
          if (resErr) {
            console.error('Error updating reservation status', resErr);
            return res.status(500).json({ error: 'Failed to complete reservation' });
          }

          return res.json({ dogId: Number(dogId), completedTime, status: 'completed' });
        }
      );
    });
  };

  // 예약자 정보가 함께 온 경우에는 검증 후 완료 처리
  if (reserverName && reserverPhone) {
    db.get(
      `SELECT reserver_name AS reserverName, reserver_phone AS reserverPhone
       FROM reservations
       WHERE dog_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [dogId],
      (err, row) => {
        if (err) {
          console.error('Error verifying reservation for completion', err);
          return res.status(500).json({ error: 'Failed to verify reservation' });
        }

        if (
          !row ||
          row.reserverName !== reserverName ||
          row.reserverPhone !== reserverPhone
        ) {
          return res.status(400).json({ error: '예약자 정보가 일치하지 않습니다.' });
        }

        performComplete('manual');
      }
    );
  } else {
    // 예약자 정보가 없으면 기존 동작 유지 (예: 관리자용)
    performComplete('system');
  }
});

app.post('/api/dogs/:id/start-walk', (req, res) => {
  const dogId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  if (!reserverName || !reserverPhone) {
    return res.status(400).json({ error: 'reserverName and reserverPhone are required' });
  }

  db.get(
    `SELECT id, date, time, status, reserver_name AS reserverName, reserver_phone AS reserverPhone
     FROM reservations
     WHERE dog_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [dogId],
    (err, row) => {
      if (err) {
        console.error('Error fetching latest reservation for start-walk', err);
        return res.status(500).json({ error: 'Failed to fetch reservation' });
      }

      if (!row || row.status !== 'reserved') {
        return res.status(400).json({ error: '시작할 수 있는 예약이 없습니다.' });
      }

      if (row.reserverName !== reserverName || row.reserverPhone !== reserverPhone) {
        return res.status(400).json({ error: '예약자 정보가 일치하지 않습니다.' });
      }

      const now = new Date();
      const startTime = `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;
      const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const endTime = `${padTime(endDate.getHours())}:${padTime(endDate.getMinutes())}`;

      db.serialize(() => {
        db.run(
          'UPDATE dogs SET status = ?, currentWalkEnd = ? WHERE id = ?',
          ['walking', endTime, dogId],
          (updateErr) => {
            if (updateErr) {
              console.error('Error updating dog to walking', updateErr);
              return res.status(500).json({ error: 'Failed to update dog status' });
            }

            db.run(
              'UPDATE reservations SET status = ?, walk_start_time = ?, walk_end_time = ? WHERE id = ?',
              ['walking', startTime, endTime, row.id],
              (resErr) => {
                if (resErr) {
                  console.error('Error updating reservation to walking', resErr);
                  return res.status(500).json({ error: 'Failed to update reservation status' });
                }

                return res.json({
                  dogId: Number(dogId),
                  reservationId: row.id,
                  status: 'walking',
                  currentWalkEnd: endTime,
                });
              }
            );
          }
        );
      });
    }
  );
});

app.get('/api/reservations', (req, res) => {
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

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching reservations', err);
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }

    res.json(rows);
  });
});

app.post('/api/reservations/:id/cancel', (req, res) => {
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

  db.get(sql, [reservationId], (err, row) => {
    if (err) {
      console.error('Error fetching reservation for cancel', err);
      return res.status(500).json({ error: 'Failed to fetch reservation' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (
      row.reserverName !== reserverName ||
      row.reserverPhone !== reserverPhone ||
      row.status !== 'reserved'
    ) {
      return res.status(400).json({ error: '예약 정보가 일치하지 않거나 이미 처리된 예약입니다.' });
    }

    db.serialize(() => {
      db.run(
        'UPDATE reservations SET status = ? WHERE id = ?',
        ['cancelled', reservationId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error cancelling reservation', updateErr);
            return res.status(500).json({ error: 'Failed to cancel reservation' });
          }

          // 예약이 취소되면 강아지를 다시 available로
          db.run(
            'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ? AND status = ?',
            ['available', row.dogId, 'reserved'],
            (dogErr) => {
              if (dogErr) {
                console.error('Error resetting dog after cancel', dogErr);
              }

              return res.json({ id: row.id, dogId: row.dogId, status: 'cancelled' });
            }
          );
        }
      );
    });
  });
});

// 강아지 기준으로 최신 예약을 취소 (예약자 정보 검증)
app.post('/api/dogs/:id/cancel-reservation', (req, res) => {
  const dogId = req.params.id;
  const { reserverName, reserverPhone } = req.body || {};

  if (!reserverName || !reserverPhone) {
    return res.status(400).json({ error: 'reserverName and reserverPhone are required' });
  }

  db.get(
    `SELECT id, status, reserver_name AS reserverName, reserver_phone AS reserverPhone
     FROM reservations
     WHERE dog_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [dogId],
    (err, row) => {
      if (err) {
        console.error('Error fetching reservation for dog cancel', err);
        return res.status(500).json({ error: 'Failed to fetch reservation' });
      }

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
          .json({ error: '예약 정보가 일치하지 않거나 이미 처리된 예약입니다.' });
      }

      db.serialize(() => {
        db.run(
          'UPDATE reservations SET status = ? WHERE id = ?',
          ['cancelled', row.id],
          (updateErr) => {
            if (updateErr) {
              console.error('Error cancelling reservation by dog', updateErr);
              return res.status(500).json({ error: 'Failed to cancel reservation' });
            }

            db.run(
              'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ? AND status = ?',
              ['available', dogId, 'reserved'],
              (dogErr) => {
                if (dogErr) {
                  console.error('Error resetting dog after cancel by dog', dogErr);
                }

                return res.json({
                  dogId: Number(dogId),
                  reservationId: row.id,
                  status: 'cancelled',
                });
              }
            );
          }
        );
      });
    }
  );
});

app.post('/api/dogs/:id/reset', (req, res) => {
  const dogId = req.params.id;

  db.run(
    'UPDATE dogs SET status = ?, currentWalkEnd = NULL WHERE id = ?',
    ['available', dogId],
    (err) => {
      if (err) {
        console.error('Error resetting dog to available', err);
        return res.status(500).json({ error: 'Failed to reset dog status' });
      }

      return res.json({ dogId: Number(dogId), status: 'available' });
    }
  );
});

const checkAndCompleteWalks = () => {
  const sql = `
    SELECT
      id as dogId,
      currentWalkEnd
    FROM dogs
    WHERE status = 'walking'
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error checking walking dogs', err);
      return;
    }

    const now = new Date();

    rows.forEach((row) => {
      if (!row.currentWalkEnd) {
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const endDate = new Date(`${today}T${row.currentWalkEnd}:00`);

      if (now >= endDate) {
        const lastWalkTime = row.currentWalkEnd;

        db.serialize(() => {
          db.run(
            'UPDATE dogs SET status = ?, lastWalkTime = ?, currentWalkEnd = NULL WHERE id = ?',
            ['completed', lastWalkTime, row.dogId],
            (updateErr) => {
              if (updateErr) {
                console.error('Error auto-completing walk', updateErr);
              }
            }
          );

          db.run(
            `UPDATE reservations
             SET status = 'completed', walk_end_time = ?, completed_by = 'auto'
             WHERE id = (
               SELECT MAX(id) FROM reservations WHERE dog_id = ?
             )`,
            [lastWalkTime, row.dogId],
            (resErr) => {
              if (resErr) {
                console.error('Error auto-updating reservation status', resErr);
              }
            }
          );
        });
      }
    });
  });

  // 날짜가 바뀐 뒤에도 'completed'로 남아 있는 강아지들은 목록에서 자동 제거
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

  db.all(clearSql, (err, rows) => {
    if (err) {
      console.error('Error checking completed dogs for reset', err);
      return;
    }

    rows.forEach((row) => {
      if (row.date < today) {
        db.run(
          'UPDATE dogs SET status = ?, lastWalkTime = NULL, currentWalkEnd = NULL WHERE id = ?',
          ['available', row.dogId],
          (updateErr) => {
            if (updateErr) {
              console.error('Error resetting old completed dog', updateErr);
            }
          }
        );
      }
    });
  });
};

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
  checkAndCompleteWalks();
  setInterval(checkAndCompleteWalks, 60 * 1000);
});

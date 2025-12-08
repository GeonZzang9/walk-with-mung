const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'walkwithmung.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS dogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      breed TEXT NOT NULL,
      age INTEGER NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      lastWalkTime TEXT,
      currentWalkEnd TEXT,
      image TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dog_id) REFERENCES dogs(id)
    )
  `);

  db.run(
    "ALTER TABLE reservations ADD COLUMN status TEXT NOT NULL DEFAULT 'reserved'",
    (alterErr) => {
      if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
        console.error('Failed to alter reservations table', alterErr);
      }
    }
  );

  db.run(
    "ALTER TABLE reservations ADD COLUMN reserver_name TEXT",
    (alterErr) => {
      if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
        console.error('Failed to alter reservations table (reserver_name)', alterErr);
      }
    }
  );

  db.run(
    "ALTER TABLE reservations ADD COLUMN reserver_phone TEXT",
    (alterErr) => {
      if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
        console.error('Failed to alter reservations table (reserver_phone)', alterErr);
      }
    }
  );

  db.run(
    "ALTER TABLE reservations ADD COLUMN walk_start_time TEXT",
    (alterErr) => {
      if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
        console.error('Failed to alter reservations table (walk_start_time)', alterErr);
      }
    }
  );

  db.run(
    "ALTER TABLE reservations ADD COLUMN walk_end_time TEXT",
    (alterErr) => {
      if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
        console.error('Failed to alter reservations table (walk_end_time)', alterErr);
      }
    }
  );

  db.run(
    "ALTER TABLE reservations ADD COLUMN completed_by TEXT",
    (alterErr) => {
      if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
        console.error('Failed to alter reservations table (completed_by)', alterErr);
      }
    }
  );

  db.get('SELECT COUNT(*) AS count FROM dogs', (err, row) => {
    if (err) {
      console.error('Failed to count dogs', err);
      return;
    }

    if (row && row.count === 0) {
      const insert = db.prepare(`
    INSERT INTO dogs (name, breed, age, description, status, lastWalkTime, currentWalkEnd, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

      // 여기부터 insert.run(...) 들을 전부 교체
      insert.run(
        '초코',
        '믹스',
        3,
        '활발하고 사람을 좋아하는 친구',
        'available',
        null,
        null,
        '🐶'
      );

      insert.run(
        '바둑이',
        '진돗개',
        5,
        '차분하고 산책을 좋아해요',
        'available',
        null,
        null,
        '🐕'
      );

      insert.run(
        '뽀미',
        '포메라니안',
        2,
        '귀엽고 애교가 많아요',
        'available',
        null,
        null,
        '🦊'
      );

      insert.run(
        '망고',
        '리트리버',
        4,
        '순하고 똑똑한 친구',
        'available',
        null,
        null,
        '🐕‍🦺'
      );

      insert.run(
        '구름',
        '스피츠',
        1,
        '호기심 많은 아가',
        'available',
        null,
        null,
        '☁️'
      );

      insert.run(
        '호두',
        '푸들',
        6,
        '명랑한 산책 파트너',
        'available',
        null,
        null,
        '🐩'
      );

      insert.run(
        '밤톨',
        '닥스훈트',
        4,
        '간식에 진심인 친구',
        'available',
        null,
        null,
        '🌰'
      );

      insert.run(
        '코코',
        '코카스파니엘',
        3,
        '물놀이를 좋아해요',
        'available',
        null,
        null,
        '🐶'
      );

      insert.run(
        '라떼',
        '말티즈',
        2,
        '사람 품을 좋아하는 아가',
        'available',
        null,
        null,
        '🥛'
      );

      insert.run(
        '츄러스',
        '골든리트리버',
        5,
        '덩치는 크지만 마음은 여려요',
        'available',
        null,
        null,
        '🦴'
      );

      insert.run(
        '두부',
        '믹스',
        3,
        '새 친구를 잘 받아주는 타입',
        'available',
        null,
        null,
        '🧀'
      );

      insert.run(
        '보리',
        '비글',
        2,
        '에너지가 넘치는 장난꾸러기',
        'available',
        null,
        null,
        '🌾'
      );

      insert.run(
        '밀키',
        '사모예드',
        4,
        '웃는 얼굴이 매력적인 친구',
        'available',
        null,
        null,
        '🤍'
      );

      insert.run(
        '사랑이',
        '믹스',
        7,
        '천천히 걷는 걸 좋아해요',
        'available',
        null,
        null,
        '❤️'
      );

      insert.run(
        '초롱이',
        '진돗개',
        5,
        '눈빛이 또렷한 경계견 스타일',
        'available',
        null,
        null,
        '✨'
      );

      insert.run(
        '푸딩',
        '시츄',
        3,
        '쓰다듬어 주면 바로 배 까는 타입',
        'available',
        null,
        null,
        '🍮'
      );

      insert.run(
        '단추',
        '치와와',
        2,
        '작지만 존재감은 큰 친구',
        'available',
        null,
        null,
        '🧵'
      );

      insert.run(
        '하늘',
        '보더콜리',
        4,
        '똑똑하고 집중력이 좋아요',
        'available',
        null,
        null,
        '🌤️'
      );

      insert.run(
        '벨라',
        '시베리안 허스키',
        5,
        '산책 코스를 리드하는 스타일',
        'available',
        null,
        null,
        '🐺'
      );

      insert.run(
        '루피',
        '웰시코기',
        3,
        '통통한 엉덩이가 매력 포인트',
        'available',
        null,
        null,
        '🐕'
      );

      insert.finalize();
    }

  });
});

module.exports = db;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 기본 테스트 라우트
app.get('/', (req, res) => {
    res.send('Walk With Mung Backend Running');
});

// 예: 모든 강아지 목록 조회 API
app.get('/dogs', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM dogs");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

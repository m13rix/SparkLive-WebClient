// Установите зависимости перед запуском:
// npm init -y
// npm install express

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Раздача статических файлов (CSS, JS, изображения) из папки client
// Файлы будут доступны по своим оригинальным путям, например: /style.css, /script.js и т.п.
app.use(express.static(path.join(__dirname, 'client')));

// Отдаём клиентский HTML при обращении к корню
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'client.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}. Откройте http://localhost:${PORT}`);
});

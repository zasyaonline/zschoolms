import express from 'express';

const app = express();
const PORT = 5002;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Hello from test server!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

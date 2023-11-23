import app from '../../app';
module.exports = app;

app.get('/audio', async (req, res) => {
  return res.status(201).json();
});

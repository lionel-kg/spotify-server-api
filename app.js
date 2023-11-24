import 'dotenv/config';
// import './config/database/connect';
import express from 'express';

const app = express();
app.use(express.json());

// Logic goes here

export default app;

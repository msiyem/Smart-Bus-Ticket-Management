import dotenv from 'dotenv';
import app from './src/app.js';
import { runDailyTripGeneration } from './src/jobs/index.js';

dotenv.config();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  runDailyTripGeneration().catch((err) => {
    console.error('[trip-gen] startup failed:', err);
  });
});
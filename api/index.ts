import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fetchAndStoreData } from './cwaService.js';
import { getWeatherData } from './supabase.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get weather data API
app.get('/api/weather', async (req, res) => {
  try {
    const { stationId } = req.query;
    const data = await getWeatherData(stationId as string);
    res.json(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Trigger a manual sync
app.post('/api/sync', async (req, res) => {
  try {
    await fetchAndStoreData();
    res.json({ message: 'Sync complete' });
  } catch (error) {
    console.error('Error syncing data:', error);
    res.status(500).json({ error: 'Failed to sync weather data' });
  }
});

// Schedule data sync every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly weather data sync...');
  try {
    await fetchAndStoreData();
    console.log('Hourly sync successful.');
  } catch (error) {
    console.error('Hourly sync failed:', error);
  }
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;


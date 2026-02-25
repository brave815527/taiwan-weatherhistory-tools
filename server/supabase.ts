import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_')) {
    console.warn('⚠️ Missing or placeholder Supabase URL or Key in .env. Database operations will fail.');
}

// Ensure error does not happen during initialization if we just want to run frontend without DB
export const supabase = (supabaseUrl && !supabaseUrl.includes('YOUR_'))
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function getWeatherData(stationId?: string) {
    if (!supabase) throw new Error('Supabase client not initialized');

    let query = supabase
        .from('weather_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(720);

    if (stationId) {
        query = query.eq('station_id', stationId);
    }

    const { data, error } = await query;
    if (error) {
        throw error;
    }

    // Format data for the frontend
    return data.map((d: any) => ({
        date: d.date,
        avgTemp: d.avg_temp,
        minTemp: d.min_temp,
        maxTemp: d.max_temp,
        precipitation: d.precipitation,
        humidity: d.humidity,
        windSpeed: d.wind_speed,
        wind_dir: d.wind_dir,
        pressure: d.pressure,
        sunshine: d.sunshine,
        condition: d.condition,
    }));
}

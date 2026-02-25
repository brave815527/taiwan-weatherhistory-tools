import axios from 'axios';
import { supabase } from './supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const CWA_API_TOKEN = process.env.CWA_API_TOKEN;
const API_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/C-B0024-001';

// We parse the CWA condition into one of 4 defined states from the UI
const getConditionEnum = (weatherDesc: string) => {
    if (weatherDesc.includes('雨')) {
        if (weatherDesc.includes('大雨') || weatherDesc.includes('豪雨') || weatherDesc.includes('雷')) return 'Stormy';
        return 'Rainy';
    }
    if (weatherDesc.includes('雲') || weatherDesc.includes('陰')) return 'Cloudy';
    return 'Sunny'; // Default fallback
};

const WIND_DIR_MAP: Record<string, number> = {
    '北,N': 0, '北北東,NNE': 22.5, '東北,NE': 45, '東北東,ENE': 67.5,
    '東,E': 90, '東南東,ESE': 112.5, '東南,SE': 135, '南南東,SSE': 157.5,
    '南,S': 180, '南南西,SSW': 202.5, '西南,SW': 225, '西南西,WSW': 247.5,
    '西,W': 270, '西北西,WNW': 292.5, '西北,NW': 315, '北北西,NNW': 337.5
};

export async function fetchAndStoreData() {
    if (!supabase) {
        console.error('Supabase not initialized, skipping fetchAndStoreData');
        return;
    }

    if (!CWA_API_TOKEN) {
        console.error('Missing CWA API TOKEN');
        return;
    }

    try {
        // Adjust to Taiwan Time (UTC+8) for API parameters
        const now = new Date();
        const taipeiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const timeFrom = new Date(taipeiTime.getTime() - 30 * 24 * 60 * 60 * 1000);

        const response = await axios.get(API_URL, {
            params: {
                Authorization: CWA_API_TOKEN,
                format: 'JSON',
                timeFrom: timeFrom.toISOString().split('.')[0],
                timeTo: taipeiTime.toISOString().split('.')[0]
            }
        });

        const locations = response.data?.records?.location || [];
        const weatherDataToInsert = [];

        for (const loc of locations) {
            const stationId = loc.station?.StationID || loc.stationId;
            const obsData = loc.stationObsTimes?.stationObsTime || [];

            for (const hr of obsData) {
                if (!hr.DateTime) continue;
                const obsTime = hr.DateTime; // Format like 2026-02-23T02:00:00+08:00

                if (hr.weatherElements) {
                    const parseValue = (val: string | number | undefined) => {
                        if (val === undefined || val === null) return 0;
                        const num = typeof val === 'string' ? parseFloat(val) : val;
                        return (isNaN(num) || num < -90) ? null : num; // Use null for invalid/calm to avoid skewing charts to 0
                    };

                    const parseWindDir = (val: string | number | undefined) => {
                        if (typeof val === 'string') {
                            if (val === 'X,X') return null; // Calm wind or invalid
                            if (WIND_DIR_MAP[val] !== undefined) return WIND_DIR_MAP[val];
                        }
                        return parseValue(val);
                    };

                    const el = hr.weatherElements;
                    const humidity = parseValue(el.RelativeHumidity);
                    const pcp = parseValue(el.Precipitation);
                    const windSpeed = parseValue(el.WindSpeed);
                    const windDir = parseWindDir(el.WindDirection);
                    const pressure = parseValue(el.AirPressure);
                    const temp = parseValue(el.AirTemperature);
                    const sunshine = parseValue(el.SunshineDuration);

                    let conditionDesc = 'Sunny';
                    if (pcp > 10) conditionDesc = 'Stormy';
                    else if (pcp > 0) conditionDesc = 'Rainy';
                    else if (humidity > 80) conditionDesc = 'Cloudy';

                    weatherDataToInsert.push({
                        station_id: stationId,
                        date: obsTime, // Store the raw hourly timestamp into the 'date' column
                        avg_temp: temp,
                        min_temp: temp,
                        max_temp: temp,
                        precipitation: pcp,
                        humidity: humidity,
                        wind_speed: windSpeed,
                        wind_dir: windDir,
                        pressure: pressure,
                        sunshine: sunshine,
                        condition: conditionDesc
                    });
                }
            }
        }

        // Upsert into Supabase in chunks to handle ~12,000 hourly rows
        if (weatherDataToInsert.length > 0) {
            const chunkSize = 1000;
            let successCount = 0;
            for (let i = 0; i < weatherDataToInsert.length; i += chunkSize) {
                const chunk = weatherDataToInsert.slice(i, i + chunkSize);
                const { error } = await supabase
                    .from('weather_data')
                    .upsert(chunk, { onConflict: 'station_id, date' });

                if (error) {
                    console.error('Supabase Upsert Error:', error);
                } else {
                    successCount += chunk.length;
                }
            }
            console.log(`Inserted ${successCount} hourly records successfully.`);
        }
    } catch (error) {
        console.error('Failed to fetch from CWA API:', error);
        throw error;
    }
}

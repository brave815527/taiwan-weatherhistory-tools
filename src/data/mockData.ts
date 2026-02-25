import { WeatherData } from '../types';

export const generateMockData = (): WeatherData[] => {
  const data: WeatherData[] = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    const avgTemp = 22 + Math.random() * 5;
    data.push({
      date: date.toISOString().split('T')[0],
      avgTemp: parseFloat(avgTemp.toFixed(1)),
      minTemp: parseFloat((avgTemp - 2 - Math.random() * 2).toFixed(1)),
      maxTemp: parseFloat((avgTemp + 2 + Math.random() * 2).toFixed(1)),
      precipitation: Math.random() > 0.7 ? Math.random() * 25 : 0,
      humidity: 65 + Math.random() * 20,
      windSpeed: 10 + Math.random() * 10,
      pressure: 1010 + Math.random() * 10,
      condition: ['Sunny', 'Rainy', 'Cloudy', 'Stormy'][Math.floor(Math.random() * 4)] as any,
    });
  }
  return data;
};

export const MOCK_WEATHER_DATA = generateMockData();

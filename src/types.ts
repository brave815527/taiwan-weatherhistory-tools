export interface WeatherData {
  date: string;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  condition: 'Sunny' | 'Rainy' | 'Cloudy' | 'Stormy';
}

export interface StatItem {
  label: string;
  value: string | number;
  unit: string;
  trend: number;
  icon: string;
  color: string;
  description: string;
}

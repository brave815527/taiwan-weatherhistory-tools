/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sun,
  Search,
  Bell,
  Settings,
  MapPin,
  Calendar,
  Download,
  Share2,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  ChevronLeft,
  ChevronRight,
  Filter,
  Menu,
  X,
  Compass,
  SunMedium
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import { MOCK_WEATHER_DATA } from './data/mockData';

const STATIONS = [
  { id: '466881', name: '新北', x: 62.5, y: 18.5 },
  { id: '466900', name: '淡水', x: 59.5, y: 13.9 },
  { id: '466910', name: '鞍部', x: 60.5, y: 13.5 },
  { id: '466920', name: '臺北', x: 60.6, y: 17.1 },
  { id: '466930', name: '竹子湖', x: 61.1, y: 13.8 },
  { id: '466940', name: '基隆', x: 64.5, y: 14.7 },
  { id: '466950', name: '彭佳嶼', x: 70.3, y: 2.0 },
  { id: '466990', name: '花蓮', x: 62.3, y: 44.3 },
  { id: '467050', name: '新屋', x: 52.4, y: 18.2 },
  { id: '467080', name: '宜蘭', x: 64.8, y: 24.1 },
  { id: '467110', name: '金門', x: 5.2, y: 32.6 },
  { id: '467350', name: '澎湖', x: 27.1, y: 54.8 },
  { id: '467410', name: '臺南', x: 38.1, y: 69.5 },
  { id: '467440', name: '高雄', x: 40.0, y: 80.4 },
  { id: '467480', name: '嘉義', x: 42.0, y: 56.6 },
  { id: '467490', name: '臺中', x: 46.4, y: 40.0 },
  { id: '467590', name: '恆春', x: 47.4, y: 94.8 },
  { id: '467660', name: '臺東', x: 54.4, y: 75.6 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');
  const [activeStation, setActiveStation] = useState('466920');
  const [selectedMetrics, setSelectedMetrics] = useState(['temp', 'rain']);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [showExtremes, setShowExtremes] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/weather?stationId=${activeStation}`);
        if (response.ok) {
          const data = await response.json();
          // If the backend has no data, it returns an empty array.
          setWeatherData(Array.isArray(data) && data.length > 0 ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch from backend', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeather();
  }, [activeStation]);

  const displayData = weatherData.length > 0 ? weatherData : MOCK_WEATHER_DATA;

  // Derive charts array
  const rawChartData = [...displayData].reverse();
  const availableDates = Array.from(new Set(rawChartData.map(d => {
    try {
      const date = new Date(d.date);
      if (isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch (e) { return ''; }
  }))).filter(Boolean).sort((a, b) => b.localeCompare(a));

  const chartData = selectedDate === 'all'
    ? rawChartData
    : rawChartData.filter(d => {
      try {
        const date = new Date(d.date);
        const localStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return localStr === selectedDate;
      } catch (e) { return false; }
    });

  const baseTableData = [...chartData].reverse();

  const extremeData = Array.from(new Set(baseTableData.map(d => { try { return d.date.split('T')[0] } catch (e) { return '' } }).filter(Boolean))).map(dateStr => {
    const dayData = baseTableData.filter(d => d.date.startsWith(dateStr));
    const maxTemp = Math.max(...dayData.map(d => d.avgTemp || -999));
    const minTemp = Math.min(...dayData.map(d => d.avgTemp || 999));
    const maxWind = Math.max(...dayData.map(d => d.windSpeed || 0));
    return {
      date: dateStr,
      maxTemp: maxTemp === -999 ? '-' : maxTemp.toFixed(1),
      minTemp: minTemp === 999 ? '-' : minTemp.toFixed(1),
      maxWindSpeed: maxWind.toFixed(1)
    };
  });

  const activeTableData = showExtremes ? extremeData : baseTableData;
  const itemsPerPage = showExtremes ? 10 : 24;
  const totalPages = Math.ceil(activeTableData.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = activeTableData.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const currentAvgTemp = chartData.length ? (chartData.reduce((a, b) => a + (b.avgTemp || 0), 0) / chartData.length).toFixed(1) : '0';
  const totalRain = chartData.length ? chartData.reduce((a, b) => a + (b.precipitation || 0), 0).toFixed(1) : '0';
  const currentAvgHum = chartData.length ? (chartData.reduce((a, b) => a + parseFloat(b.humidity || '0'), 0) / chartData.length).toFixed(1) : '0';
  const currentAvgWind = chartData.length ? (chartData.reduce((a, b) => a + parseFloat(b.windSpeed || '0'), 0) / chartData.length).toFixed(1) : '0';

  const validWindDirs = chartData.filter(d => d.wind_dir != null);
  const currentAvgWindDir = validWindDirs.length
    ? ((Math.atan2(
      validWindDirs.reduce((a, b) => a + Math.sin(b.wind_dir * Math.PI / 180), 0),
      validWindDirs.reduce((a, b) => a + Math.cos(b.wind_dir * Math.PI / 180), 0)
    ) * 180 / Math.PI + 360) % 360).toFixed(0)
    : '-';

  const totalSunshine = chartData.length ? chartData.reduce((a, b) => a + (b.sunshine || 0), 0).toFixed(1) : '0';

  const stats = [
    { label: '平均氣溫', value: `${currentAvgTemp}°C`, trend: 0, icon: Thermometer, color: 'text-accent-blue', bg: 'bg-accent-blue/10', desc: '篩選期間平均' },
    { label: '累積降水量', value: `${totalRain} mm`, trend: 0, icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: '篩選期間累積' },
    { label: '平均相對濕度', value: `${currentAvgHum} %`, trend: 0, icon: Droplets, color: 'text-accent-mint', bg: 'bg-accent-mint/10', desc: '篩選期間平均' },
    { label: '平均風速', value: `${currentAvgWind} m/s`, trend: 0, icon: Wind, color: 'text-indigo-400', bg: 'bg-indigo-400/10', desc: '篩選期間平均' },
    { label: '平均風向', value: currentAvgWindDir !== '-' ? `${currentAvgWindDir}°` : '-', trend: 0, icon: Compass, color: 'text-emerald-400', bg: 'bg-emerald-400/10', desc: '篩選期間平均' },
    { label: '累積日照', value: `${totalSunshine} hr`, trend: 0, icon: SunMedium, color: 'text-amber-400', bg: 'bg-amber-400/10', desc: '篩選期間累積' },
  ];

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-panel-dark px-4 md:px-6 py-3 z-50">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            className="md:hidden p-1 text-slate-300 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 md:gap-3 text-accent-blue">
            <Sun className="w-6 h-6 md:w-8 md:h-8 fill-accent-blue" />
            <h2 className="text-white text-base md:text-lg font-bold tracking-tight hidden sm:block">台灣測站歷史數據</h2>
          </div>

        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <nav className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn("text-xs md:text-sm font-semibold transition-colors border-b-2 py-1", activeTab === 'dashboard' ? "text-accent-blue border-accent-blue" : "text-slate-400 border-transparent hover:text-accent-blue")}
            >儀表板</button>
          </nav>

          <div className="w-10 h-10 rounded-full border border-accent-blue/30 overflow-hidden bg-accent-blue/20 ml-2">
            <img
              src="https://picsum.photos/seed/weather-user/100/100"
              alt="User"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "absolute md:relative z-50 inset-y-0 left-0 w-64 bg-panel-dark border-r border-slate-800 p-4 flex flex-col gap-8 shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="flex items-center justify-between md:hidden -mb-4">
            <span className="font-bold text-slate-300">選單</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">測站選擇</h3>
            <div className="space-y-1">
              {STATIONS.map((station) => (
                <button
                  key={station.id}
                  onClick={() => setActiveStation(station.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeStation === station.id
                      ? "sidebar-item-active text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <MapPin className={cn("w-4 h-4", activeStation === station.id ? "text-accent-blue" : "text-slate-500")} />
                  <span>{station.name} ({station.id})</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        {activeTab === 'map' ? (
          <main className="flex-1 overflow-hidden relative bg-bg-dark flex items-center justify-center p-3 md:p-8">
            <div className="w-full max-w-4xl h-full max-h-[80vh] md:max-h-none aspect-[3/4] md:aspect-auto relative">
              <div className="absolute inset-0 md:inset-4 rounded-3xl border border-slate-800/80 bg-panel-dark/50 shadow-2xl p-4 md:p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 z-10 shrink-0">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">台灣測站分布圖</h2>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">點擊地圖上的測站節點進入。</p>
                  </div>
                </div>
                <div className="relative w-full flex-1 mt-4 border border-slate-800/50 rounded-2xl bg-slate-900/50">
                  <img src="/taiwan.svg" className="absolute inset-0 w-full h-full object-fill pointer-events-none" alt="台灣縣市輪廓" />
                  {/* Map nodes */}
                  {STATIONS.map((station) => (
                    <motion.button
                      key={station.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: Math.random() * 0.3 }}
                      whileHover={{ scale: 1.1, zIndex: 50 }}
                      onClick={() => {
                        setActiveStation(station.id);
                        setActiveTab('dashboard');
                        setIsSidebarOpen(false);
                      }}
                      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group outline-none"
                      style={{ left: `${station.x}%`, top: `${station.y}%` }}
                    >
                      <div className="relative">
                        {activeStation === station.id && (
                          <span className="absolute -inset-3 rounded-full bg-accent-blue/30 animate-ping" />
                        )}
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all shadow-lg flex items-center justify-center",
                          activeStation === station.id
                            ? "bg-accent-blue border-white shadow-accent-blue/50 scale-110"
                            : "bg-slate-800 border-slate-400 group-hover:bg-accent-mint group-hover:border-white shadow-black/50"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", activeStation === station.id ? "bg-white" : "bg-transparent")} />
                        </div>
                      </div>
                      <span className={cn(
                        "mt-2 text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded shadow-xl backdrop-blur-md transition-all",
                        activeStation === station.id
                          ? "text-white bg-accent-blue border border-accent-blue"
                          : "text-slate-300 bg-slate-900/90 border border-slate-700 opacity-60 group-hover:opacity-100 group-hover:border-slate-500 group-hover:text-white group-hover:-translate-y-1"
                      )}>
                        {station.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Page Title Section */}
            <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4 md:gap-6">
              <div className="space-y-1 w-full">
                <nav className="flex gap-2 text-xs font-medium text-slate-500 mb-2">
                  <span>氣象觀測資料</span>
                  <span>/</span>
                  <span className="text-accent-blue">{STATIONS.find(s => s.id === activeStation)?.name}測站</span>
                </nav>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{STATIONS.find(s => s.id === activeStation)?.name}測站數據檢視</h1>
                <p className="text-sm md:text-base text-slate-400">觀測期間：{selectedDate === 'all' ? '近 30 天歷史數據' : `${selectedDate} 逐時紀錄`}</p>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 w-full xl:w-auto">
                <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none outline-none cursor-pointer text-slate-200 font-medium"
                  >
                    <option value="all">近 30 天全部</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <span className="text-slate-400 text-xs md:text-sm font-medium">{stat.label}</span>
                    <div className={cn("p-1.5 md:p-2 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("w-4 h-4 md:w-5 md:h-5", stat.color)} />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-baseline gap-1 md:gap-2">
                    <span className="text-xl md:text-3xl font-bold text-white leading-tight">{stat.value}</span>
                    {stat.trend !== 0 && (
                      <span className={cn(
                        "text-sm font-bold flex items-center",
                        stat.trend > 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{stat.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
              {/* Temperature Trend Chart */}
              <div className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-200 text-sm md:text-base">氣溫趨勢圖 (°C)</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_8px_#38bdf8]" />
                      <span className="text-xs text-slate-400">平均氣溫</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            if (isNaN(date.getTime())) return str;
                            return selectedDate === 'all'
                              ? `${date.getMonth() + 1}/${date.getDate()}`
                              : `${date.getHours().toString().padStart(2, '0')}:00`;
                          } catch (e) { return str; }
                        }}
                        minTickGap={30}
                      />
                      <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgTemp"
                        stroke="#38bdf8"
                        strokeWidth={3}
                        dot={false}
                        className="glow-blue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Precipitation Chart */}
              <div className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-200 text-sm md:text-base">每日降水量 (mm)</h3>
                  <span className="text-xs text-slate-500">
                    期間最大：{chartData.length ? Math.max(...chartData.map(d => d.precipitation || 0)).toFixed(1) : '0'} mm
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            if (isNaN(date.getTime())) return str;
                            return selectedDate === 'all'
                              ? `${date.getMonth() + 1}/${date.getDate()}`
                              : `${date.getHours().toString().padStart(2, '0')}:00`;
                          } catch (e) { return str; }
                        }}
                        minTickGap={30}
                      />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #334155', borderRadius: '8px' }}
                        cursor={{ fill: '#1e293b' }}
                      />
                      <Bar dataKey="precipitation" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.precipitation > 15 ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Wind Speed Chart */}
              <div className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-200 text-sm md:text-base">平均風速 (m/s)</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            if (isNaN(date.getTime())) return str;
                            return selectedDate === 'all'
                              ? `${date.getMonth() + 1}/${date.getDate()}`
                              : `${date.getHours().toString().padStart(2, '0')}:00`;
                          } catch (e) { return str; }
                        }}
                        minTickGap={30}
                      />
                      <YAxis stroke="#64748b" fontSize={10} domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="windSpeed"
                        stroke="#c084fc"
                        strokeWidth={3}
                        dot={false}
                        className="glow-purple"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pressure Chart */}
              <div className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-200 text-sm md:text-base">測站氣壓 (hPa)</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            if (isNaN(date.getTime())) return str;
                            return selectedDate === 'all'
                              ? `${date.getMonth() + 1}/${date.getDate()}`
                              : `${date.getHours().toString().padStart(2, '0')}:00`;
                          } catch (e) { return str; }
                        }}
                        minTickGap={30}
                      />
                      <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pressure"
                        stroke="#818cf8"
                        strokeWidth={3}
                        dot={false}
                        className="glow-indigo"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sunshine Duration Chart */}
              <div className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-200 text-sm md:text-base">日照時數 (小時)</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            if (isNaN(date.getTime())) return str;
                            return selectedDate === 'all'
                              ? `${date.getMonth() + 1}/${date.getDate()}`
                              : `${date.getHours().toString().padStart(2, '0')}:00`;
                          } catch (e) { return str; }
                        }}
                        minTickGap={30}
                      />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #334155', borderRadius: '8px' }}
                        cursor={{ fill: '#1e293b' }}
                      />
                      <Bar dataKey="sunshine" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Wind Direction Chart */}
              <div className="bg-panel-dark p-4 md:p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-200 text-sm md:text-base">風向 (度)</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            if (isNaN(date.getTime())) return str;
                            return selectedDate === 'all'
                              ? `${date.getMonth() + 1}/${date.getDate()}`
                              : `${date.getHours().toString().padStart(2, '0')}:00`;
                          } catch (e) { return str; }
                        }}
                        minTickGap={30}
                      />
                      <YAxis stroke="#64748b" fontSize={10} domain={[0, 360]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wind_dir"
                        stroke="#10b981"
                        strokeWidth={0}
                        dot={{ r: 4, fill: '#10b981', stroke: 'none' }}
                        activeDot={{ r: 6 }}
                        isAnimationActive={false}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-panel-dark rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="font-bold text-slate-200 text-sm md:text-base">觀測數據</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { setShowExtremes(false); setCurrentPage(1); }}
                    className={cn("flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", !showExtremes ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white")}
                  >
                    顯示全部
                  </button>
                  <button
                    onClick={() => { setShowExtremes(true); setCurrentPage(1); }}
                    className={cn("flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", showExtremes ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white")}
                  >
                    僅顯極端值
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">{showExtremes ? '日期' : '時間'}</th>
                      {showExtremes ? (
                        <>
                          <th className="px-6 py-4">每日最高溫 (°C)</th>
                          <th className="px-6 py-4">每日最低溫 (°C)</th>
                          <th className="px-6 py-4">最大風速 (m/s)</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4">平均氣溫 (°C)</th>
                          <th className="px-6 py-4">平均風速 (m/s)</th>
                          <th className="px-6 py-4">風向 (度)</th>
                          <th className="px-6 py-4">測站氣壓 (hPa)</th>
                          <th className="px-6 py-4">日照時數 (hr)</th>
                          <th className="px-6 py-4">天氣概況</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paginatedData.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-slate-200">
                          {(() => {
                            if (showExtremes) return row.date.substring(0, 10);
                            try {
                              const d = new Date(row.date);
                              return isNaN(d.getTime()) ? row.date : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
                            } catch (e) { return row.date; }
                          })()}
                        </td>
                        {showExtremes ? (
                          <>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.maxTemp}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.minTemp}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.maxWindSpeed}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.avgTemp}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{Number(row.windSpeed).toFixed(1)}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.wind_dir !== null && row.wind_dir !== undefined ? row.wind_dir : '-'}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{Number(row.pressure).toFixed(1)}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.sunshine !== null && row.sunshine !== undefined ? row.sunshine : '-'}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2.5 py-1 text-xs font-bold rounded-full border",
                                row.condition === 'Sunny' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  row.condition === 'Rainy' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    row.condition === 'Stormy' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                      "bg-slate-700/50 text-slate-400 border-slate-700"
                              )}>
                                {row.condition === 'Sunny' ? '晴朗' :
                                  row.condition === 'Rainy' ? '局部陣雨' :
                                    row.condition === 'Stormy' ? '大雨特報' : '多雲'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-900/30 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  顯示 {(safeCurrentPage - 1) * itemsPerPage + 1}-{Math.min(safeCurrentPage * itemsPerPage, activeTableData.length)} 筆 (共 {activeTableData.length} 筆)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1 || activeTableData.length === 0}
                    className="p-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages || activeTableData.length === 0}
                    className="p-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

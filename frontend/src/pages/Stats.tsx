import { useEffect, useMemo, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { Header } from '../components/Header';
import { PlaybackControlBar } from '../components/playback/PlaybackControlBar';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { TopTrack } from '../types';
import { API_BASE_URL } from '../config';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
);

type Counts = {
  numSongs: number;
  numAlbums: number;
  numPlaylists: number;
};

type SeriesPoint = {
  label: string;
  value: number;
};

type GenreBreakdown = {
  uniqueGenres: number;
  genres: SeriesPoint[];
};

type DateUploadedPoint = {
  date: string;
  count: number;
};

type RangeKey = 'day' | 'week' | 'month';

const listenRangeMeta: Record<RangeKey, { title: string; endpoint: string }> = {
  day: { title: 'Daily', endpoint: '/api/stats/listens/day' },
  week: { title: 'Weekly', endpoint: '/api/stats/listens/week' },
  month: { title: 'Monthly', endpoint: '/api/stats/listens/month' },
};

const chartTextColor = '#f8fafc';
const chartGridColor = 'rgba(255, 255, 255, 0.16)';
const palette = [
  '#f97316',
  '#fb7185',
  '#38bdf8',
  '#34d399',
  '#facc15',
  '#a78bfa',
  '#f472b6',
  '#22c55e',
  '#60a5fa',
  '#f59e0b',
];

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: chartTextColor,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: chartTextColor },
      grid: { color: chartGridColor },
    },
    y: {
      ticks: { color: chartTextColor },
      grid: { color: chartGridColor },
      beginAtZero: true,
    },
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: chartTextColor,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: chartTextColor },
      grid: { color: chartGridColor },
    },
    y: {
      ticks: { color: chartTextColor },
      grid: { color: chartGridColor },
      beginAtZero: true,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: chartTextColor,
        font: {
          size: 16,
        },
      },

    },
  },
};

export default function Stats() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [genres, setGenres] = useState<GenreBreakdown | null>(null);
  const [dailySeries, setDailySeries] = useState<SeriesPoint[]>([]);
  const [weeklySeries, setWeeklySeries] = useState<SeriesPoint[]>([]);
  const [monthlySeries, setMonthlySeries] = useState<SeriesPoint[]>([]);
  const [listeningTrend, setListeningTrend] = useState<SeriesPoint[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>('week');
  const [loading, setLoading] = useState(true);
  const [uploadSeries, setUploadSeries] = useState<SeriesPoint[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);


  const getCoverImage = (path?: string | null) => {
    if (!path) return '/defaultAlbum.png';
    const file = path.split('/').pop();
    return `${API_BASE_URL}/assets/${file}`;
  };

  const openNav = () => {
    setIsNavOpen(true);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  useEffect(() => {
    const fetchJson = async <T,>(path: string): Promise<T> => {
      const response = await fetch(`${API_BASE_URL}${path}`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status} for ${path}`);
      }

      return response.json() as Promise<T>;
    };

    const loadStats = async () => {
      try {
        const [summary, genreData, dailyData, weeklyData, monthlyData, trendData, uploadData, topTracksData] = await Promise.all([
          fetchJson<Counts>('/api/stats/summary'),
          fetchJson<GenreBreakdown>('/api/stats/genres'),
          fetchJson<SeriesPoint[]>('/api/stats/listens/day'),
          fetchJson<SeriesPoint[]>('/api/stats/listens/week'),
          fetchJson<SeriesPoint[]>('/api/stats/listens/month'),
          fetchJson<SeriesPoint[]>('/api/stats/listening-time'),
          fetchJson<DateUploadedPoint[]>('/api/stats/date-uploaded'),
          fetchJson<TopTrack[]>('/api/stats/top-tracks'),
        ]);

        setCounts(summary);
        setGenres(genreData);
        setDailySeries(dailyData);
        setWeeklySeries(weeklyData);
        setMonthlySeries(monthlyData);
        setListeningTrend(trendData);
        setUploadSeries(uploadData.map((point) => ({ label: point.date, value: point.count })));
        setTopTracks(topTracksData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const selectedSeries = useMemo(() => {
    if (selectedRange === 'day') {
      return dailySeries;
    }

    if (selectedRange === 'month') {
      return monthlySeries;
    }

    return weeklySeries;
  }, [dailySeries, monthlySeries, selectedRange, weeklySeries]);

  const listenChartData = useMemo(() => ({
    labels: selectedSeries.map((point) => point.label),
    datasets: [
      {
        label: `${listenRangeMeta[selectedRange].title} listens`,
        data: selectedSeries.map((point) => point.value),
        backgroundColor: 'rgba(249, 115, 22, 0.75)',
        borderColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderRadius: 12,
      },
    ],
  }), [selectedRange, selectedSeries]);

  const genreChartData = useMemo(() => ({
    labels: genres?.genres.map((genre) => genre.label) ?? [],
    datasets: [
      {
        label: 'Tracks',
        data: genres?.genres.map((genre) => genre.value) ?? [],
        backgroundColor: (genres?.genres ?? []).map((_, index) => palette[index % palette.length]),
        borderColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 2,
      },
    ],
  }), [genres]);

  const listeningTrendData = useMemo(() => ({
    labels: listeningTrend.map((point) => point.label),
    datasets: [
      {
        label: 'Listening time (minutes)',
        data: listeningTrend.map((point) => point.value),
        borderColor: '#fb923c',
        backgroundColor: 'rgba(251, 146, 60, 0.16)',
        pointBackgroundColor: '#f8fafc',
        pointBorderColor: '#fb923c',
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  }), [listeningTrend]);

  const uploadChartData = useMemo(() => ({
    labels: uploadSeries.map((point) => point.label),
    datasets: [
      {
        label: 'Tracks uploaded',
        data: uploadSeries.map((point) => point.value),
        backgroundColor: 'rgba(251, 146, 60, 0.85)',
        borderColor: 'rgba(251, 146, 60, 0.85)',
        borderWidth: 8,
        borderRadius: 12,
        tension: 0.05,
      },
    ],
  }), [uploadSeries]);

  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-200 to-gray-500 font-bold transition-[padding-left] duration-300 pl-14 ${isNavOpen ? 'sm:pl-32' : 'sm:pl-16'}`}>
      <Header />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />

      <main className="relative">
        <div className="px-6 pt-6 pb-12 xl:pr-88">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-white">Stats Dashboard</h1>
            <p className="mt-2 text-sm text-white/80">Track listening activity, library shape, and long-term trends.</p>
          </div>

          <aside className="px-6 pb-8 xl:absolute xl:right-6 xl:top-22 xl:z-20 xl:w-80 xl:px-0 xl:pb-0 pt-6">
            <div className="rounded-3xl border border-white/20 bg-white/15 p-5 text-white shadow-2xl backdrop-blur-md">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/70">Library Summary</p>
                <h2 className="mt-2 text-2xl font-black">At a glance</h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Songs</p>
                  <p className="mt-1 text-2xl font-black">{counts?.numSongs ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Albums</p>
                  <p className="mt-1 text-2xl font-black">{counts?.numAlbums ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Playlists</p>
                  <p className="mt-1 text-2xl font-black">{counts?.numPlaylists ?? 0}</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-md xl:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white">Tracks uploaded over time</h2>
                <p className="text-sm text-white/70">Library growth by daily uploads</p>
              </div>

              <div className="h-80">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-white/70">Loading chart data...</div>
                ) : (
                  <Line data={uploadChartData} options={lineOptions} />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-md xl:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Songs listened to over time</h2>
                  <p className="text-sm text-white/70">Switch between day, week, and month views.</p>
                </div>
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 p-1">
                  {(Object.keys(listenRangeMeta) as RangeKey[]).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setSelectedRange(range)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${selectedRange === range ? 'bg-orange-500 text-white shadow-lg' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                    >
                      {listenRangeMeta[range].title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-white/70">Loading chart data...</div>
                ) : (
                  <Bar data={listenChartData} options={barOptions} />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-md">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white">Genre breakdown</h2>
                <p className="text-sm text-white/70">Unique genres in your library: {genres?.uniqueGenres ?? 0}</p>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-white/70">Loading chart data...</div>
                ) : (
                  <Doughnut data={genreChartData} options={doughnutOptions} />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-md">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white">Top tracks</h2>
                <p className="text-sm text-white/70">Your most-listened-to songs.</p>
              </div>
              <div className="h-80 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-white/70">Loading chart data...</div>
                ) : topTracks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-white/70 px-4">
                    Play some songs to see your top tracks here.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {topTracks.map((track, index) => (
                      <li
                        key={track.track_id}
                        className="flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2"
                      >
                        <span className="w-5 shrink-0 text-center text-sm text-white/60">{index + 1}</span>
                        <img
                          src={getCoverImage(track.cover_art_url)}
                          alt={track.title}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">{track.title}</p>
                          {track.album_title && (
                            <p className="truncate text-xs text-white/60">{track.album_title}</p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-1 text-xs font-bold text-orange-200">
                          {track.play_count} {track.play_count === 1 ? 'play' : 'plays'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-md xl:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white">Listening time trends</h2>
                <p className="text-sm text-white/70">Monthly listening minutes over the past year.</p>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-white/70">Loading chart data...</div>
                ) : (
                  <Line data={listeningTrendData} options={lineOptions} />
                )}
              </div>
            </div>
          </section>
        </div>


      </main>
      <PlaybackControlBar />
    </div>
  );
}
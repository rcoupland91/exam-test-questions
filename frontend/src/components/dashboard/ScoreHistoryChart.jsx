import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext.jsx';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0]?.value;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400">
          Score: <span className="font-semibold">{score !== null ? `${Math.round(score)}%` : '—'}</span>
        </p>
        {payload[0]?.payload?.exam_title && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate max-w-[180px]">
            {payload[0].payload.exam_title}
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function ScoreHistoryChart({ sessions }) {
  const { isDark } = useTheme();

  // Use last 10 sessions (already limited + in chronological order from API)
  const data = sessions.map((s, i) => ({
    name: formatDate(s.completed_at || s.started_at),
    score: s.score !== null ? Math.round(s.score * 10) / 10 : null,
    exam_title: s.exam_title,
    passing_score: s.passing_score || 70,
    index: i + 1,
  }));

  // Use the passing score of the most recent session as reference line
  const passingScore = data.length > 0 ? data[data.length - 1].passing_score : 70;

  const gridStroke = isDark ? '#374151' : '#e5e7eb';
  const axisTickFill = isDark ? '#9ca3af' : '#6b7280';

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: axisTickFill }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: axisTickFill }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={passingScore}
          stroke="#f59e0b"
          strokeDasharray="6 3"
          label={{
            value: `Pass: ${passingScore}%`,
            position: 'insideTopRight',
            fontSize: 11,
            fill: '#f59e0b',
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#4f46e5' }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

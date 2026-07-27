'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface VoiceData {
  voiceName: string;
  usageCount: number;
  percentage: number;
  category: string;
}

interface TimelineData {
  date: string;
  generations: number;
  duration: number;
  characters: number;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#eab308', '#22c55e', '#06b6d4'];

export const VoicePopularityChart: React.FC<{ data: VoiceData[] }> = ({ data }) => {
  // Take top 5 voices
  const chartData = data.slice(0, 5).map(v => ({
    name: v.voiceName.length > 20 ? `${v.voiceName.substring(0, 20)}...` : v.voiceName,
    Generations: v.usageCount
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-app)] rounded-xl">
        No generation data available yet.
      </div>
    );
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-app)', borderRadius: '8px', fontSize: '11px' }}
            labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)' }}
          />
          <Bar dataKey="Generations" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const VoiceDistributionChart: React.FC<{ data: VoiceData[] }> = ({ data }) => {
  // Aggregate by category
  const categoriesMap = new Map<string, number>();
  data.forEach(v => {
    const cat = v.category || 'general';
    const cleanCat = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoriesMap.set(cleanCat, (categoriesMap.get(cleanCat) || 0) + v.usageCount);
  });

  const chartData = Array.from(categoriesMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-app)] rounded-xl">
        No generation data available yet.
      </div>
    );
  }

  return (
    <div className="h-60 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
      <div className="w-full sm:w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-app)', borderRadius: '8px', fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 w-full sm:w-1/2 justify-center max-h-[180px] overflow-y-auto pr-1">
        {chartData.map((item, index) => {
          const total = chartData.reduce((sum, c) => sum + c.value, 0);
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-medium text-[var(--text-secondary)]">{item.name}</span>
              </div>
              <span className="font-bold text-[var(--text-primary)]">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GenerationTimelineChart: React.FC<{ data: TimelineData[] }> = ({ data }) => {
  // Clean data: show date as Month Day
  const chartData = data.map(d => {
    const parts = d.date.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      name: formattedDate,
      Generations: d.generations
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-app)] rounded-xl">
        No timeline data available yet.
      </div>
    );
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-app)', borderRadius: '8px', fontSize: '11px' }}
            labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)' }}
          />
          <Line type="monotone" dataKey="Generations" stroke="#8884d8" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

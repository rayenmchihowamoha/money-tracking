import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#1F6F54', '#C98A2C', '#5B6259', '#B3402E', '#7C9A87', '#8C6B3F'];

export default function WalletPieChart({ wallets }) {
  const data = wallets.map((w) => ({ name: w.name, value: Number(w.balance) })).filter((d) => d.value > 0);
  if (data.length === 0) return null;

  return (
    <div className="chart-card" style={{ marginTop: 12, height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

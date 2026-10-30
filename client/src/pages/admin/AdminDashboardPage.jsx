import { useState, useEffect } from 'react';
import { getAdminOverview } from '../../api/admin';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Store, Users, ShoppingCart, IndianRupee,
  TrendingUp, Package, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            {label}
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 800 }}>{count.toLocaleString()}</span>
      </div>
      <div style={{ height: 10, background: 'var(--bg-card)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.625rem', padding: '0.625rem 0.875rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-400)' }}>{payload[0].value} orders</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{payload[1]?.value?.toFixed(0) || 0}</div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/login');
      return;
    }
    getAdminOverview()
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!data) return null;

  const { stats, shopsTable, funnel, orderVolume } = data;
  const repeatRate = funnel.buyersWithAtLeastOne > 0
    ? ((funnel.buyersWithAtLeastTwo / funnel.buyersWithAtLeastOne) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Platform overview · SupportFlow Market</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <StatCard icon={Store} label="Total Shops" value={stats.totalShops} color="#14b88a" />
        <StatCard icon={Users} label="Total Buyers" value={stats.totalBuyers} color="#60a5fa" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders} color="#a78bfa" />
        <StatCard icon={IndianRupee} label="Order Value" value={`₹${stats.totalOrderValue.toFixed(0)}`} color="#fb923c" sub="All time" />
      </div>

      {/* Order volume chart */}
      {orderVolume.length > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--brand-400)" /> Order Volume — Last 30 Days
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={orderVolume} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b88a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b88a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#14b88a" strokeWidth={2} fill="url(#orderGrad)" />
              <Area type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={1} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 12, height: 2, background: '#14b88a', borderRadius: 1 }} /> Orders
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 12, height: 2, background: '#60a5fa', borderRadius: 1 }} /> Revenue (₹)
            </div>
          </div>
        </div>
      )}

      {/* Funnel */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          🎯 Conversion Funnel
          <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            Repeat rate: {repeatRate}%
          </span>
        </div>
        <FunnelBar label="Total Follows" count={funnel.totalFollows} max={funnel.totalFollows} color="#60a5fa" />
        <FunnelBar label="Buyers with ≥1 Order" count={funnel.buyersWithAtLeastOne} max={funnel.totalFollows} color="#14b88a" />
        <FunnelBar label="Buyers with ≥2 Orders (Repeat)" count={funnel.buyersWithAtLeastTwo} max={funnel.totalFollows} color="#a78bfa" />
      </div>

      {/* Shops table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={16} color="var(--brand-400)" /> All Shops ({shopsTable.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Shop', 'Market', 'Products', 'Orders', 'Last Updated'].map((h) => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shopsTable.map((shop) => (
                <tr key={shop._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{shop.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{shop.marketName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                      <Package size={13} /> {shop.productCount}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--brand-400)', fontWeight: 700 }}>
                      <ShoppingCart size={13} /> {shop.orderCount}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {shop.lastProductUpdate
                      ? new Date(shop.lastProductUpdate).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shopsTable.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No shops yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

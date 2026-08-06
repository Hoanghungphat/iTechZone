/**
 * pages/Admin/Dashboard/index.jsx
 * Dashboard Admin — chỉ Admin mới thấy
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowUpRight, ArrowDownRight, AlertCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getDashboard } from '@/services/adminService'
import { formatPrice } from '@/utils/format'
import useAdminStore from '@/store/useAdminStore'

// ─── Màu donut chart ───────────────────────────────
const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']

// ─── Status badge ──────────────────────────────────
const STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', cls: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Đã xác nhận',  cls: 'bg-blue-500/20 text-blue-400' },
  shipping:  { label: 'Đang giao',    cls: 'bg-indigo-500/20 text-indigo-400' },
  delivered: { label: 'Đã giao',      cls: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Đã hủy',       cls: 'bg-red-500/20 text-red-400' },
}

// ─── Stat Card ─────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg, change }) {
  const isUp = change >= 0
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-gray-900 text-xl font-black mt-0.5 truncate">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change)}% so với tuần trước
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Custom tooltip cho chart ──────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">{formatPrice(payload[0].value)}</p>
    </div>
  )
}

// ─── Custom Legend ─────────────────────────────────
function CustomLegend({ payload }) {
  return (
    <ul className="space-y-2 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span>{entry.value}</span>
          </div>
          <span className="font-semibold text-gray-800 ml-4">
            {entry.payload?.value}%
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { admin } = useAdminStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Chỉ Admin mới được vào Dashboard
  useEffect(() => {
    if (admin && admin.role !== 'admin') {
      navigate('/admin/products', { replace: true })
    }
  }, [admin, navigate])

  useEffect(() => {
    getDashboard()
      .then(r => { setStats(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (admin?.role !== 'admin') return null

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!stats) return (
    <div className="text-red-400 text-center py-20">Không tải được dữ liệu</div>
  )

  return (
    <div className="space-y-6 bg-gray-50 min-h-full -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tổng quan hệ thống ITechZone</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2">
          📅 7 ngày gần nhất
        </div>
      </div>

      {/* Alert */}
      {stats.pendingRequests > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm">
            Có <strong>{stats.pendingRequests}</strong> yêu cầu đang chờ duyệt từ nhân viên
          </p>
          <Link to="/admin/requests" className="ml-auto text-xs text-amber-600 font-semibold underline">Xem ngay →</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp} label="Doanh thu" iconBg="bg-indigo-500"
          value={formatPrice(stats.totalRevenue)}
          change={stats.changes?.revenue}
        />
        <StatCard
          icon={ShoppingBag} label="Đơn hàng" iconBg="bg-orange-400"
          value={stats.totalOrders}
          change={stats.changes?.orders}
        />
        <StatCard
          icon={Users} label="Khách hàng" iconBg="bg-rose-500"
          value={stats.totalUsers}
          change={stats.changes?.users}
        />
        <StatCard
          icon={Package} label="Sản phẩm" iconBg="bg-sky-500"
          value={stats.totalProducts}
        />
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Revenue Chart */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gray-800 font-bold">Doanh thu</h2>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
              7 ngày qua
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.revenueChart || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#revGradient)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-gray-800 font-bold">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-xs text-indigo-500 font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {stats.recentOrders.map(order => {
              const s = STATUS_MAP[order.status] || STATUS_MAP.pending
              return (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={14} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-semibold truncate">
                      #{order.id.slice(-6).toUpperCase()} · {order.user?.name}
                    </p>
                    <p className="text-gray-500 text-xs">{formatPrice(order.totalAmount)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
            {!stats.recentOrders.length && (
              <p className="text-gray-400 text-sm text-center py-10">Chưa có đơn hàng nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products + Category Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Top Products */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-bold">Sản phẩm bán chạy</h2>
            <Link to="/admin/products" className="text-xs text-indigo-500 font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>
          {/* Header row */}
          <div className="grid grid-cols-12 text-xs text-gray-400 font-medium pb-2 border-b border-gray-100 mb-1">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Sản phẩm</span>
            <span className="col-span-2 text-center">Đã bán</span>
            <span className="col-span-4 text-right">Doanh thu</span>
          </div>
          {stats.topProducts?.length > 0 ? stats.topProducts.map((p, i) => {
            const maxSold = stats.topProducts[0]?.sold || 1
            const pct = Math.round((p.sold / maxSold) * 100)
            const rankColors = ['bg-amber-400', 'bg-gray-400', 'bg-orange-600', 'bg-gray-300', 'bg-gray-300']
            return (
              <div key={i} className="grid grid-cols-12 items-center py-2.5 border-b border-gray-50 last:border-0">
                <div className="col-span-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${rankColors[i] || 'bg-gray-200'}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="col-span-5 min-w-0 pr-2">
                  <p className="text-gray-800 text-xs font-medium truncate">{p.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                    <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="col-span-2 text-center text-xs text-gray-600 font-semibold">{p.sold}</div>
                <div className="col-span-4 text-right text-xs text-indigo-600 font-bold">{formatPrice(p.revenue)}</div>
              </div>
            )
          }) : (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu bán hàng</p>
          )}
        </div>

        {/* Category Donut */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-gray-800 font-bold mb-4">Tổng quan danh mục</h2>
          {stats.categoryBreakdown?.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {stats.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full mt-1">
                {stats.categoryBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  )
}

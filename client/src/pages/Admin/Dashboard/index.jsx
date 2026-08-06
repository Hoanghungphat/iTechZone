/**
 * pages/Admin/Dashboard/index.jsx
 * Dashboard Admin — dark theme đồng bộ với sidebar
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowUpRight, ArrowDownRight, AlertCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getDashboard } from '@/services/adminService'
import { formatPrice } from '@/utils/format'
import useAdminStore from '@/store/useAdminStore'

const PIE_COLORS = ['#818cf8', '#f59e0b', '#34d399', '#38bdf8', '#fb7185']

const STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', cls: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Đã xác nhận',  cls: 'bg-blue-500/20 text-blue-400' },
  shipping:  { label: 'Đang giao',    cls: 'bg-indigo-500/20 text-indigo-400' },
  delivered: { label: 'Đã giao',      cls: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Đã hủy',       cls: 'bg-red-500/20 text-red-400' },
}

function StatCard({ icon: Icon, label, value, iconBg, change }) {
  const isUp   = change >= 0
  const isZero = change === 0
  return (
    <div className="bg-slate-800 rounded-2xl p-5 flex items-center gap-4 border border-slate-700/50">
      <div className={`w-13 h-13 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-white text-xl font-black mt-0.5 truncate">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 font-medium
            ${isZero ? 'text-slate-500' : isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {!isZero && (isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
            {isZero ? '—' : `${Math.abs(change)}%`} so với tuần trước
          </div>
        )}
      </div>
    </div>
  )
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-300 mb-1">{label}</p>
      <p className="text-indigo-300 font-bold">{formatPrice(payload[0].value)}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { admin } = useAdminStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!stats) return (
    <div className="text-red-400 text-center py-20">Không tải được dữ liệu</div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Tổng quan hệ thống ITechZone</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-1.5">
          📅 7 ngày gần nhất
        </span>
      </div>

      {/* Alert */}
      {stats.pendingRequests > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            Có <strong>{stats.pendingRequests}</strong> yêu cầu đang chờ duyệt
          </p>
          <Link to="/admin/requests" className="ml-auto text-xs text-amber-400 font-semibold hover:underline">
            Xem ngay →
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Doanh thu"  iconBg="bg-indigo-600"
          value={formatPrice(stats.totalRevenue)} change={stats.changes?.revenue} />
        <StatCard icon={ShoppingBag} label="Đơn hàng"   iconBg="bg-orange-500"
          value={stats.totalOrders} change={stats.changes?.orders} />
        <StatCard icon={Users}       label="Khách hàng" iconBg="bg-rose-600"
          value={stats.totalUsers} change={stats.changes?.users} />
        <StatCard icon={Package}     label="Sản phẩm"   iconBg="bg-sky-600"
          value={stats.totalProducts} />
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Revenue Area Chart */}
        <div className="xl:col-span-3 bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-sm">Doanh thu</h2>
            <span className="text-xs text-slate-500 bg-slate-700/50 rounded-lg px-2.5 py-1">
              7 ngày qua
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.revenueChart || []} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5}
                fill="url(#revG)" dot={{ r: 3.5, fill: '#818cf8', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#818cf8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-slate-800 rounded-2xl border border-slate-700/50 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-white font-semibold text-sm">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-xs text-indigo-400 hover:underline font-medium">
              Xem tất cả
            </Link>
          </div>
          <div className="flex-1 divide-y divide-slate-700/30">
            {stats.recentOrders.map(order => {
              const s = STATUS_MAP[order.status] || STATUS_MAP.pending
              return (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={13} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-medium truncate">
                      #{order.id.slice(-6).toUpperCase()} · {order.user?.name}
                    </p>
                    <p className="text-slate-500 text-xs">{formatPrice(order.totalAmount)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
            {!stats.recentOrders.length && (
              <p className="text-slate-500 text-sm text-center py-10">Chưa có đơn hàng</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products + Category Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Top Products */}
        <div className="xl:col-span-3 bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Sản phẩm bán chạy</h2>
            <Link to="/admin/products" className="text-xs text-indigo-400 hover:underline font-medium">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-12 text-xs text-slate-500 font-medium pb-2 border-b border-slate-700/50 mb-1">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Sản phẩm</span>
            <span className="col-span-2 text-center">Đã bán</span>
            <span className="col-span-4 text-right">Doanh thu</span>
          </div>
          {stats.topProducts?.length > 0 ? stats.topProducts.map((p, i) => {
            const maxSold = stats.topProducts[0]?.sold || 1
            const pct = Math.round((p.sold / maxSold) * 100)
            const rankCls = ['bg-amber-400 text-amber-900', 'bg-slate-400 text-slate-900',
              'bg-orange-600 text-white', 'bg-slate-600 text-white', 'bg-slate-600 text-white']
            return (
              <div key={i} className="grid grid-cols-12 items-center py-2.5 border-b border-slate-700/30 last:border-0">
                <div className="col-span-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankCls[i]}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="col-span-5 min-w-0 pr-3">
                  <p className="text-slate-200 text-xs truncate">{p.name}</p>
                  <div className="w-full bg-slate-700 rounded-full h-1 mt-1.5">
                    <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="col-span-2 text-center text-xs text-slate-300 font-semibold">{p.sold}</div>
                <div className="col-span-4 text-right text-xs text-indigo-400 font-bold">{formatPrice(p.revenue)}</div>
              </div>
            )
          }) : (
            <p className="text-slate-500 text-sm text-center py-8">Chưa có dữ liệu bán hàng</p>
          )}
        </div>

        {/* Category Donut */}
        <div className="xl:col-span-2 bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
          <h2 className="text-white font-semibold text-sm mb-4">Tổng quan danh mục</h2>
          {stats.categoryBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stats.categoryBreakdown} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={72}
                    dataKey="value" paddingAngle={3}>
                    {stats.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {stats.categoryBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400 text-xs">{item.name}</span>
                    </div>
                    <span className="text-slate-300 text-xs font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-16">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Screen =
  | 'dashboard' | 'room-booking' | 'stay-details' | 'reservations'
  | 'create-reservation' | 'billing' | 'customers' | 'customer-profile'
  | 'rooms' | 'add-room' | 'housekeeping' | 'maintenance'
  | 'reports' | 'settings' | 'users' | 'backup' | 'print-invoice'

type RoomStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
type PaymentStatus = 'paid' | 'partial' | 'unpaid'

interface Room {
  id: number; number: string; floor: number; type: 'AC' | 'Non-AC'; bed: 'Single' | 'Double' | 'Triple'
  capacity: number; rent: number; extraPerson: number; extraBed: number
  status: RoomStatus; amenities: string[]
  guest?: string; checkIn?: string; checkOut?: string; balance?: number
  cleaningStaff?: string; maintenanceIssue?: string; priority?: string
}
interface Customer {
  id: number; name: string; mobile: string; email: string; address: string
  idType: string; idNumber: string; visits: number; totalSpent: number; outstanding: number; lastStay: string
}
interface Reservation {
  id: string; customer: string; mobile: string; room: string
  checkIn: string; checkOut: string; guests: number; advance: number
  status: 'upcoming' | 'today' | 'checked-in' | 'completed' | 'cancelled'; specialRequest?: string
}
interface Bill {
  id: string; customer: string; room: string; checkIn: string; checkOut: string
  netAmount: number; received: number; balance: number; paymentStatus: PaymentStatus
  payments: { amount: number; method: string; date: string }[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 40-Room Data Set
// ─────────────────────────────────────────────────────────────────────────────
const mkRoom = (
  id: number, num: string, floor: number, type: 'AC'|'Non-AC', bed: 'Single'|'Double'|'Triple',
  cap: number, rent: number, ep: number, eb: number, status: RoomStatus,
  amenities: string[], extra: Partial<Room> = {}
): Room => ({ id, number: num, floor, type, bed, capacity: cap, rent, extraPerson: ep, extraBed: eb, status, amenities, ...extra })

const AM = ['Wi-Fi','TV','Attached Bathroom','Hot Water','AC']
const BM = ['Wi-Fi','TV','Attached Bathroom','Hot Water','AC','Balcony']
const CM = ['TV','Attached Bathroom']
const DM = ['TV','Attached Bathroom','Hot Water']

const ROOMS_DATA: Room[] = [
  // Floor 1 (10 rooms)
  mkRoom(1,'101',1,'AC','Double',2,1500,300,500,'occupied',AM,{guest:'Mohammed Adil',checkIn:'15 Aug 2026',checkOut:'19 Aug 2026',balance:1500}),
  mkRoom(2,'102',1,'AC','Single',1,1200,250,400,'available',AM),
  mkRoom(3,'103',1,'Non-AC','Double',2,900,200,300,'reserved',CM,{guest:'Areez Khan',checkIn:'17 Aug 2026'}),
  mkRoom(4,'104',1,'AC','Triple',3,2200,350,600,'cleaning',BM,{cleaningStaff:'Sunita Devi'}),
  mkRoom(5,'105',1,'Non-AC','Single',1,700,150,250,'available',CM),
  mkRoom(6,'106',1,'AC','Double',2,1600,300,500,'available',AM),
  mkRoom(7,'107',1,'Non-AC','Double',2,950,200,300,'available',DM),
  mkRoom(8,'108',1,'AC','Single',1,1300,260,420,'maintenance',AM,{maintenanceIssue:'AC not cooling',priority:'High'}),
  mkRoom(9,'109',1,'AC','Double',2,1500,300,500,'available',AM),
  mkRoom(10,'110',1,'Non-AC','Triple',3,1400,280,450,'available',DM),
  // Floor 2 (10 rooms)
  mkRoom(11,'201',2,'AC','Double',2,1800,350,550,'occupied',AM,{guest:'Rahul Sharma',checkIn:'16 Aug 2026',checkOut:'18 Aug 2026',balance:0}),
  mkRoom(12,'202',2,'AC','Double',2,1800,350,550,'available',AM),
  mkRoom(13,'203',2,'AC','Triple',3,2500,400,700,'occupied',BM,{guest:'Priya Nair',checkIn:'14 Aug 2026',checkOut:'20 Aug 2026',balance:3500}),
  mkRoom(14,'204',2,'Non-AC','Double',2,1100,220,350,'maintenance',DM,{maintenanceIssue:'Bathroom tap leaking',priority:'Medium'}),
  mkRoom(15,'205',2,'AC','Single',1,1400,280,450,'reserved',AM,{guest:'Sneha Mehta',checkIn:'18 Aug 2026'}),
  mkRoom(16,'206',2,'AC','Double',2,1900,360,560,'available',AM),
  mkRoom(17,'207',2,'Non-AC','Single',1,800,170,270,'available',CM),
  mkRoom(18,'208',2,'AC','Double',2,1750,330,530,'occupied',AM,{guest:'Vikram Patel',checkIn:'17 Aug 2026',checkOut:'20 Aug 2026',balance:2000}),
  mkRoom(19,'209',2,'AC','Triple',3,2600,420,720,'available',BM),
  mkRoom(20,'210',2,'Non-AC','Double',2,1050,210,340,'available',DM),
  // Floor 3 (10 rooms)
  mkRoom(21,'301',3,'AC','Double',2,2000,400,600,'available',BM),
  mkRoom(22,'302',3,'AC','Triple',3,2800,450,750,'available',[...BM,'Refrigerator']),
  mkRoom(23,'303',3,'AC','Double',2,2100,410,610,'occupied',BM,{guest:'Deepa Krishnan',checkIn:'16 Aug 2026',checkOut:'19 Aug 2026',balance:4200}),
  mkRoom(24,'304',3,'Non-AC','Double',2,1200,240,380,'available',DM),
  mkRoom(25,'305',3,'AC','Single',1,1600,310,500,'reserved',AM,{guest:'Arjun Das',checkIn:'18 Aug 2026'}),
  mkRoom(26,'306',3,'AC','Double',2,2000,400,600,'cleaning',BM,{cleaningStaff:'Radha Kumari'}),
  mkRoom(27,'307',3,'Non-AC','Triple',3,1700,330,520,'available',DM),
  mkRoom(28,'308',3,'AC','Double',2,2050,405,605,'available',BM),
  mkRoom(29,'309',3,'AC','Single',1,1550,300,490,'occupied',AM,{guest:'Sonal Gupta',checkIn:'15 Aug 2026',checkOut:'17 Aug 2026',balance:0}),
  mkRoom(30,'310',3,'Non-AC','Double',2,1150,230,370,'available',CM),
  // Floor 4 (10 rooms)
  mkRoom(31,'401',4,'AC','Double',2,2400,480,700,'available',[...BM,'Refrigerator']),
  mkRoom(32,'402',4,'AC','Triple',3,3200,500,800,'available',[...BM,'Refrigerator']),
  mkRoom(33,'403',4,'AC','Double',2,2500,490,710,'occupied',[...BM,'Refrigerator'],{guest:'Naveen Kumar',checkIn:'17 Aug 2026',checkOut:'22 Aug 2026',balance:5000}),
  mkRoom(34,'404',4,'AC','Single',1,1900,370,570,'available',AM),
  mkRoom(35,'405',4,'AC','Double',2,2450,485,705,'reserved',[...AM,'Refrigerator'],{guest:'Fathima Beevi',checkIn:'19 Aug 2026'}),
  mkRoom(36,'406',4,'Non-AC','Double',2,1400,280,440,'available',DM),
  mkRoom(37,'407',4,'AC','Triple',3,3000,480,760,'occupied',[...BM,'Refrigerator'],{guest:'Suresh Iyer',checkIn:'13 Aug 2026',checkOut:'18 Aug 2026',balance:1200}),
  mkRoom(38,'408',4,'AC','Double',2,2400,480,700,'available',[...BM,'Refrigerator']),
  mkRoom(39,'409',4,'AC','Double',2,2350,470,690,'maintenance',[...AM,'Refrigerator'],{maintenanceIssue:'Window latch broken',priority:'Low'}),
  mkRoom(40,'410',4,'Non-AC','Single',1,1100,220,360,'available',CM),
]

const CUSTOMERS_DATA: Customer[] = [
  { id:1, name:'Mohammed Adil', mobile:'+91 98765 43210', email:'adil@email.com', address:'Kozhikode, Kerala', idType:'Aadhaar', idNumber:'XXXX-XXXX-1234', visits:5, totalSpent:18500, outstanding:1500, lastStay:'15 Aug 2026' },
  { id:2, name:'Areez Khan', mobile:'+91 87654 32109', email:'areez@email.com', address:'Malappuram, Kerala', idType:'Passport', idNumber:'P1234567', visits:2, totalSpent:7200, outstanding:0, lastStay:'10 Jul 2026' },
  { id:3, name:'Rahul Sharma', mobile:'+91 76543 21098', email:'rahul@email.com', address:'Mumbai, Maharashtra', idType:'Driving License', idNumber:'MH01-XXXX-2019', visits:8, totalSpent:42000, outstanding:0, lastStay:'16 Aug 2026' },
  { id:4, name:'Priya Nair', mobile:'+91 65432 10987', email:'priya@email.com', address:'Thrissur, Kerala', idType:'Voter ID', idNumber:'KL/12/345/678', visits:3, totalSpent:15600, outstanding:3500, lastStay:'14 Aug 2026' },
  { id:5, name:'Sneha Mehta', mobile:'+91 54321 09876', email:'sneha@email.com', address:'Pune, Maharashtra', idType:'Aadhaar', idNumber:'XXXX-XXXX-5678', visits:1, totalSpent:0, outstanding:0, lastStay:'—' },
  { id:6, name:'Vikram Patel', mobile:'+91 43210 98765', email:'vikram@email.com', address:'Ahmedabad, Gujarat', idType:'Passport', idNumber:'P9876543', visits:4, totalSpent:21000, outstanding:2000, lastStay:'17 Aug 2026' },
  { id:7, name:'Deepa Krishnan', mobile:'+91 32109 87654', email:'deepa@email.com', address:'Kochi, Kerala', idType:'Aadhaar', idNumber:'XXXX-XXXX-9012', visits:6, totalSpent:36000, outstanding:4200, lastStay:'16 Aug 2026' },
  { id:8, name:'Naveen Kumar', mobile:'+91 21098 76543', email:'naveen@email.com', address:'Bangalore, Karnataka', idType:'Voter ID', idNumber:'KA/01/234/567', visits:2, totalSpent:14000, outstanding:5000, lastStay:'17 Aug 2026' },
]

const RESERVATIONS_DATA: Reservation[] = [
  { id:'RES-001', customer:'Mohammed Adil', mobile:'+91 98765 43210', room:'101', checkIn:'15 Aug 2026', checkOut:'19 Aug 2026', guests:2, advance:1000, status:'checked-in' },
  { id:'RES-002', customer:'Areez Khan', mobile:'+91 87654 32109', room:'103', checkIn:'17 Aug 2026', checkOut:'20 Aug 2026', guests:2, advance:500, status:'today', specialRequest:'Early check-in requested' },
  { id:'RES-003', customer:'Sneha Mehta', mobile:'+91 54321 09876', room:'205', checkIn:'18 Aug 2026', checkOut:'21 Aug 2026', guests:1, advance:800, status:'upcoming' },
  { id:'RES-004', customer:'Arjun Das', mobile:'+91 43210 98766', room:'305', checkIn:'18 Aug 2026', checkOut:'22 Aug 2026', guests:2, advance:1200, status:'upcoming' },
  { id:'RES-005', customer:'Fathima Beevi', mobile:'+91 32109 87655', room:'405', checkIn:'19 Aug 2026', checkOut:'23 Aug 2026', guests:2, advance:2000, status:'upcoming', specialRequest:'Ground floor preferred' },
  { id:'RES-006', customer:'Deepa Krishnan', mobile:'+91 32109 87654', room:'302', checkIn:'10 Aug 2026', checkOut:'12 Aug 2026', guests:3, advance:2000, status:'completed' },
  { id:'RES-007', customer:'Rajiv Menon', mobile:'+91 11098 76543', room:'202', checkIn:'05 Aug 2026', checkOut:'07 Aug 2026', guests:2, advance:1500, status:'cancelled' },
]

const BILLS_DATA: Bill[] = [
  { id:'B-10231', customer:'Mohammed Adil', room:'101', checkIn:'15 Aug 2026', checkOut:'19 Aug 2026', netAmount:7200, received:5700, balance:1500, paymentStatus:'partial', payments:[{amount:1000,method:'Cash',date:'15 Aug'},{amount:2500,method:'UPI',date:'15 Aug'},{amount:2200,method:'Card',date:'17 Aug'}] },
  { id:'B-10230', customer:'Rahul Sharma', room:'201', checkIn:'16 Aug 2026', checkOut:'18 Aug 2026', netAmount:4200, received:4200, balance:0, paymentStatus:'paid', payments:[{amount:4200,method:'UPI',date:'16 Aug'}] },
  { id:'B-10229', customer:'Priya Nair', room:'203', checkIn:'14 Aug 2026', checkOut:'20 Aug 2026', netAmount:16500, received:13000, balance:3500, paymentStatus:'partial', payments:[{amount:5000,method:'Cash',date:'14 Aug'},{amount:8000,method:'Bank Transfer',date:'14 Aug'}] },
  { id:'B-10228', customer:'Deepa Krishnan', room:'302', checkIn:'10 Aug 2026', checkOut:'12 Aug 2026', netAmount:6400, received:6400, balance:0, paymentStatus:'paid', payments:[{amount:6400,method:'Card',date:'10 Aug'}] },
  { id:'B-10227', customer:'Suresh Kumar', room:'104', checkIn:'08 Aug 2026', checkOut:'10 Aug 2026', netAmount:2800, received:0, balance:2800, paymentStatus:'unpaid', payments:[] },
  { id:'B-10226', customer:'Vikram Patel', room:'208', checkIn:'17 Aug 2026', checkOut:'20 Aug 2026', netAmount:6300, received:4300, balance:2000, paymentStatus:'partial', payments:[{amount:4300,method:'UPI',date:'17 Aug'}] },
  { id:'B-10225', customer:'Naveen Kumar', room:'403', checkIn:'17 Aug 2026', checkOut:'22 Aug 2026', netAmount:14000, received:9000, balance:5000, paymentStatus:'partial', payments:[{amount:5000,method:'Cash',date:'17 Aug'},{amount:4000,method:'Card',date:'17 Aug'}] },
]

const REVENUE_DATA = [
  { day:'11 Aug', revenue:18200, payments:15000, outstanding:3200 },
  { day:'12 Aug', revenue:22400, payments:20100, outstanding:2300 },
  { day:'13 Aug', revenue:19800, payments:18500, outstanding:1300 },
  { day:'14 Aug', revenue:31200, payments:27500, outstanding:3700 },
  { day:'15 Aug', revenue:28600, payments:25200, outstanding:3400 },
  { day:'16 Aug', revenue:35400, payments:32000, outstanding:3400 },
  { day:'17 Aug', revenue:24500, payments:22000, outstanding:2500 },
]

const MONTHLY_DATA = [
  {month:'Feb',revenue:285000},{month:'Mar',revenue:312000},{month:'Apr',revenue:298000},
  {month:'May',revenue:340000},{month:'Jun',revenue:420000},{month:'Jul',revenue:385000},
  {month:'Aug',revenue:180000},
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers & tiny shared components
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN')
const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase()

const STATUS_CFG: Record<RoomStatus, { label:string; bg:string; text:string; dot:string; bar:string }> = {
  available:   { label:'AVAILABLE',   bg:'bg-emerald-50',  text:'text-emerald-700',  dot:'bg-emerald-500',  bar:'bg-emerald-500' },
  occupied:    { label:'OCCUPIED',    bg:'bg-red-50',      text:'text-red-700',      dot:'bg-red-500',      bar:'bg-red-500'     },
  reserved:    { label:'RESERVED',    bg:'bg-amber-50',    text:'text-amber-700',    dot:'bg-amber-500',    bar:'bg-amber-400'   },
  cleaning:    { label:'CLEANING',    bg:'bg-sky-50',      text:'text-sky-700',      dot:'bg-sky-500',      bar:'bg-sky-500'     },
  maintenance: { label:'MAINTENANCE', bg:'bg-slate-100',   text:'text-slate-600',    dot:'bg-slate-400',    bar:'bg-slate-400'   },
}
const PAY_CFG: Record<PaymentStatus, { label:string; bg:string; text:string }> = {
  paid:    { label:'Paid',    bg:'bg-emerald-50', text:'text-emerald-700' },
  partial: { label:'Partial', bg:'bg-amber-50',   text:'text-amber-700'  },
  unpaid:  { label:'Unpaid',  bg:'bg-red-50',     text:'text-red-600'    },
}

function StatusBadge({ status }: { status: RoomStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
function PayBadge({ status }: { status: PaymentStatus }) {
  const c = PAY_CFG[status]
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>
}

// Avatar colour stable by name
const AV_COLORS = ['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-rose-100 text-rose-700','bg-amber-100 text-amber-700','bg-teal-100 text-teal-700']
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm'|'md'|'lg' }) {
  const idx = name.charCodeAt(0) % AV_COLORS.length
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return <div className={`${sz} ${AV_COLORS[idx]} rounded-full flex items-center justify-center font-bold shrink-0`}>{initials(name)}</div>
}

function Toast({ message, type, onClose }: { message:string; type:'success'|'error'; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${type === 'success' ? 'bg-emerald-400 text-gray-900' : 'bg-white/30 text-white'}`}>{type === 'success' ? '✓' : '✕'}</span>
      {message}
      <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}

function Modal({ title, children, onClose, danger }: { title:string; children:React.ReactNode; onClose:()=>void; danger?:boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${danger ? 'bg-red-50' : 'bg-white'}`}>
          <h3 className="font-display font-semibold text-gray-900 text-[15px]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { group:'Main', items:[
    { id:'dashboard',    label:'Dashboard',      icon:'⊞' },
    { id:'room-booking', label:'Room Booking',   icon:'🛏' },
    { id:'reservations', label:'Reservations',   icon:'📋' },
    { id:'billing',      label:'Bills & Payments', icon:'₹' },
    { id:'customers',    label:'Customers',      icon:'👥' },
    { id:'rooms',        label:'Rooms',          icon:'🏨' },
    { id:'reports',      label:'Reports',        icon:'📊' },
  ]},
  { group:'Operations', items:[
    { id:'housekeeping', label:'Housekeeping',   icon:'🧹' },
    { id:'maintenance',  label:'Maintenance',    icon:'🔧' },
  ]},
  { group:'System', items:[
    { id:'users',    label:'Users & Roles', icon:'👤' },
    { id:'settings', label:'Settings',      icon:'⚙'  },
    { id:'backup',   label:'Backup',        icon:'💾'  },
  ]},
]

function Sidebar({ active, onNav }: { active: Screen; onNav: (s: Screen) => void }) {
  return (
    <aside className="w-[240px] bg-[#0b1437] flex flex-col h-full shrink-0 select-none">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">SH</div>
          <div>
            <div className="text-white font-display font-bold text-sm leading-none">Sunrise Heritage</div>
            <div className="text-blue-300/80 text-[11px] mt-0.5">Lodge &amp; Rooms</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {NAV.map(g => (
          <div key={g.group} className="mb-3">
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400/60">{g.group}</div>
            {g.items.map(item => {
              const active_ = active === item.id
              return (
                <button key={item.id} onClick={() => onNav(item.id as Screen)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left mb-0.5
                    ${active_ ? 'bg-white/10 text-white' : 'text-blue-100/60 hover:bg-white/6 hover:text-blue-100'}`}>
                  {active_ && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />}
                  <span className="text-[15px] w-5 text-center opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-3.5 border-t border-white/8">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">AM</div>
          <div className="min-w-0">
            <div className="text-white text-[13px] font-semibold truncate">Admin Manager</div>
            <div className="text-blue-300/60 text-[11px]">Administrator</div>
          </div>
        </div>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-300/60 hover:text-blue-200 hover:bg-white/6 text-[12px] transition-colors">
          <span>↩</span> Logout
        </button>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────
function Header({ onNav }: { onNav: (s: Screen) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState(true)
  const [showNotifs, setShowNotifs] = useState(false)

  const NOTIFS = [
    { icon:'⏰', text:'Room 102 checkout due in 30 minutes', time:'10 min ago', unread:true },
    { icon:'💰', text:'Room 205 payment pending — Sneha Mehta', time:'25 min ago', unread:true },
    { icon:'📋', text:'Reservation RES-002 arriving today', time:'1 hr ago', unread:true },
    { icon:'✅', text:'Room 108 maintenance completed', time:'2 hr ago', unread:false },
    { icon:'📊', text:'Daily report ready for 16 Aug 2026', time:'3 hr ago', unread:false },
  ]

  const results = q.length > 1 ? [
    { type:'Customer', label:'Mohammed Adil', sub:'Room 101 · +91 98765 43210', icon:'👤', dest:'customers' },
    { type:'Bill',     label:'B-10231',       sub:'Mohammed Adil · ₹7,200',     icon:'₹', dest:'billing' },
    { type:'Room',     label:'Room 101',      sub:'Occupied · AC Double Bed',   icon:'🛏', dest:'room-booking' },
  ].filter(r => r.label.toLowerCase().includes(q.toLowerCase()) || r.sub.toLowerCase().includes(q.toLowerCase())) : []

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 z-30 relative">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔍</span>
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Search rooms, guests, bills..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-800 placeholder-gray-400" />
        {open && q.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50">
            {results.length === 0
              ? <div className="px-4 py-4 text-sm text-gray-400 text-center">No results for "{q}"</div>
              : results.map((r, i) => (
                <button key={i} onMouseDown={() => { setQ(''); onNav(r.dest as Screen) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors">
                  <span className="text-xl">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{r.label}</div>
                    <div className="text-xs text-gray-400 truncate">{r.sub}</div>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{r.type}</span>
                </button>
              ))
            }
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors text-base">
            🔔
            {notifs && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-display font-semibold text-gray-900 text-sm">Notifications</span>
                <button onClick={() => setNotifs(false)} className="text-xs text-blue-600 font-medium hover:text-blue-800">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFS.map((n, i) => (
                  <div key={i} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${n.unread ? 'bg-blue-50/50' : ''}`}>
                    <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-800 leading-snug">{n.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                    {n.unread && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 ml-1">
          <div className="w-8 h-8 bg-[#0b1437] rounded-full flex items-center justify-center text-white text-xs font-bold">AM</div>
          <div className="hidden sm:block">
            <div className="text-[13px] font-semibold text-gray-800 leading-none">Admin Manager</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Administrator</div>
          </div>
          <span className="text-gray-400 text-xs">▾</span>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ onNav }: { onNav: (s: Screen) => void }) {
  const [rFilter, setRFilter] = useState<'week'|'month'>('week')

  const counts = { total:40, available:18, occupied:15, reserved:5, cleaning:2, maintenance:0 }
  const STATS = [
    { label:'Total Rooms',      value:'40',        sub:'Lodge capacity',         icon:'🏨', ibg:'bg-blue-100',   it:'text-blue-600',   bd:'border-blue-50'  },
    { label:'Available',        value:'18',        sub:'Ready to book',          icon:'✅', ibg:'bg-emerald-100', it:'text-emerald-600', bd:'border-emerald-50'},
    { label:'Occupied',         value:'15',        sub:'37.5% occupancy',        icon:'🔴', ibg:'bg-red-100',    it:'text-red-600',    bd:'border-red-50'   },
    { label:'Reserved',         value:'5',         sub:'Upcoming arrivals',      icon:'📋', ibg:'bg-amber-100',  it:'text-amber-600',  bd:'border-amber-50' },
    { label:'Cleaning',         value:'2',         sub:'In progress',            icon:'🧹', ibg:'bg-sky-100',    it:'text-sky-600',    bd:'border-sky-50'   },
    { label:"Today's Revenue",  value:'₹24,500',   sub:'↑ 12% from yesterday',  icon:'💰', ibg:'bg-violet-100', it:'text-violet-600', bd:'border-violet-50', big:true },
  ]

  const checkIns = [
    { guest:'Areez Khan',   room:'103', type:'Non-AC · Double', time:'02:30 PM', status:'Expected' },
    { guest:'Vikram Patel', room:'301', type:'AC · Double',     time:'04:00 PM', status:'Confirmed' },
  ]
  const checkOuts = [
    { guest:'Rahul Sharma', room:'201', time:'11:00 AM', balance:0 },
    { guest:'Mohammed Adil', room:'101', time:'12:00 PM', balance:1500 },
  ]

  const pieData = [
    { name:'Available', value:18, color:'#10b981' },
    { name:'Occupied',  value:15, color:'#ef4444' },
    { name:'Reserved',  value:5,  color:'#f59e0b' },
    { name:'Cleaning',  value:2,  color:'#0ea5e9' },
  ]

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900 leading-none">Good Morning 👋</h1>
          <p className="text-gray-500 text-sm mt-1.5">Here's what's happening at Sunrise Heritage today.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" defaultValue="2026-08-17"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white transition-colors">
            <span className="text-base">↻</span> Refresh
          </button>
          <button onClick={() => onNav('stay-details')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm">
            + New Booking
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        {STATS.map(s => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.bd} p-4 group hover:shadow-sm transition-shadow`}>
            <div className={`w-9 h-9 ${s.ibg} rounded-xl flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
            <div className={`font-display font-bold text-gray-900 leading-none ${s.big ? 'text-[20px]' : 'text-[30px]'}`}>{s.value}</div>
            <div className="text-[11px] text-gray-400 font-medium mt-1.5">{s.label}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Check-ins + Check-outs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-gray-900 text-[15px]">Today's Check-ins</h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{checkIns.length}</span>
            </div>
            <button onClick={() => onNav('reservations')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All →</button>
          </div>
          {checkIns.map((c, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
              <Avatar name={c.guest} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900">{c.guest}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Room {c.room} · {c.type}</div>
              </div>
              <div className="text-right shrink-0 mr-2">
                <div className="text-[13px] font-semibold text-gray-800">{c.time}</div>
                <div className="text-[11px] text-gray-400">{c.status}</div>
              </div>
              <button onClick={() => onNav('stay-details')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0">
                Check In
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-gray-900 text-[15px]">Today's Check-outs</h2>
              <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{checkOuts.length}</span>
            </div>
            <button onClick={() => onNav('billing')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View Bills →</button>
          </div>
          {checkOuts.map((c, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
              <Avatar name={c.guest} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{c.guest}</span>
                  {c.balance > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{fmt(c.balance)} due</span>}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Room {c.room} · Due by {c.time}</div>
              </div>
              <button onClick={() => onNav('stay-details')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shrink-0">
                Check Out
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue chart + Room donut */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">Revenue Overview</h2>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {(['week','month'] as const).map(f => (
                <button key={f} onClick={() => setRFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize
                    ${rFilter===f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {f === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={rFilter === 'week' ? REVENUE_DATA : MONTHLY_DATA} margin={{ top:5, right:5, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b1437" stopOpacity={0.12}/><stop offset="95%" stopColor="#0b1437" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey={rFilter==='month'?'month':'day'} tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v => '₹'+Math.round(v/1000)+'k'} width={48} />
              <Tooltip formatter={(v:number) => ['₹'+v.toLocaleString('en-IN')]} contentStyle={{borderRadius:10,border:'1px solid #e5e7eb',fontSize:12,boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="revenue" stroke="#0b1437" strokeWidth={2} fill="url(#gRev)" name="Revenue" />
              <Area type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={2} fill="url(#gPay)" name="Collected" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
            {[{l:'Total Revenue',v:'₹5,82,000',c:'text-gray-900'},{l:'Total Collected',v:'₹5,09,500',c:'text-emerald-700'},{l:'Outstanding',v:'₹72,500',c:'text-amber-600'}].map(m=>(
              <div key={m.l} className="text-center px-3 py-2 rounded-lg bg-gray-50">
                <div className={`font-display font-bold text-[18px] ${m.c}`}>{m.v}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col">
          <h2 className="font-display font-semibold text-gray-900 mb-1">Room Status</h2>
          <div className="text-[11px] text-gray-400 mb-3">40 rooms total</div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v,n) => [`${v} rooms`, n]} contentStyle={{borderRadius:10,fontSize:12,border:'1px solid #e5e7eb'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-1">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{background:d.color}} />
                  <span className="text-gray-500">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{d.value}</span>
                  <span className="text-gray-400">{Math.round(d.value/40*100)}%</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNav('room-booking')}
            className="mt-4 w-full py-2.5 bg-[#0b1437] text-white rounded-lg text-[13px] font-semibold hover:bg-[#162268] transition-colors">
            View Room Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Booking
// ─────────────────────────────────────────────────────────────────────────────
function RoomBooking({ onNav }: { onNav: (s: Screen) => void }) {
  const [statusF, setStatusF] = useState<RoomStatus|'all'>('all')
  const [typeF, setTypeF] = useState<'all'|'AC'|'Non-AC'>('all')
  const [bedF, setBedF] = useState<'all'|'Single'|'Double'|'Triple'>('all')
  const [floorF, setFloorF] = useState<'all'|'1'|'2'|'3'|'4'>('all')
  const [q, setQ] = useState('')

  const visible = ROOMS_DATA.filter(r => {
    if (statusF !== 'all' && r.status !== statusF) return false
    if (typeF !== 'all' && r.type !== typeF) return false
    if (bedF !== 'all' && r.bed !== bedF) return false
    if (floorF !== 'all' && String(r.floor) !== floorF) return false
    if (q && !r.number.includes(q) && !r.guest?.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const counts: Record<string,number> = { all: ROOMS_DATA.length }
  ROOMS_DATA.forEach(r => { counts[r.status] = (counts[r.status]||0)+1 })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Room Booking</h1>
          <p className="text-gray-500 text-sm mt-1">17 August 2026 &mdash; {visible.length} of {ROOMS_DATA.length} rooms shown</p>
        </div>
        <button onClick={() => onNav('stay-details')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm">
          + New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Room, guest name..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white w-48 text-gray-800" />
        </div>

        <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
          {(['all','available','occupied','reserved','cleaning','maintenance'] as const).map(f => {
            const cfg = f === 'all' ? null : STATUS_CFG[f]
            return (
              <button key={f} onClick={() => setStatusF(f)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                  ${statusF===f ? (f==='all' ? 'bg-white text-gray-900 shadow-sm' : `${cfg!.bg} ${cfg!.text} shadow-sm`) : 'text-gray-500 hover:text-gray-700'}`}>
                {f==='all' ? `All (${counts.all})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${counts[f]||0})`}
              </button>
            )
          })}
        </div>

        <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
          {(['all','AC','Non-AC'] as const).map(t => (
            <button key={t} onClick={() => setTypeF(t)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${typeF===t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
          {(['all','Single','Double','Triple'] as const).map(b => (
            <button key={b} onClick={() => setBedF(b)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${bedF===b ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{b}</button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
          {(['all','1','2','3','4'] as const).map(f2 => (
            <button key={f2} onClick={() => setFloorF(f2)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${floorF===f2 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {f2==='all' ? 'All Floors' : `Floor ${f2}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-3">
        {visible.map(room => (
          <RoomCard key={room.id} room={room} onClick={() => onNav('stay-details')} />
        ))}
        {visible.length === 0 && (
          <div className="col-span-5 py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-gray-500 font-semibold text-lg">No rooms match your filters</div>
            <button onClick={() => { setStatusF('all'); setQ(''); setTypeF('all'); setBedF('all'); setFloorF('all') }}
              className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-800">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const cfg = STATUS_CFG[room.status]
  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group overflow-hidden flex flex-col">
      <div className={`h-1 ${cfg.bar}`} />
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="font-display font-bold text-[22px] text-gray-900 leading-none group-hover:text-[#0b1437] transition-colors">{room.number}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Floor {room.floor}</div>
          </div>
          <StatusBadge status={room.status} />
        </div>

        <div className="space-y-1 mb-3 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <span>🌡</span><span>{room.type} · {room.bed} Bed</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <span>👤</span><span>{room.capacity} Person{room.capacity>1?'s':''}</span>
          </div>
        </div>

        {room.status === 'occupied' && room.guest && (
          <div className="bg-red-50 rounded-lg p-2 mb-2.5 text-[11px] border border-red-100">
            <div className="font-bold text-red-800 truncate">{room.guest}</div>
            <div className="text-red-600 mt-0.5 truncate">In: {room.checkIn}</div>
            <div className="text-red-600 truncate">Out: {room.checkOut}</div>
            {(room.balance ?? 0) > 0
              ? <div className="text-amber-700 font-bold mt-1">⚠ {fmt(room.balance!)}</div>
              : <div className="text-emerald-700 font-semibold mt-1">✓ Paid</div>}
          </div>
        )}
        {room.status === 'reserved' && room.guest && (
          <div className="bg-amber-50 rounded-lg p-2 mb-2.5 text-[11px] border border-amber-100">
            <div className="font-bold text-amber-800 truncate">{room.guest}</div>
            <div className="text-amber-600 mt-0.5">Check-in: {room.checkIn}</div>
          </div>
        )}
        {room.status === 'cleaning' && (
          <div className="bg-sky-50 rounded-lg p-2 mb-2.5 text-[11px] border border-sky-100">
            <div className="font-bold text-sky-800">Cleaning in Progress</div>
            {room.cleaningStaff && <div className="text-sky-600 mt-0.5">{room.cleaningStaff}</div>}
          </div>
        )}
        {room.status === 'maintenance' && room.maintenanceIssue && (
          <div className="bg-slate-100 rounded-lg p-2 mb-2.5 text-[11px] border border-slate-200">
            <div className="font-bold text-slate-700 truncate">{room.maintenanceIssue}</div>
            {room.priority && <div className="text-slate-500 mt-0.5">Priority: {room.priority}</div>}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div>
            <span className="font-display font-bold text-[#0b1437] text-[14px]">{fmt(room.rent)}</span>
            <span className="text-[10px] text-gray-400">/night</span>
          </div>
          <button className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors
            ${room.status==='available' ? 'bg-[#0b1437] text-white hover:bg-[#162268]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {room.status==='available' ? 'Book Now' : 'View'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stay Details
// ─────────────────────────────────────────────────────────────────────────────
function StayDetails({ onNav, toast }: { onNav:(s:Screen)=>void; toast:(m:string,t?:'success'|'error')=>void }) {
  const [ciModal, setCi] = useState(false)
  const [coModal, setCo] = useState(false)
  const [payModal, setPay] = useState(false)
  const [delModal, setDel] = useState(false)
  const [payments, setPayments] = useState([
    { amount:1000, method:'Cash', date:'15 Aug' },
    { amount:2500, method:'UPI', date:'15 Aug' },
    { amount:2200, method:'Card', date:'17 Aug' },
  ])
  const [newPay, setNewPay] = useState({ amount:'', method:'Cash' })
  const [g, setG] = useState({
    name:'Mohammed Adil', mobile:'+91 98765 43210', email:'adil@email.com',
    address:'Kozhikode, Kerala', idType:'Aadhaar', idNumber:'XXXX-XXXX-1234',
    adults:'2', children:'0',
  })

  const rent=1500; const nights=4
  const epCharge=300; const epCount=1
  const ebCharge=500; const ebCount=0
  const roomAmt = rent * nights
  const epAmt = epCharge * epCount * nights
  const ebAmt = ebCharge * ebCount
  const subtotal = roomAmt + epAmt + ebAmt
  const discount = 100; const tax = 0
  const net = subtotal - discount + tax
  const totalPaid = payments.reduce((a,p) => a+p.amount, 0)
  const balance = net - totalPaid

  const field = (label: string, value: string, key: string, type='text') => (
    <div key={key}>
      <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => setG(p => ({...p,[key]:e.target.value}))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white text-gray-800" />
    </div>
  )

  return (
    <div className="p-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => onNav('room-booking')} className="text-gray-400 hover:text-gray-700 text-sm transition-colors flex items-center gap-1">← Room Booking</button>
        <span className="text-gray-200">/</span>
        <h1 className="font-display text-[22px] font-bold text-gray-900 flex-1">Room 101 — Stay Details</h1>
        <StatusBadge status="occupied" />
        <span className="text-[11px] text-gray-400 font-mono font-semibold">B-10231</span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left 2 cols */}
        <div className="col-span-2 space-y-4">
          {/* Room Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-gray-900 mb-4 text-[15px]">Room Information</h2>
            <div className="grid grid-cols-3 gap-4">
              {[['Room Number','101'],['Room Type','AC'],['Bed Type','Double Bed'],['Max Occupancy','2 Persons'],['Room Rent','₹1,500 / Night'],['Current Status','Occupied']].map(([l,v])=>(
                <div key={l} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{l}</div>
                  <div className="text-[13px] font-bold text-gray-900 mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-gray-900 mb-4 text-[15px]">Guest Information</h2>
            <div className="grid grid-cols-2 gap-3.5">
              {field('Customer Name', g.name, 'name')}
              {field('Mobile Number', g.mobile, 'mobile', 'tel')}
              {field('Email Address', g.email, 'email', 'email')}
              {field('Address', g.address, 'address')}
              {field('ID Type', g.idType, 'idType')}
              {field('ID Number', g.idNumber, 'idNumber')}
              {field('Number of Adults', g.adults, 'adults', 'number')}
              {field('Number of Children', g.children, 'children', 'number')}
            </div>
          </div>

          {/* Stay Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-gray-900 mb-4 text-[15px]">Stay Information</h2>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                ['Check-in Date','2026-08-15','date'],['Check-in Time','02:30 PM','text'],
                ['Check-out Date','2026-08-19','date'],['Check-out Time','12:00 PM','text'],
                ['Number of Adults','2','number'],['Number of Children','0','number'],
                ['Extra Persons','1','number'],['Extra Beds','0','number'],
              ].map(([l,v,t])=>(
                <div key={l}>
                  <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">{l}</label>
                  <input type={t} defaultValue={v} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white text-gray-800" />
                </div>
              ))}
            </div>
            <div className="mt-3.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
              <span className="text-blue-500 text-lg">📅</span>
              <div>
                <span className="text-[13px] text-blue-700 font-medium">Duration of Stay: </span>
                <span className="font-display font-bold text-blue-900 text-[15px]">4 Nights</span>
                <span className="text-[11px] text-blue-500 ml-2">(Auto-calculated)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right col — Bill + Actions */}
        <div className="space-y-4">
          {/* Bill */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-display font-semibold text-gray-900 text-[13px] uppercase tracking-wider">Bill Details</h2>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between items-start">
                <div><div className="text-gray-700 font-medium">Room 101</div><div className="text-[11px] text-gray-400">₹1,500 × {nights} Nights</div></div>
                <span className="font-semibold text-gray-900">{fmt(roomAmt)}</span>
              </div>
              <div className="flex justify-between items-start">
                <div><div className="text-gray-700 font-medium">Extra Person</div><div className="text-[11px] text-gray-400">₹300 × 1 × {nights} Nights</div></div>
                <span className="font-semibold text-gray-900">{fmt(epAmt)}</span>
              </div>
              <div className="flex justify-between items-start text-gray-400">
                <div><div>Extra Bed</div><div className="text-[11px]">₹500 × 0</div></div>
                <span>₹0</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-2.5">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-emerald-600 mt-1.5"><span>Discount</span><span>−{fmt(discount)}</span></div>
                <div className="flex justify-between text-gray-400 mt-1.5"><span>Tax (0%)</span><span>₹0</span></div>
              </div>
              <div className="border-t-2 border-gray-900 pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="font-display font-bold text-gray-900 uppercase text-[12px] tracking-wide">Net Amount</span>
                  <span className="font-display font-bold text-[26px] text-[#0b1437] leading-none">{fmt(net)}</span>
                </div>
              </div>
              <div className="flex justify-between text-emerald-700 mt-2 font-semibold">
                <span>Amount Received</span><span>{fmt(totalPaid)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-xl mt-1 font-bold text-[15px] ${balance > 0 ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                <span>{balance > 0 ? '⚠ Balance Due' : '✓ Fully Paid'}</span>
                <span>{balance > 0 ? fmt(balance) : '₹0'}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-display font-semibold text-gray-900 text-[13px] uppercase tracking-wider">Payments</h2>
              <button onClick={() => setPay(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">+ Add</button>
            </div>
            <div className="divide-y divide-gray-50">
              {payments.map((p,i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{p.method}</span>
                    <span className="text-[11px] text-gray-400">{p.date}</span>
                  </div>
                  <span className="text-[13px] font-bold text-gray-900">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-5 py-3 bg-gray-50 border-t-2 border-gray-900">
              <span className="text-[12px] font-bold text-gray-900 uppercase tracking-wide">Total Paid</span>
              <span className="font-display font-bold text-[#0b1437] text-[16px]">{fmt(totalPaid)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <button onClick={() => toast('Stay details saved successfully!')}
              className="w-full py-2.5 bg-[#0b1437] text-white rounded-lg text-[13px] font-bold hover:bg-[#162268] transition-colors">
              Save Changes
            </button>
            <button onClick={() => setCi(true)}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-[13px] font-bold hover:bg-emerald-700 transition-colors">
              ✓ Confirm Check-in
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Edit</button>
              <button onClick={() => setPay(true)} className="py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Add Payment</button>
              <button onClick={() => onNav('print-invoice')} className="py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Print Bill</button>
              <button onClick={() => setCo(true)} className="py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors">Check Out</button>
            </div>
            <button onClick={() => setDel(true)}
              className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">
              Delete Stay Record
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {ciModal && (
        <Modal title="Confirm Check-in" onClose={() => setCi(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-[13px]">
              {[['Room','101'],['Guest','Mohammed Adil'],['Check-in','17 Aug 2026 · 02:30 PM'],['Expected Checkout','19 Aug 2026'],['Total Estimate',fmt(net)],['Advance Paid',fmt(totalPaid)],['Balance Due',balance>0?fmt(balance):'₹0 (Fully Paid)']].map(([l,v])=>(
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className={`font-bold ${l==='Balance Due'&&balance>0?'text-red-600':l==='Balance Due'?'text-emerald-600':'text-gray-900'}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCi(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setCi(false); toast('Room 101 checked in! Status: OCCUPIED') }}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">Confirm Check-in</button>
            </div>
          </div>
        </Modal>
      )}

      {coModal && (
        <Modal title="Confirm Check-out" onClose={() => setCo(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-[13px]">
              {[['Room','101'],['Guest','Mohammed Adil'],['Check-out','17 Aug 2026 · 12:00 PM'],['Duration','4 Nights'],['Net Amount',fmt(net)],['Paid',fmt(totalPaid)],['Balance',balance>0?fmt(balance):'₹0']].map(([l,v])=>(
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className={`font-bold ${l==='Balance'&&balance>0?'text-red-600':'text-gray-900'}`}>{v}</span>
                </div>
              ))}
            </div>
            {balance > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-800">⚠ Outstanding balance of {fmt(balance)}. Collect before checkout.</div>}
            <div className="flex gap-3">
              <button onClick={() => setCo(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setCo(false); toast('Room 101 checked out. Now marked for cleaning.') }}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700">Check Out Guest</button>
            </div>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title="Add Payment" onClose={() => setPay(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1.5 uppercase tracking-wide">Payment Amount (₹)</label>
              <input type="number" value={newPay.amount} onChange={e => setNewPay(p=>({...p,amount:e.target.value}))}
                placeholder="Enter amount" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1.5 uppercase tracking-wide">Payment Method</label>
              <select value={newPay.method} onChange={e => setNewPay(p=>({...p,method:e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                {['Cash','UPI','Card','Bank Transfer','Other'].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-[12px] space-y-1">
              <div className="flex justify-between text-gray-500"><span>Net Amount</span><span className="font-bold text-gray-900">{fmt(net)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Already Paid</span><span className="font-bold text-emerald-700">{fmt(totalPaid)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Remaining</span><span className={`font-bold ${balance>0?'text-red-600':'text-emerald-700'}`}>{fmt(balance)}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPay(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                if (newPay.amount) {
                  setPayments(p => [...p, { amount: Number(newPay.amount), method: newPay.method, date:'17 Aug' }])
                  setNewPay({ amount:'', method:'Cash' }); setPay(false); toast('Payment recorded successfully!')
                }
              }} className="flex-1 py-2.5 bg-[#0b1437] text-white rounded-xl font-bold hover:bg-[#162268]">Record Payment</button>
            </div>
          </div>
        </Modal>
      )}

      {delModal && (
        <Modal title="Delete Stay Record" onClose={() => setDel(false)} danger>
          <p className="text-[13px] text-gray-600 mb-5">This will permanently delete bill B-10231 and all associated payment records. This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDel(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Keep Record</button>
            <button onClick={() => { setDel(false); onNav('room-booking'); toast('Stay record deleted.','error') }}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Delete Permanently</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Print Invoice
// ─────────────────────────────────────────────────────────────────────────────
function PrintInvoice({ onNav }: { onNav:(s:Screen)=>void }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5 no-print">
        <button onClick={() => onNav('stay-details')} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="font-display text-xl font-bold text-gray-900 flex-1">Print Invoice</h1>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268]">🖨 Print</button>
      </div>

      {/* A4 Invoice */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden" id="invoice">
        {/* Header band */}
        <div className="bg-[#0b1437] px-8 py-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">SH</div>
              <div>
                <div className="text-white font-display font-bold text-xl">Sunrise Heritage</div>
                <div className="text-blue-300 text-xs">Lodge & Rooms</div>
              </div>
            </div>
            <div className="text-blue-200 text-xs space-y-0.5 mt-2">
              <div>NH 17, Kozhikode, Kerala — 673001</div>
              <div>Phone: +91 495 123 4567 · info@sunriseheritage.in</div>
              <div>GSTIN: 32AABCU9603R1ZX</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">Invoice</div>
            <div className="text-white font-display font-bold text-2xl">B-10231</div>
            <div className="text-blue-300 text-xs mt-1">Date: 17 Aug 2026</div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Guest + Stay side by side */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</div>
              <div className="font-display font-bold text-gray-900 text-[15px]">Mohammed Adil</div>
              <div className="text-[12px] text-gray-500 mt-1 space-y-0.5">
                <div>+91 98765 43210</div>
                <div>adil@email.com</div>
                <div>Kozhikode, Kerala</div>
                <div>Aadhaar: XXXX-XXXX-1234</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stay Details</div>
              <div className="text-[12px] text-gray-700 space-y-1.5">
                {[['Room','101 — AC Double Bed'],['Check-in','15 Aug 2026 · 02:30 PM'],['Check-out','19 Aug 2026 · 12:00 PM'],['Duration','4 Nights'],['Guests','2 Adults, 0 Children']].map(([l,v])=>(
                  <div key={l} className="flex justify-between"><span className="text-gray-400">{l}</span><span className="font-semibold text-gray-800">{v}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* Bill table */}
          <div className="rounded-xl overflow-hidden border border-gray-100">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Room Rent (Room 101)','4 Nights','₹1,500','₹6,000'],
                  ['Extra Person Charge','1 × 4 Nights','₹300','₹1,200'],
                  ['Extra Bed','0','₹500','₹0'],
                ].map(([d,q,r,a])=>(
                  <tr key={d} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-gray-700">{d}</td>
                    <td className="px-3 py-3 text-center text-gray-500">{q}</td>
                    <td className="px-3 py-3 text-center text-gray-500">{r}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-50 space-y-1.5 text-[12px]">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-semibold text-gray-700">₹7,200</span></div>
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−₹100</span></div>
              <div className="flex justify-between text-gray-400"><span>Tax (0%)</span><span>₹0</span></div>
              <div className="flex justify-between font-bold text-[15px] text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>NET AMOUNT</span><span className="text-[#0b1437]">₹7,100</span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Payment Summary</div>
            {[{a:1000,m:'Cash',d:'15 Aug'},{a:2500,m:'UPI',d:'15 Aug'},{a:2200,m:'Card',d:'17 Aug'}].map((p,i)=>(
              <div key={i} className="flex justify-between px-4 py-2.5 text-[12px] border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{p.d} · {p.m}</span>
                <span className="font-semibold text-gray-900">{fmt(p.a)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-emerald-50 text-[13px] font-bold">
              <span className="text-emerald-800">Total Paid</span><span className="text-emerald-700">₹5,700</span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-red-50 text-[13px] font-bold border-t border-red-100">
              <span className="text-red-700">Balance Due</span><span className="text-red-700">₹1,400</span>
            </div>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Terms &amp; Conditions</div>
              <div className="text-[10px] text-gray-400 leading-relaxed">Check-out time is 12:00 PM. Late check-out charges may apply. All disputes subject to Kozhikode jurisdiction.</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-6">Authorised Signatory</div>
              <div className="border-t border-gray-300 pt-1 inline-block w-36">
                <div className="text-[10px] text-gray-400">For Sunrise Heritage Lodge</div>
              </div>
            </div>
          </div>
          <div className="text-center py-3 bg-[#0b1437] rounded-xl">
            <div className="text-blue-200 text-[12px] font-medium">Thank you for staying with us! We look forward to welcoming you again.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reservations
// ─────────────────────────────────────────────────────────────────────────────
function Reservations({ onNav, toast }: { onNav:(s:Screen)=>void; toast:(m:string)=>void }) {
  const [f, setF] = useState<'all'|'upcoming'|'today'|'checked-in'|'completed'|'cancelled'>('all')
  const [q, setQ] = useState('')
  const [cancelId, setCancelId] = useState<string|null>(null)

  const rows = RESERVATIONS_DATA.filter(r => {
    if (f !== 'all' && r.status !== f) return false
    if (q && !r.customer.toLowerCase().includes(q.toLowerCase()) && !r.id.includes(q) && !r.room.includes(q)) return false
    return true
  })

  const SC: Record<string, { bg:string; text:string }> = {
    upcoming:     { bg:'bg-blue-50',    text:'text-blue-700'   },
    today:        { bg:'bg-amber-50',   text:'text-amber-700'  },
    'checked-in': { bg:'bg-emerald-50', text:'text-emerald-700'},
    completed:    { bg:'bg-gray-100',   text:'text-gray-500'   },
    cancelled:    { bg:'bg-red-50',     text:'text-red-600'    },
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} reservation{rows.length!==1?'s':''} shown</p>
        </div>
        <button onClick={() => onNav('create-reservation')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] shadow-sm">
          + New Reservation
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search reservations..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 w-52" />
        </div>
        <input type="date" defaultValue="2026-08-17" className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none" />
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1 border border-gray-200">
          {(['all','upcoming','today','checked-in','completed','cancelled'] as const).map(fv => (
            <button key={fv} onClick={() => setF(fv)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${f===fv ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {fv==='checked-in'?'Checked In':fv.charAt(0).toUpperCase()+fv.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Res. ID','Guest','Room','Check-in','Check-out','Guests','Advance','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-gray-600">{r.id}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.customer} size="sm" />
                    <div><div className="font-semibold text-gray-900">{r.customer}</div><div className="text-[11px] text-gray-400">{r.mobile}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-bold text-gray-800">Room {r.room}</td>
                <td className="px-4 py-3.5 text-gray-500">{r.checkIn}</td>
                <td className="px-4 py-3.5 text-gray-500">{r.checkOut}</td>
                <td className="px-4 py-3.5 text-center text-gray-700 font-semibold">{r.guests}</td>
                <td className="px-4 py-3.5 font-bold text-gray-900">{fmt(r.advance)}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${SC[r.status]?.bg} ${SC[r.status]?.text}`}>
                    {r.status==='checked-in'?'Checked In':r.status.charAt(0).toUpperCase()+r.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => onNav('stay-details')} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">View</button>
                    <button className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200">Edit</button>
                    {(r.status==='upcoming'||r.status==='today') && (
                      <button onClick={() => onNav('stay-details')} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100">Check In</button>
                    )}
                    {r.status!=='cancelled'&&r.status!=='completed' && (
                      <button onClick={() => setCancelId(r.id)} className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100">Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length===0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-semibold text-gray-500 text-lg">No reservations found</div>
            <button onClick={() => setF('all')} className="mt-3 text-blue-600 text-sm font-medium">Clear filter</button>
          </div>
        )}
      </div>

      {cancelId && (
        <Modal title="Cancel Reservation" onClose={() => setCancelId(null)} danger>
          <p className="text-[13px] text-gray-600 mb-4">Cancel reservation <strong>{cancelId}</strong>? Any advance payment should be refunded manually.</p>
          <div className="flex gap-3">
            <button onClick={() => setCancelId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Keep</button>
            <button onClick={() => { setCancelId(null); toast('Reservation cancelled.') }}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Cancel Reservation</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Reservation
// ─────────────────────────────────────────────────────────────────────────────
function CreateReservation({ onNav, toast }: { onNav:(s:Screen)=>void; toast:(m:string)=>void }) {
  const avail = ROOMS_DATA.filter(r => r.status==='available'||r.status==='reserved')
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => onNav('reservations')} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="font-display text-[22px] font-bold text-gray-900">New Reservation</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {[{section:'Guest Information', fields:[['Customer Name','text','name'],['Mobile Number','tel','mobile'],['Email Address','email','email']]},
          {section:'Stay Details', fields:[['Check-in Date','date','ci'],['Check-out Date','date','co'],['Number of Guests','number','guests'],['Extra Beds','number','eb'],['Advance Payment (₹)','number','advance']]}].map(s => (
          <div key={s.section}>
            <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100">{s.section}</h2>
            <div className="grid grid-cols-2 gap-3.5">
              {s.fields.map(([l,t,k]) => (
                <div key={k}>
                  <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">{l}</label>
                  <input type={t} placeholder={l} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800 bg-white" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">Room</label>
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800">
              {avail.map(r => <option key={r.id}>Room {r.number} — {r.type} {r.bed} (₹{r.rent}/night)</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">Payment Method</label>
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800">
              {['Cash','UPI','Card','Bank Transfer'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">Special Request</label>
          <textarea rows={2} placeholder="Any special requests or notes..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none text-gray-800" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => onNav('reservations')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={() => { onNav('reservations'); toast('Reservation created successfully!') }}
            className="flex-1 py-2.5 bg-[#0b1437] text-white rounded-xl font-bold hover:bg-[#162268]">Save Reservation</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing
// ─────────────────────────────────────────────────────────────────────────────
function Billing({ onNav, toast }: { onNav:(s:Screen)=>void; toast:(m:string)=>void }) {
  const [pf, setPf] = useState<'all'|PaymentStatus>('all')
  const [q, setQ] = useState('')
  const bills = BILLS_DATA.filter(b => {
    if (pf!=='all' && b.paymentStatus!==pf) return false
    if (q && !b.customer.toLowerCase().includes(q.toLowerCase()) && !b.id.includes(q) && !b.room.includes(q)) return false
    return true
  })
  const totals = { billed: BILLS_DATA.reduce((a,b)=>a+b.netAmount,0), collected: BILLS_DATA.reduce((a,b)=>a+b.received,0), outstanding: BILLS_DATA.reduce((a,b)=>a+b.balance,0) }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-bold text-gray-900">Bills & Payments</h1>
        <p className="text-gray-500 text-sm mt-1">{bills.length} records</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{l:'Total Billed',v:fmt(totals.billed),bg:'bg-white border-gray-100',c:'text-gray-900'},
          {l:'Total Collected',v:fmt(totals.collected),bg:'bg-emerald-50 border-emerald-100',c:'text-emerald-700'},
          {l:'Outstanding',v:fmt(totals.outstanding),bg:'bg-red-50 border-red-100',c:'text-red-600'}].map(s=>(
          <div key={s.l} className={`${s.bg} rounded-xl border p-4`}>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{s.l}</div>
            <div className={`font-display font-bold text-[22px] ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Bill no., customer, room..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 w-52" />
        </div>
        <input type="date" defaultValue="2026-08-17" className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none" />
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1 border border-gray-200">
          {(['all','paid','partial','unpaid'] as const).map(fv=>(
            <button key={fv} onClick={()=>setPf(fv)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${pf===fv?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
              {fv==='all'?'All Status':fv.charAt(0).toUpperCase()+fv.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Bill No.','Customer','Room','Check-in','Check-out','Net Amount','Received','Balance','Status','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map(b=>(
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-gray-700">{b.id}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2"><Avatar name={b.customer} size="sm" /><span className="font-semibold text-gray-900">{b.customer}</span></div>
                </td>
                <td className="px-4 py-3.5 font-bold text-gray-800">Room {b.room}</td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{b.checkIn}</td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{b.checkOut}</td>
                <td className="px-4 py-3.5 font-bold text-gray-900">{fmt(b.netAmount)}</td>
                <td className="px-4 py-3.5 font-semibold text-emerald-700">{fmt(b.received)}</td>
                <td className="px-4 py-3.5">
                  <span className={b.balance>0?'font-bold text-red-600':'text-gray-300'}>{b.balance>0?fmt(b.balance):'—'}</span>
                </td>
                <td className="px-4 py-3.5"><PayBadge status={b.paymentStatus} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1">
                    <button onClick={()=>onNav('stay-details')} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">View</button>
                    <button className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200">Edit</button>
                    <button onClick={()=>onNav('print-invoice')} className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200">Print</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length===0&&<div className="py-16 text-center"><div className="text-5xl mb-4">₹</div><div className="text-gray-500 font-semibold">No bills found</div></div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────────
function Customers({ onNav }: { onNav:(s:Screen)=>void }) {
  const [q, setQ] = useState('')
  const rows = CUSTOMERS_DATA.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.mobile.includes(q) || c.email.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} customers in database</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] shadow-sm">+ Add Customer</button>
      </div>
      <div className="relative w-72">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, mobile, email..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Customer','Mobile','Email','Visits','Total Spent','Outstanding','Last Stay','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(c=>(
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5"><Avatar name={c.name} /><div className="font-semibold text-gray-900">{c.name}</div></div>
                </td>
                <td className="px-4 py-3.5 text-gray-500">{c.mobile}</td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{c.email}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold">{c.visits}</span>
                </td>
                <td className="px-4 py-3.5 font-bold text-gray-900">{fmt(c.totalSpent)}</td>
                <td className="px-4 py-3.5">
                  <span className={c.outstanding>0?'font-bold text-red-600':'text-gray-300'}>{c.outstanding>0?fmt(c.outstanding):'—'}</span>
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{c.lastStay}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1">
                    <button onClick={()=>onNav('customer-profile')} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">View</button>
                    <button className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length===0&&<div className="py-16 text-center"><div className="text-5xl mb-4">👥</div><div className="text-gray-500 font-semibold">No customers found</div></div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Profile
// ─────────────────────────────────────────────────────────────────────────────
function CustomerProfile({ onNav }: { onNav:(s:Screen)=>void }) {
  const c = CUSTOMERS_DATA[0]
  const stays = [
    { bill:'B-10231',room:'101',checkIn:'15 Aug',checkOut:'19 Aug',amount:7200,status:'partial' as PaymentStatus },
    { bill:'B-10215',room:'203',checkIn:'02 Jul',checkOut:'04 Jul',amount:5400,status:'paid' as PaymentStatus },
    { bill:'B-10198',room:'102',checkIn:'15 Jun',checkOut:'16 Jun',amount:1800,status:'paid' as PaymentStatus },
    { bill:'B-10170',room:'201',checkIn:'20 Apr',checkOut:'22 Apr',amount:4100,status:'paid' as PaymentStatus },
  ]
  const pays = [
    { date:'17 Aug 2026',bill:'B-10231',amount:2200,method:'Card' },
    { date:'15 Aug 2026',bill:'B-10231',amount:2500,method:'UPI' },
    { date:'15 Aug 2026',bill:'B-10231',amount:1000,method:'Cash' },
    { date:'02 Jul 2026',bill:'B-10215',amount:5400,method:'UPI' },
  ]
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={()=>onNav('customers')} className="text-gray-400 hover:text-gray-700 text-sm">← Customers</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={c.name} size="lg" />
            <div>
              <h1 className="font-display text-[20px] font-bold text-gray-900">{c.name}</h1>
              <div className="text-[13px] text-gray-500 mt-1">{c.mobile} · {c.email}</div>
              <div className="text-[12px] text-gray-400 mt-0.5">{c.address} · {c.idType}: {c.idNumber}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Returning Guest</span>
                <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">Last stay: {c.lastStay}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-right shrink-0">
            {[{l:'Total Visits',v:String(c.visits),c:'text-gray-900'},{l:'Total Spent',v:fmt(c.totalSpent),c:'text-emerald-700'},{l:'Outstanding',v:c.outstanding>0?fmt(c.outstanding):'₹0',c:c.outstanding>0?'text-red-600':'text-gray-400'}].map(s=>(
              <div key={s.l} className="bg-gray-50 rounded-xl p-3 min-w-[100px]">
                <div className={`font-display font-bold text-[22px] ${s.c}`}>{s.v}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50"><h2 className="font-display font-semibold text-gray-900 text-[15px]">Stay History</h2></div>
          <table className="w-full text-[13px]">
            <thead><tr className="bg-white border-b border-gray-50">{['Bill','Room','Check-in','Check-out','Amount','Status'].map(h=><th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{stays.map(s=>(
              <tr key={s.bill} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-[11px] font-bold text-gray-700">{s.bill}</td>
                <td className="px-4 py-3 font-bold text-gray-800">Room {s.room}</td>
                <td className="px-4 py-3 text-gray-400 text-[12px]">{s.checkIn}</td>
                <td className="px-4 py-3 text-gray-400 text-[12px]">{s.checkOut}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{fmt(s.amount)}</td>
                <td className="px-4 py-3"><PayBadge status={s.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50"><h2 className="font-display font-semibold text-gray-900 text-[15px]">Payment History</h2></div>
          <table className="w-full text-[13px]">
            <thead><tr className="bg-white border-b border-gray-50">{['Date','Bill','Amount','Method'].map(h=><th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{pays.map((p,i)=>(
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-[12px] text-gray-400">{p.date}</td>
                <td className="px-4 py-3 font-mono text-[11px] font-bold text-gray-700">{p.bill}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{fmt(p.amount)}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{p.method}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Management
// ─────────────────────────────────────────────────────────────────────────────
function RoomManagement({ onNav, toast }: { onNav:(s:Screen)=>void; toast:(m:string,t?:'success'|'error')=>void }) {
  const [del, setDel] = useState<string|null>(null)
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">{ROOMS_DATA.length} rooms configured — 4 floors</p>
        </div>
        <button onClick={()=>onNav('add-room')} className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] shadow-sm">+ Add Room</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Room No.','Floor','Type','Bed','Capacity','Rent/Night','Extra/Person','Extra/Bed','Status','Actions'].map(h=>(
                <th key={h} className="text-left px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOMS_DATA.map(r=>(
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-3 font-display font-bold text-gray-900 text-[15px]">{r.number}</td>
                <td className="px-3 py-3 text-gray-500">{r.floor}</td>
                <td className="px-3 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${r.type==='AC'?'bg-blue-50 text-blue-700':'bg-gray-100 text-gray-600'}`}>{r.type}</span></td>
                <td className="px-3 py-3 text-gray-600">{r.bed}</td>
                <td className="px-3 py-3 text-center text-gray-600 font-semibold">{r.capacity}</td>
                <td className="px-3 py-3 font-bold text-gray-900">{fmt(r.rent)}</td>
                <td className="px-3 py-3 text-gray-500">{fmt(r.extraPerson)}</td>
                <td className="px-3 py-3 text-gray-500">{fmt(r.extraBed)}</td>
                <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">Edit</button>
                    <button onClick={()=>setDel(r.number)} className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {del && (
        <Modal title={`Delete Room ${del}`} onClose={()=>setDel(null)} danger>
          <p className="text-[13px] text-gray-600 mb-4">Permanently delete Room {del}? This removes all room configuration.</p>
          <div className="flex gap-3">
            <button onClick={()=>setDel(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={()=>{setDel(null);toast('Room deleted.','error')}} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Delete Room</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Room
// ─────────────────────────────────────────────────────────────────────────────
function AddRoom({ onNav, toast }: { onNav:(s:Screen)=>void; toast:(m:string)=>void }) {
  const [amenities, setAmenities] = useState<string[]>(['Wi-Fi','TV','Attached Bathroom'])
  const toggle = (a:string) => setAmenities(p => p.includes(a)?p.filter(x=>x!==a):[...p,a])
  const ALL_AM = ['Wi-Fi','TV','Attached Bathroom','Hot Water','AC','Parking','Balcony','Refrigerator']
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>onNav('rooms')} className="text-gray-400 hover:text-gray-700 text-sm">← Rooms</button>
        <h1 className="font-display text-[22px] font-bold text-gray-900">Add New Room</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {[
          { title:'Basic Information', fields:[['Room Number','text','e.g. 411'],['Floor','number','4']] },
          { title:'Pricing', fields:[['Room Rent (₹/night)','number','1500'],['Extra Person Charge (₹)','number','300'],['Extra Bed Charge (₹)','number','500']] },
          { title:'Occupancy', fields:[['Minimum Persons','number','1'],['Maximum Persons','number','2']] },
        ].map(s=>(
          <div key={s.title}>
            <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100">{s.title}</h2>
            <div className="grid grid-cols-2 gap-3.5">
              {s.fields.map(([l,t,p])=>(
                <div key={l}>
                  <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">{l}</label>
                  <input type={t} placeholder={p} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100">Room Configuration</h2>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">Room Type</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"><option>AC</option><option>Non-AC</option></select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">Bed Type</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"><option>Single</option><option>Double</option><option>Triple</option></select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100">Amenities</h2>
          <div className="grid grid-cols-4 gap-2">
            {ALL_AM.map(a=>(
              <label key={a} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-all text-[12px] ${amenities.includes(a)?'bg-blue-50 border-blue-300 text-blue-800 font-semibold':'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                <input type="checkbox" checked={amenities.includes(a)} onChange={()=>toggle(a)} className="accent-blue-600 w-3 h-3" />{a}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">Initial Status</h2>
          <div className="flex gap-4">
            {(['available','maintenance','disabled'] as const).map(s=>(
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="roomStatus" defaultChecked={s==='available'} className="accent-blue-600" />
                <span className="text-[13px] text-gray-700 capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button onClick={()=>onNav('rooms')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={()=>{onNav('rooms');toast('Room added successfully!')}} className="flex-1 py-2.5 bg-[#0b1437] text-white rounded-xl font-bold hover:bg-[#162268]">Save Room</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Housekeeping
// ─────────────────────────────────────────────────────────────────────────────
function Housekeeping({ toast }: { toast:(m:string)=>void }) {
  const groups = [
    { label:'Cleaning Required', color:'border-amber-200', headBg:'bg-amber-50', badge:'bg-amber-100 text-amber-800', dot:'bg-amber-500',
      rooms:[{num:'101',last:'17 Aug 11:00 AM',staff:'Unassigned'},{num:'102',last:'17 Aug 09:30 AM',staff:'Sunita Devi'},{num:'105',last:'16 Aug 12:00 PM',staff:'Unassigned'}] },
    { label:'Cleaning In Progress', color:'border-sky-200', headBg:'bg-sky-50', badge:'bg-sky-100 text-sky-800', dot:'bg-sky-500',
      rooms:[{num:'104',last:'16 Aug 02:00 PM',staff:'Sunita Devi'},{num:'306',last:'17 Aug 10:00 AM',staff:'Radha Kumari'}] },
    { label:'Clean & Ready', color:'border-emerald-200', headBg:'bg-emerald-50', badge:'bg-emerald-100 text-emerald-800', dot:'bg-emerald-500',
      rooms:[{num:'202',last:'17 Aug 09:00 AM',staff:'Radha Kumari'},{num:'204',last:'17 Aug 07:30 AM',staff:'Meena Bai'},{num:'301',last:'17 Aug 08:00 AM',staff:'Meena Bai'},{num:'302',last:'17 Aug 08:30 AM',staff:'Meena Bai'},{num:'410',last:'16 Aug 03:00 PM',staff:'Sunita Devi'}] },
  ]
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-bold text-gray-900">Housekeeping</h1>
        <p className="text-gray-500 text-sm mt-1">17 August 2026 · Room cleaning status overview</p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {groups.map(g => (
          <div key={g.label} className={`rounded-xl border ${g.color} overflow-hidden`}>
            <div className={`${g.headBg} px-4 py-3.5 border-b ${g.color} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${g.dot}`} />
                <h2 className="font-display font-semibold text-gray-800 text-[14px]">{g.label}</h2>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.badge}`}>{g.rooms.length}</span>
            </div>
            <div className="p-3 space-y-2.5 bg-white">
              {g.rooms.map(r=>(
                <div key={r.num} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display font-bold text-gray-900 text-[18px]">Room {r.num}</span>
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">{r.last.split(' ').slice(-2).join(' ')}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mb-2.5">
                    Staff: <span className={r.staff==='Unassigned'?'text-amber-600 font-bold':'text-gray-600 font-semibold'}>{r.staff}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {g.label==='Cleaning Required' && (
                      <button onClick={()=>toast(`Cleaning started for Room ${r.num}`)} className="flex-1 py-1.5 bg-sky-600 text-white rounded-lg text-[11px] font-bold hover:bg-sky-700">▶ Start</button>
                    )}
                    {g.label==='Cleaning In Progress' && (
                      <button onClick={()=>toast(`Room ${r.num} marked as clean and available`)} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700">✓ Mark Clean</button>
                    )}
                    {g.label==='Clean & Ready' && (
                      <div className="flex-1 py-1.5 text-center text-[11px] text-emerald-700 font-bold bg-emerald-50 rounded-lg border border-emerald-200">✓ Ready</div>
                    )}
                    <button className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 hover:bg-gray-100">Assign</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Maintenance
// ─────────────────────────────────────────────────────────────────────────────
function Maintenance({ toast }: { toast:(m:string)=>void }) {
  const issues = [
    { room:'108', issue:'AC not cooling properly', reported:'14 Aug 2026', priority:'High', status:'In Progress', eta:'18 Aug' },
    { room:'204', issue:'Bathroom tap leaking', reported:'15 Aug 2026', priority:'Medium', status:'Pending', eta:'20 Aug' },
    { room:'409', issue:'Window latch broken', reported:'10 Aug 2026', priority:'Low', status:'In Progress', eta:'19 Aug' },
    { room:'301', issue:'TV remote not working', reported:'16 Aug 2026', priority:'Low', status:'Resolved', eta:'—' },
    { room:'202', issue:'Door lock stiff', reported:'12 Aug 2026', priority:'Medium', status:'Resolved', eta:'—' },
  ]
  const PC: Record<string,string> = { High:'bg-red-100 text-red-700 border-red-200', Medium:'bg-amber-100 text-amber-700 border-amber-200', Low:'bg-gray-100 text-gray-600 border-gray-200' }
  const SC: Record<string,string> = { 'In Progress':'bg-blue-100 text-blue-700', Pending:'bg-amber-100 text-amber-700', Resolved:'bg-emerald-100 text-emerald-700' }
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">{issues.filter(i=>i.status!=='Resolved').length} active · {issues.filter(i=>i.status==='Resolved').length} resolved</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] shadow-sm">+ Report Issue</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Room','Issue','Reported','Priority','Status','ETA','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((m,i)=>(
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                <td className="px-4 py-3.5 font-display font-bold text-gray-900 text-[15px]">Room {m.room}</td>
                <td className="px-4 py-3.5 text-gray-700 font-medium">{m.issue}</td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{m.reported}</td>
                <td className="px-4 py-3.5"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${PC[m.priority]}`}>{m.priority}</span></td>
                <td className="px-4 py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${SC[m.status]}`}>{m.status}</span></td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{m.eta}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200">Edit</button>
                    {m.status!=='Resolved'&&<button onClick={()=>toast(`Room ${m.room} — issue resolved`)} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100">Resolve</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────
function Reports({ toast }: { toast:(m:string)=>void }) {
  const [tab, setTab] = useState<'revenue'|'occupancy'|'payment'|'daily'>('revenue')
  const payBreakdown = [
    {method:'UPI',amount:58500,pct:40,color:'#0b1437'},
    {method:'Cash',amount:42000,pct:29,color:'#3d4fce'},
    {method:'Card',amount:28000,pct:19,color:'#10b981'},
    {method:'Bank Transfer',amount:17500,pct:12,color:'#f59e0b'},
  ]
  const occData = [{d:'11',v:72},{d:'12',v:85},{d:'13',v:68},{d:'14',v:92},{d:'15',v:88},{d:'16',v:95},{d:'17',v:75}]
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Analytics & Business Intelligence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>toast('PDF exported!')} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 bg-white">📄 Export PDF</button>
          <button onClick={()=>toast('Excel exported!')} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 bg-white">📊 Export Excel</button>
          <button onClick={()=>toast('Printing...')} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 bg-white">🖨 Print</button>
        </div>
      </div>

      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1 w-fit border border-gray-200">
        {([['revenue','Revenue'],['occupancy','Occupancy'],['payment','Payments'],['daily','Daily Report']] as const).map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${tab===id?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab==='revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[{l:'Today',v:'₹24,500',s:'+12% vs yesterday'},{l:'This Week',v:'₹1,80,100',s:'+8% vs last week'},{l:'This Month',v:'₹5,82,000',s:'+15% vs last month'},{l:'Outstanding',v:'₹72,500',s:'Across 5 guests'}].map(s=>(
              <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">{s.l}</div>
                <div className="font-display font-bold text-[20px] text-gray-900">{s.v}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">{s.s}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-gray-900 mb-4">Monthly Revenue — 2026</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MONTHLY_DATA} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize:12,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>'₹'+Math.round(v/1000)+'k'} width={52} />
                <Tooltip formatter={(v:number)=>['₹'+v.toLocaleString('en-IN'),'Revenue']} contentStyle={{borderRadius:10,fontSize:12,border:'1px solid #e5e7eb'}} />
                <Bar dataKey="revenue" fill="#0b1437" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab==='occupancy' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">7-Day Occupancy Rate</h2>
            <div className="flex items-center gap-2 text-[12px] text-gray-400"><span className="w-3 h-0.5 bg-[#0b1437] rounded-full inline-block" /> Occupancy %</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={occData.map(d=>({...d, day:`Aug ${d.d}`}))}>
              <defs><linearGradient id="oGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0b1437" stopOpacity={0.15}/><stop offset="95%" stopColor="#0b1437" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{fontSize:12,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,100]} />
              <Tooltip formatter={(v:number)=>[`${v}%`,'Occupancy']} contentStyle={{borderRadius:10,fontSize:12,border:'1px solid #e5e7eb'}} />
              <Area type="monotone" dataKey="v" stroke="#0b1437" strokeWidth={2.5} fill="url(#oGrad)" name="Occupancy" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab==='payment' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-gray-900 mb-4">Payment Method Breakdown</h2>
            <div className="space-y-4">
              {payBreakdown.map(p=>(
                <div key={p.method}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="font-medium text-gray-700">{p.method}</span>
                    <span className="font-bold text-gray-900">{fmt(p.amount)} <span className="text-gray-400 font-normal">({p.pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${p.pct}%`,background:p.color}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-1">
              {[{l:'Total Collected',v:'₹1,46,000',bold:true},{l:'— Cash',v:'₹42,000'},{l:'— UPI',v:'₹58,500'},{l:'— Card',v:'₹28,000'},{l:'— Bank Transfer',v:'₹17,500'}].map(s=>(
                <div key={s.l} className={`flex justify-between py-2.5 border-b border-gray-50 last:border-0 ${s.bold?'border-t-2 border-gray-900 mt-2 pt-2':'text-gray-600'}`}>
                  <span className={`text-[13px] ${s.bold?'font-bold text-gray-900':'text-gray-500'}`}>{s.l}</span>
                  <span className={`text-[13px] font-bold ${s.bold?'text-gray-900':'text-gray-700'}`}>{s.v}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5 border-t border-gray-100 mt-1">
                <span className="text-[13px] text-red-600 font-semibold">Outstanding</span>
                <span className="text-[13px] font-bold text-red-600">₹72,500</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='daily' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-semibold text-gray-900 text-[17px]">Daily Report</h2>
                <div className="text-sm text-gray-400 mt-0.5">17 August 2026</div>
              </div>
              <button onClick={()=>toast('Daily report printed!')} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50">🖨 Print</button>
            </div>
            {[
              { section:'Revenue', items:[['Opening Balance','₹8,500'],['Room Revenue','₹21,000'],['Extra Person Revenue','₹1,800'],['Extra Bed Revenue','₹1,000'],['Discounts','-₹300'],['Tax','₹0'],['Gross Revenue','₹32,000']] },
              { section:'Payments Received', items:[['Total Received','₹22,000'],['Cash','₹8,500'],['UPI','₹9,500'],['Card','₹4,000'],['Bank Transfer','₹0'],['Outstanding','₹10,000']] },
              { section:'Operations', items:[['Check-ins Today','2'],['Check-outs Today','2'],['Occupied Rooms','15'],['Available Rooms','18'],['Reserved','5'],['Cleaning','2'],['Maintenance','3']] },
            ].map(s=>(
              <div key={s.section} className="mb-4">
                <div className="text-[10px] font-bold text-[#0b1437] uppercase tracking-widest mb-2 pt-4 border-t border-gray-100 first-of-type:border-0 first-of-type:pt-0">{s.section}</div>
                {s.items.map(([l,v])=>(
                  <div key={l} className="flex justify-between py-1.5 text-[13px]">
                    <span className="text-gray-500">{l}</span>
                    <span className={`font-bold ${l.includes('Revenue')||l==='Total Received'?'text-gray-900':l==='Outstanding'?'text-red-600':l==='Discounts'?'text-emerald-600':'text-gray-700'}`}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
function Settings({ toast }: { toast:(m:string)=>void }) {
  const [tab, setTab] = useState<'lodge'|'billing'|'rooms'|'system'>('lodge')
  return (
    <div className="p-6 space-y-5">
      <h1 className="font-display text-[26px] font-bold text-gray-900">Settings</h1>
      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1 w-fit border border-gray-200">
        {([['lodge','Lodge Info'],['billing','Billing'],['rooms','Room Settings'],['system','System']] as const).map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${tab===id?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab==='lodge' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl space-y-4">
          <h2 className="font-display font-semibold text-gray-800 border-b border-gray-100 pb-3">Lodge Information</h2>
          {[['Lodge Name','Sunrise Heritage Lodge & Rooms'],['Address','NH 17, Kozhikode, Kerala — 673001'],['Phone','+91 495 123 4567'],['Email','info@sunriseheritage.in'],['GST Number','32AABCU9603R1ZX']].map(([l,v])=>(
            <div key={l}>
              <label className="text-[11px] text-gray-400 font-bold block mb-1 uppercase tracking-wide">{l}</label>
              <input defaultValue={v} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800" />
            </div>
          ))}
          <div>
            <label className="text-[11px] text-gray-400 font-bold block mb-1 uppercase tracking-wide">Lodge Logo</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer">
              <div className="text-2xl mb-1">📷</div>
              <div className="text-[13px] text-gray-400">Click to upload logo</div>
              <div className="text-[11px] text-gray-300 mt-0.5">PNG, JPG up to 2MB</div>
            </div>
          </div>
          <button onClick={()=>toast('Lodge information saved!')} className="px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-[13px] font-bold hover:bg-[#162268]">Save Changes</button>
        </div>
      )}

      {tab==='billing' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl space-y-4">
          <h2 className="font-display font-semibold text-gray-800 border-b border-gray-100 pb-3">Billing Configuration</h2>
          {[['Invoice Prefix','B-'],['Starting Invoice Number','10232'],['Currency','INR (₹)'],['Tax Rate (%)','0']].map(([l,v])=>(
            <div key={l}>
              <label className="text-[11px] text-gray-400 font-bold block mb-1 uppercase tracking-wide">{l}</label>
              <input defaultValue={v} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800" />
            </div>
          ))}
          <div>
            <label className="text-[11px] text-gray-400 font-bold block mb-2 uppercase tracking-wide">Payment Methods</label>
            <div className="flex flex-wrap gap-2">
              {['Cash','UPI','Card','Bank Transfer','Other'].map(m=>(
                <label key={m} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[12px] font-semibold text-blue-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-blue-600" />{m}
                </label>
              ))}
            </div>
          </div>
          <button onClick={()=>toast('Billing settings saved!')} className="px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-[13px] font-bold hover:bg-[#162268]">Save Changes</button>
        </div>
      )}

      {tab==='rooms' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl space-y-5">
          <h2 className="font-display font-semibold text-gray-800 border-b border-gray-100 pb-3">Room Settings</h2>
          {[{l:'Room Types',tags:['AC','Non-AC']},{l:'Bed Types',tags:['Single','Double','Triple']},{l:'Amenities',tags:['Wi-Fi','TV','Attached Bathroom','Hot Water','AC','Parking','Balcony','Refrigerator']}].map(s=>(
            <div key={s.l}>
              <label className="text-[11px] text-gray-400 font-bold block mb-2 uppercase tracking-wide">{s.l}</label>
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map(t=>(
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[12px] font-semibold">
                    {t}<button className="text-gray-400 hover:text-red-500 text-xs ml-0.5">×</button>
                  </span>
                ))}
                <button className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-400 rounded-lg text-[12px] hover:border-blue-300 hover:text-blue-500">+ Add</button>
              </div>
            </div>
          ))}
          <button onClick={()=>toast('Room settings saved!')} className="px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-[13px] font-bold hover:bg-[#162268]">Save Changes</button>
        </div>
      )}

      {tab==='system' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl space-y-3">
          <h2 className="font-display font-semibold text-gray-800 border-b border-gray-100 pb-3">System</h2>
          {[{t:'Backup Data',d:'Create a full backup of all lodge data, bills, and customer records.',btn:'bg-[#0b1437] text-white','btnLabel':'Backup Now'},{t:'Restore Data',d:'Restore lodge data from a previously saved backup file.',btn:'bg-amber-600 text-white',btnLabel:'Restore'},{t:'Audit Log',d:'View all system activity, logins, and data changes.',btn:'bg-gray-700 text-white',btnLabel:'View Log'}].map(s=>(
            <div key={s.t} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-1 pr-4">
                <div className="font-semibold text-gray-900 text-[14px]">{s.t}</div>
                <div className="text-[12px] text-gray-400 mt-0.5">{s.d}</div>
              </div>
              <button onClick={()=>toast(`${s.t} initiated`)} className={`px-3 py-2 ${s.btn} rounded-lg text-[12px] font-bold hover:opacity-90 shrink-0`}>{s.btnLabel}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Users & Roles
// ─────────────────────────────────────────────────────────────────────────────
function UsersRoles({ toast }: { toast:(m:string)=>void }) {
  const users = [
    { name:'Admin Manager', email:'admin@sunriseheritage.in', role:'Admin', status:'Active', last:'17 Aug 2026' },
    { name:'Fatima Receptionist', email:'fatima@sunriseheritage.in', role:'Receptionist', status:'Active', last:'17 Aug 2026' },
    { name:'Suresh Accountant', email:'suresh@sunriseheritage.in', role:'Accountant', status:'Active', last:'16 Aug 2026' },
    { name:'Meena Housekeeping', email:'meena@sunriseheritage.in', role:'Housekeeping', status:'Active', last:'17 Aug 2026' },
    { name:'Rajan Manager', email:'rajan@sunriseheritage.in', role:'Manager', status:'Inactive', last:'10 Aug 2026' },
  ]
  const roles = [
    { name:'Admin', color:'bg-red-50 text-red-700', perms:['Dashboard','Rooms','Booking','Billing','Reports','Customers','Settings','Housekeeping','Maintenance','Users'] },
    { name:'Manager', color:'bg-purple-50 text-purple-700', perms:['Dashboard','Rooms','Booking','Billing','Reports','Customers'] },
    { name:'Receptionist', color:'bg-blue-50 text-blue-700', perms:['Dashboard','Rooms','Booking','Customers'] },
    { name:'Accountant', color:'bg-emerald-50 text-emerald-700', perms:['Billing','Reports'] },
    { name:'Housekeeping', color:'bg-amber-50 text-amber-700', perms:['Housekeeping'] },
  ]
  const ALL_PERMS = ['Dashboard','Rooms','Booking','Billing','Reports','Customers','Settings','Housekeeping','Maintenance','Users']
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-500 text-sm mt-1">Manage staff access and permissions</p>
        </div>
        <button onClick={()=>toast('Invite email sent!')} className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] shadow-sm">+ Invite User</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h2 className="font-display font-semibold text-gray-900">Staff Members</h2>
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-gray-100 bg-gray-50/60">{['Name','Email','Role','Status','Last Active','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><Avatar name={u.name} /><span className="font-semibold text-gray-900">{u.name}</span></div></td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{u.email}</td>
                <td className="px-4 py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${roles.find(r=>r.name===u.role)?.color||'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                <td className="px-4 py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${u.status==='Active'?'bg-emerald-50 text-emerald-700':'bg-gray-100 text-gray-400'}`}>{u.status}</span></td>
                <td className="px-4 py-3.5 text-gray-400 text-[12px]">{u.last}</td>
                <td className="px-4 py-3.5"><div className="flex gap-1"><button className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">Edit</button><button onClick={()=>toast(`${u.name} disabled`)} className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100">Disable</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h2 className="font-display font-semibold text-gray-900">Role Permissions</h2>
        </div>
        <div className="p-5">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Module</th>
                {roles.map(r=><th key={r.name} className="pb-3 text-center"><span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${r.color}`}>{r.name}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMS.map(p=>(
                <tr key={p} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 text-gray-600 font-medium">{p}</td>
                  {roles.map(r=>(
                    <td key={r.name} className="py-2.5 text-center">
                      <input type="checkbox" defaultChecked={r.perms.includes(p)} className="accent-blue-600 w-4 h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup
// ─────────────────────────────────────────────────────────────────────────────
function Backup({ toast }: { toast:(m:string)=>void }) {
  const backups = [
    { date:'17 Aug 2026 · 06:00 AM', type:'Auto', size:'4.2 MB', status:'Success' },
    { date:'16 Aug 2026 · 06:00 AM', type:'Auto', size:'4.1 MB', status:'Success' },
    { date:'15 Aug 2026 · 11:30 PM', type:'Manual', size:'4.0 MB', status:'Success' },
    { date:'14 Aug 2026 · 06:00 AM', type:'Auto', size:'3.9 MB', status:'Success' },
    { date:'13 Aug 2026 · 06:00 AM', type:'Auto', size:'3.8 MB', status:'Failed' },
  ]
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-bold text-gray-900">Backup</h1>
        <p className="text-gray-500 text-sm mt-1">Data backup and restore management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0b1437] rounded-xl p-5 text-white">
          <div className="text-[11px] text-blue-300 font-bold uppercase tracking-wider mb-1.5">Last Backup</div>
          <div className="font-display font-bold text-[18px]">17 Aug 2026</div>
          <div className="text-blue-300 text-[12px] mt-0.5">06:00 AM · Auto · 4.2 MB</div>
          <button onClick={()=>toast('Manual backup started...')} className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[12px] font-bold transition-colors border border-white/20">Backup Now</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Auto Backup</div>
          <div className="font-display font-bold text-[18px] text-gray-900">Daily</div>
          <div className="text-gray-400 text-[12px] mt-0.5">Runs every day at 06:00 AM</div>
          <button className="mt-4 w-full py-2 border border-gray-200 text-gray-600 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors">Configure</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Restore Data</div>
          <div className="font-display font-bold text-[18px] text-gray-900">Recovery</div>
          <div className="text-gray-400 text-[12px] mt-0.5">Upload backup file to restore</div>
          <button onClick={()=>toast('Select backup file to restore')} className="mt-4 w-full py-2 border border-amber-200 text-amber-700 bg-amber-50 rounded-lg text-[12px] font-bold hover:bg-amber-100 transition-colors">Restore...</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="font-display font-semibold text-gray-900">Backup History</h2>
          <span className="text-[11px] text-gray-400">{backups.length} backups</span>
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-gray-50 bg-gray-50/60">{['Date & Time','Type','Size','Status','Actions'].map(h=><th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {backups.map((b,i)=>(
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-gray-700 font-medium">{b.date}</td>
                <td className="px-5 py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${b.type==='Manual'?'bg-blue-50 text-blue-700':'bg-gray-100 text-gray-600'}`}>{b.type}</span></td>
                <td className="px-5 py-3.5 text-gray-500 font-mono text-[12px]">{b.size}</td>
                <td className="px-5 py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${b.status==='Success'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-600'}`}>{b.status}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    {b.status==='Success'&&<button onClick={()=>toast('Backup downloaded!')} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100">Download</button>}
                    {b.status==='Success'&&<button onClick={()=>toast('Restore started from '+b.date)} className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold hover:bg-amber-100">Restore</button>}
                    {b.status==='Failed'&&<button onClick={()=>toast('Retrying backup...')} className="px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100">Retry</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [toastState, setToastState] = useState<{message:string; type:'success'|'error'}|null>(null)

  const toast = (message: string, type: 'success'|'error' = 'success') => setToastState({ message, type })
  const nav = (s: Screen) => setScreen(s)

  const content = () => {
    switch (screen) {
      case 'dashboard':          return <Dashboard onNav={nav} />
      case 'room-booking':       return <RoomBooking onNav={nav} />
      case 'stay-details':       return <StayDetails onNav={nav} toast={toast} />
      case 'print-invoice':      return <PrintInvoice onNav={nav} />
      case 'reservations':       return <Reservations onNav={nav} toast={toast} />
      case 'create-reservation': return <CreateReservation onNav={nav} toast={toast} />
      case 'billing':            return <Billing onNav={nav} toast={toast} />
      case 'customers':          return <Customers onNav={nav} />
      case 'customer-profile':   return <CustomerProfile onNav={nav} />
      case 'rooms':              return <RoomManagement onNav={nav} toast={toast} />
      case 'add-room':           return <AddRoom onNav={nav} toast={toast} />
      case 'housekeeping':       return <Housekeeping toast={toast} />
      case 'maintenance':        return <Maintenance toast={toast} />
      case 'reports':            return <Reports toast={toast} />
      case 'settings':           return <Settings toast={toast} />
      case 'users':              return <UsersRoles toast={toast} />
      case 'backup':             return <Backup toast={toast} />
      default:                   return <Dashboard onNav={nav} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]" style={{ fontFamily:"'Inter', sans-serif" }}>
      <Sidebar active={screen} onNav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onNav={nav} />
        <main className="flex-1 overflow-y-auto">{content()}</main>
      </div>
      {toastState && <Toast message={toastState.message} type={toastState.type} onClose={() => setToastState(null)} />}
    </div>
  )
}

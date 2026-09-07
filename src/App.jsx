import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, Minus, X, Settings, Phone, Mail, MapPin, ChevronLeft,
  Upload, Trash2, Edit3, TrendingUp, Package, LogOut, Check, Palette,
  ArrowRight, Building2, Image as ImageIcon, UserPlus, LogIn, Boxes,
  AlertTriangle, Sparkles, ChevronRight, Link2
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* Map between the app's camelCase product shape and Supabase's snake_case columns */
function toDbProduct(p, userId) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    company: p.company,
    image: p.image,
    stock: p.stock,
    purchase_price: p.purchasePrice,
    retail_price: p.retailPrice,
    min_price: p.minPrice,
  };
}
function fromDbProduct(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    image: row.image,
    stock: row.stock,
    purchasePrice: Number(row.purchase_price),
    retailPrice: Number(row.retail_price),
    minPrice: Number(row.min_price),
  };
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const THEMES = {
  dark: {
    label: "Dark Mode",
    bg: "#14171B",
    surface: "#1D2126",
    surfaceAlt: "#252A30",
    surfaceRaise: "#2B3138",
    border: "#31373E",
    text: "#EAEDF0",
    textMuted: "#8B94A0",
    accent: "#2DD4E8",
    accentText: "#06282C",
    accentSoft: "rgba(45,212,232,0.14)",
    danger: "#F2685C",
    warn: "#E8B94D",
    good: "#3DDC97",
    swatch: ["#14171B", "#2DD4E8", "#252A30"],
  },
  olive: {
    label: "Olive Green Dark",
    bg: "#1C241B",
    surface: "#26301F",
    surfaceAlt: "#2E3A26",
    surfaceRaise: "#354028",
    border: "#3E4B33",
    text: "#EEF1E6",
    textMuted: "#A6B096",
    accent: "#D4AF37",
    accentText: "#2C2408",
    accentSoft: "rgba(212,175,55,0.16)",
    danger: "#E07A5F",
    warn: "#E0B84A",
    good: "#8FBF6F",
    swatch: ["#1C241B", "#D4AF37", "#26301F"],
  },
  red: {
    label: "Rich Red & Black",
    bg: "#0C0B0D",
    surface: "#171214",
    surfaceAlt: "#201A1C",
    surfaceRaise: "#2A2124",
    border: "#372A2D",
    text: "#F4EBEA",
    textMuted: "#AC9291",
    accent: "#C6828F",
    accentText: "#2A0F13",
    accentSoft: "rgba(198,130,143,0.16)",
    danger: "#E1483A",
    warn: "#DE9C55",
    good: "#7DAE8B",
    swatch: ["#0C0B0D", "#8B1E2B", "#C6828F"],
  },
  light: {
    label: "Light Modern",
    bg: "#F6F6F3",
    surface: "#FFFFFF",
    surfaceAlt: "#F0F1EE",
    surfaceRaise: "#FFFFFF",
    border: "#E3E4E0",
    text: "#1C1F23",
    textMuted: "#6B7178",
    accent: "#3767E0",
    accentText: "#FFFFFF",
    accentSoft: "rgba(55,103,224,0.10)",
    danger: "#D8433A",
    warn: "#C17A1E",
    good: "#1E9165",
    swatch: ["#F6F6F3", "#3767E0", "#FFFFFF"],
  },
};

const CURRENCIES = [
  ["USD","US Dollar","$"],["EUR","Euro","€"],["GBP","British Pound","£"],
  ["PKR","Pakistani Rupee","₨"],["INR","Indian Rupee","₹"],["AED","UAE Dirham","د.إ"],
  ["SAR","Saudi Riyal","﷼"],["CAD","Canadian Dollar","$"],["AUD","Australian Dollar","$"],
  ["NZD","New Zealand Dollar","$"],["CHF","Swiss Franc","Fr"],["SGD","Singapore Dollar","$"],
  ["HKD","Hong Kong Dollar","$"],["JPY","Japanese Yen","¥"],["CNY","Chinese Yuan","¥"],
  ["KRW","South Korean Won","₩"],["MYR","Malaysian Ringgit","RM"],["THB","Thai Baht","฿"],
  ["IDR","Indonesian Rupiah","Rp"],["PHP","Philippine Peso","₱"],["VND","Vietnamese Dong","₫"],
  ["BDT","Bangladeshi Taka","৳"],["LKR","Sri Lankan Rupee","₨"],["NPR","Nepalese Rupee","₨"],
  ["TRY","Turkish Lira","₺"],["RUB","Russian Ruble","₽"],["ZAR","South African Rand","R"],
  ["NGN","Nigerian Naira","₦"],["EGP","Egyptian Pound","£"],["KES","Kenyan Shilling","KSh"],
  ["BRL","Brazilian Real","R$"],["MXN","Mexican Peso","$"],["ARS","Argentine Peso","$"],
  ["SEK","Swedish Krona","kr"],["NOK","Norwegian Krone","kr"],["DKK","Danish Krone","kr"],
  ["PLN","Polish Zloty","zł"],["CZK","Czech Koruna","Kč"],["ILS","Israeli Shekel","₪"],
  ["QAR","Qatari Riyal","﷼"],["KWD","Kuwaiti Dinar","د.ك"],["OMR","Omani Rial","﷼"],
  ["JOD","Jordanian Dinar","د.ا"],["BHD","Bahraini Dinar",".د.ب"],
];

function fmtMoney(value, code) {
  const v = Number(value) || 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(v);
  } catch {
    const c = CURRENCIES.find((x) => x[0] === code);
    return `${c ? c[2] : code} ${v.toFixed(2)}`;
  }
}

function initials(name) {
  if (!name) return "X";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const SEED_PRODUCTS = [
  { id: uid(), name: "Instant Coffee 200g", company: "Solvora Foods", image: null, stock: 34, purchasePrice: 3.2, retailPrice: 5.5, minPrice: 4.0 },
  { id: uid(), name: "Noodles Family Pack", company: "Solvora Foods", image: null, stock: 6, purchasePrice: 1.1, retailPrice: 2.0, minPrice: 1.6 },
  { id: uid(), name: "Chocolate Wafer Bar", company: "Solvora Foods", image: null, stock: 58, purchasePrice: 0.6, retailPrice: 1.25, minPrice: 0.9 },
  { id: uid(), name: "Herbal Soap 100g", company: "Meridia Home", image: null, stock: 12, purchasePrice: 0.9, retailPrice: 1.8, minPrice: 1.3 },
  { id: uid(), name: "Black Tea 500g", company: "Meridia Home", image: null, stock: 3, purchasePrice: 4.0, retailPrice: 6.75, minPrice: 5.2 },
  { id: uid(), name: "Shampoo 350ml", company: "Meridia Home", image: null, stock: 21, purchasePrice: 2.4, retailPrice: 4.3, minPrice: 3.3 },
  { id: uid(), name: "Basmati Rice 5kg", company: "Harvest Row", image: null, stock: 17, purchasePrice: 8.5, retailPrice: 12.0, minPrice: 9.8 },
  { id: uid(), name: "Wild Honey 500g", company: "Harvest Row", image: null, stock: 9, purchasePrice: 6.1, retailPrice: 10.5, minPrice: 7.9 },
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function IconBtn({ t, onClick, children, title, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="transition-all duration-150 active:scale-90 rounded-full p-2 flex items-center justify-center"
      style={{
        background: t.surfaceAlt,
        color: danger ? t.danger : t.text,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </button>
  );
}

function StockGauge({ stock, t, size = 44, low = 5, warn = 12 }) {
  const ratio = stock / (warn * 1.6);
  const pct = Math.max(0.04, Math.min(1, ratio));
  const status = stock <= 0 ? "out" : stock <= low ? "low" : stock <= warn ? "warn" : "good";
  const color = status === "out" || status === "low" ? t.danger : status === "warn" ? t.warn : t.good;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={t.border} strokeWidth="4" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span className="absolute font-mono font-semibold" style={{ fontSize: size * 0.28, color: t.text }}>
        {stock}
      </span>
    </div>
  );
}

function FieldLabel({ t, children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: t.textMuted }}>
      {children}
    </label>
  );
}

function TextInput({ t, ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-shadow duration-150 focus:ring-2"
      style={{
        background: t.bg,
        color: t.text,
        border: `1px solid ${t.border}`,
        boxShadow: "none",
      }}
      onFocus={(e) => (e.target.style.boxShadow = `0 0 0 3px ${t.accentSoft}`)}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Overlay (backdrop + animated panel)                                 */
/* ------------------------------------------------------------------ */

function Overlay({ t, onClose, children, align = "center" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const close = () => {
    setVisible(false);
    setTimeout(onClose, 180);
  };
  const panelPos =
    align === "center"
      ? "items-center justify-center p-4"
      : "items-end sm:items-center justify-center sm:p-4";
  return (
    <div
      className={`fixed inset-0 z-50 flex ${panelPos}`}
      style={{
        background: "rgba(8,9,11,0.55)",
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: visible ? "scale(1) translateY(0)" : align === "center" ? "scale(0.94) translateY(6px)" : "translateY(24px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.24s cubic-bezier(.2,.9,.3,1.2), opacity 0.2s ease",
        }}
        className="w-full"
      >
        {children(close)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

function Landing({ t, onPick }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: t.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: t.accentSoft, border: `1px solid ${t.border}` }}
          >
            <Boxes size={30} color={t.accent} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            Xstock
          </h1>
          <p className="mt-2 text-sm text-center" style={{ color: t.textMuted }}>
            Know what's on your shelf, before you run out.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onPick("signup")}
            className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
            style={{ background: t.accent, color: t.accentText }}
          >
            <UserPlus size={17} /> Sign Up
          </button>
          <button
            onClick={() => onPick("login")}
            className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
            style={{ background: t.surfaceAlt, color: t.text, border: `1px solid ${t.border}` }}
          >
            <LogIn size={17} /> Log In
          </button>
          <button
            onClick={() => onPick("guest")}
            className="w-full rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-opacity duration-150 hover:opacity-70"
            style={{ color: t.textMuted }}
          >
            Continue as Guest <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auth / Onboarding form                                              */
/* ------------------------------------------------------------------ */

function AuthForm({ t, mode, onBack, onSubmit, error, loading }) {
  const isSignup = mode === "signup" || mode === "convert";
  const [form, setForm] = useState({
    fullName: "", shopName: "", shopAddress: "", contact: "", email: "", password: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ background: t.bg }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-6 w-fit transition-opacity hover:opacity-70" style={{ color: t.textMuted }}>
        <ChevronLeft size={17} /> Back
      </button>
      <div className="w-full max-w-sm mx-auto flex-1">
        <h2 className="text-2xl font-bold mb-1" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          {mode === "convert" ? "Link your account" : isSignup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-sm mb-7" style={{ color: t.textMuted }}>
          {mode === "convert" ? "Your guest data stays exactly where it is." : isSignup ? "Set up your shop profile to get started." : "Log in to access your inventory."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <>
              <div>
                <FieldLabel t={t}>Full Name</FieldLabel>
                <TextInput t={t} value={form.fullName} onChange={set("fullName")} placeholder="e.g. Alex Morgan" required />
              </div>
              <div>
                <FieldLabel t={t}>Shop Name</FieldLabel>
                <TextInput t={t} value={form.shopName} onChange={set("shopName")} placeholder="e.g. Morgan Traders" required />
              </div>
              <div>
                <FieldLabel t={t}>Shop Address</FieldLabel>
                <TextInput t={t} value={form.shopAddress} onChange={set("shopAddress")} placeholder="Street, city" />
              </div>
              <div>
                <FieldLabel t={t}>Contact Number</FieldLabel>
                <TextInput t={t} value={form.contact} onChange={set("contact")} placeholder="+1 555 0100" />
              </div>
            </>
          )}
          <div>
            <FieldLabel t={t}>Email Address</FieldLabel>
            <TextInput t={t} type="email" value={form.email} onChange={set("email")} placeholder="you@shop.com" required />
          </div>
          <div>
            <FieldLabel t={t}>{isSignup ? "Create Password" : "Password"}</FieldLabel>
            <TextInput t={t} type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: `${t.danger}1A`, color: t.danger }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
            style={{ background: t.accent, color: t.accentText }}
          >
            {loading ? "Please wait..." : (
              <>{mode === "convert" ? "Link Account" : isSignup ? "Create Account" : "Log In"} <ArrowRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ t, user, onOpenSettings }) {
  return (
    <div
      className="sticky top-0 z-30 px-4 sm:px-8 pt-5 pb-4 flex items-center justify-between"
      style={{
        background: `${t.bg}E6`,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
        >
          {initials(user.fullName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            {user.fullName}'s Stocks
          </h1>
          <p className="text-xs truncate flex items-center gap-1" style={{ color: t.textMuted }}>
            <Building2 size={11} /> {user.shopName}
          </p>
        </div>
      </div>
      <button
        onClick={onOpenSettings}
        className="p-2.5 rounded-full shrink-0 transition-transform duration-150 active:scale-90"
        style={{ background: t.surfaceAlt, border: `1px solid ${t.border}` }}
      >
        <Settings size={18} color={t.text} />
      </button>
    </div>
  );
}

function GuestBanner({ t, onConvert }) {
  return (
    <div className="mx-4 sm:mx-8 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: t.accentSoft, border: `1px solid ${t.border}` }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Link2 size={16} color={t.accent} className="shrink-0" />
        <p className="text-xs sm:text-sm truncate" style={{ color: t.text }}>
          You're browsing as a guest. Link an account to keep this data safe.
        </p>
      </div>
      <button
        onClick={onConvert}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-transform duration-150 active:scale-95"
        style={{ background: t.accent, color: t.accentText }}
      >
        Link
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search bar                                                          */
/* ------------------------------------------------------------------ */

function SearchBar({ t, value, onChange, scopeLabel }) {
  return (
    <div className="sticky top-[73px] z-20 px-4 sm:px-8 py-3" style={{ background: `${t.bg}E6`, backdropFilter: "blur(10px)" }}>
      <div
        className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{ background: t.surface, border: `1px solid ${t.border}` }}
      >
        <Search size={17} color={t.textMuted} className="shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={scopeLabel ? `Search in ${scopeLabel}...` : "Search products across all companies..."}
          className="flex-1 bg-transparent outline-none text-sm min-w-0"
          style={{ color: t.text }}
        />
        {value && (
          <button onClick={() => onChange("")} className="shrink-0">
            <X size={15} color={t.textMuted} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Company grid                                                        */
/* ------------------------------------------------------------------ */

function CompanyGrid({ t, groups, currency, onOpen }) {
  if (groups.length === 0) {
    return <EmptyState t={t} icon={<Building2 size={26} />} title="No companies yet" subtitle="Add your first product to create a company folder." />;
  }
  return (
    <div className="px-4 sm:px-8 pb-28 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 mt-1">
      {groups.map((g, i) => {
        return (
          <button
            key={g.name}
            onClick={() => onOpen(g.name)}
            className="text-left rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 active:scale-[0.97] hover:-translate-y-0.5"
            style={{ background: t.surface, border: `1px solid ${t.border}`, animation: `fadeUp .35s ease ${i * 0.03}s both` }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft }}>
              <Building2 size={20} color={t.accent} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: t.text }}>{g.name}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{g.products.length} product{g.products.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center justify-between mt-1 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <span className="text-[11px] font-mono" style={{ color: t.textMuted }}>Stock value</span>
              <span className="text-xs font-mono font-semibold" style={{ color: t.text }}>{fmtMoney(g.value, currency)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ t, icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: t.surfaceAlt, color: t.textMuted }}>
        {icon}
      </div>
      <p className="font-semibold text-sm" style={{ color: t.text }}>{title}</p>
      <p className="text-xs mt-1 max-w-[220px]" style={{ color: t.textMuted }}>{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product grid + card                                                 */
/* ------------------------------------------------------------------ */

function ProductCard({ t, p, currency, onOpen, index }) {
  return (
    <button
      onClick={() => onOpen(p)}
      className="text-left rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 w-full"
      style={{ background: t.surface, border: `1px solid ${t.border}`, animation: `fadeUp .3s ease ${index * 0.025}s both` }}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.surfaceAlt }}>
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={20} color={t.textMuted} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{p.name}</p>
        <p className="text-[11px] truncate mb-1" style={{ color: t.textMuted }}>{p.company}</p>
        <p className="text-sm font-mono font-semibold" style={{ color: t.accent }}>{fmtMoney(p.retailPrice, currency)}</p>
      </div>
      <StockGauge stock={p.stock} t={t} />
    </button>
  );
}

function ProductGrid({ t, products, currency, onOpen, searching }) {
  if (products.length === 0) {
    return (
      <EmptyState
        t={t}
        icon={searching ? <Search size={22} /> : <Package size={22} />}
        title={searching ? "No matches found" : "No products here yet"}
        subtitle={searching ? "Try a different name or brand." : "Tap the + button to add your first product."}
      />
    );
  }
  return (
    <div className="px-4 sm:px-8 pb-28 flex flex-col gap-2.5 mt-1 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
      {products.map((p, i) => (
        <ProductCard key={p.id} t={t} p={p} currency={currency} onOpen={onOpen} index={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search quick-view row (rich result with all four values)            */
/* ------------------------------------------------------------------ */

function SearchResultRow({ t, p, currency, onOpen, index }) {
  return (
    <button
      onClick={() => onOpen(p)}
      className="text-left rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-150 active:scale-[0.98] w-full"
      style={{ background: t.surface, border: `1px solid ${t.border}`, animation: `fadeUp .3s ease ${index * 0.025}s both` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.surfaceAlt }}>
          {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package size={16} color={t.textMuted} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{p.name}</p>
          <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{p.company}</p>
        </div>
        <StockGauge stock={p.stock} t={t} size={36} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2.5" style={{ borderTop: `1px solid ${t.border}` }}>
        <MiniStat t={t} label="Retail" value={fmtMoney(p.retailPrice, currency)} />
        <MiniStat t={t} label="Floor" value={fmtMoney(p.minPrice, currency)} />
        <MiniStat t={t} label="Cost" value={fmtMoney(p.purchasePrice, currency)} />
      </div>
    </button>
  );
}

function MiniStat({ t, label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: t.textMuted }}>{label}</p>
      <p className="text-xs font-mono font-semibold truncate" style={{ color: t.text }}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product Add/Edit modal                                              */
/* ------------------------------------------------------------------ */

function ProductModal({ t, initial, companies, currency, onClose, onSave, onDelete }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial || { name: "", company: companies[0] || "", image: null, stock: 0, purchasePrice: "", retailPrice: "", minPrice: "" }
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const bump = (delta) => setForm((f) => ({ ...f, stock: Math.max(0, Number(f.stock || 0) + delta) }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.company) return;
    onSave({
      ...form,
      id: form.id || uid(),
      stock: Number(form.stock) || 0,
      purchasePrice: Number(form.purchasePrice) || 0,
      retailPrice: Number(form.retailPrice) || 0,
      minPrice: Number(form.minPrice) || 0,
    });
  };

  return (
    <Overlay t={t} onClose={onClose} align="bottom">
      {(close) => (
        <div
          className="w-full sm:max-w-md sm:mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0" style={{ background: t.surface }}>
            <h3 className="text-base font-bold" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
              {isEdit ? "Edit Product" : "Add Product"}
            </h3>
            <button onClick={close}><X size={19} color={t.textMuted} /></button>
          </div>

          <form onSubmit={submit} className="px-5 pb-6 flex flex-col gap-4">
            {/* image uploader */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInput.current?.click()}
              className="rounded-2xl h-32 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150 overflow-hidden relative"
              style={{ background: t.bg, border: `1.5px dashed ${dragOver ? t.accent : t.border}` }}
            >
              {form.image ? (
                <img src={form.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={20} color={t.textMuted} />
                  <p className="text-xs" style={{ color: t.textMuted }}>Drag & drop, or tap to choose</p>
                </>
              )}
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <div>
              <FieldLabel t={t}>Product Name</FieldLabel>
              <TextInput t={t} value={form.name} onChange={set("name")} placeholder="e.g. Instant Coffee 200g" required />
            </div>

            <div>
              <FieldLabel t={t}>Company / Brand Name</FieldLabel>
              <TextInput t={t} value={form.company} onChange={set("company")} placeholder="e.g. Solvora Foods" list="company-list" required />
              <datalist id="company-list">
                {companies.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <FieldLabel t={t}>Remaining Stock</FieldLabel>
              <div className="flex items-center gap-3">
                <IconBtn t={t} onClick={() => bump(-1)}><Minus size={15} /></IconBtn>
                <span className="flex-1 text-center text-xl font-mono font-bold" style={{ color: t.text }}>{form.stock}</span>
                <IconBtn t={t} onClick={() => bump(1)}><Plus size={15} /></IconBtn>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel t={t}>Purchase Price</FieldLabel>
                <TextInput t={t} type="number" step="0.01" min="0" value={form.purchasePrice} onChange={set("purchasePrice")} placeholder="0.00" required />
              </div>
              <div>
                <FieldLabel t={t}>Retail Price</FieldLabel>
                <TextInput t={t} type="number" step="0.01" min="0" value={form.retailPrice} onChange={set("retailPrice")} placeholder="0.00" required />
              </div>
            </div>
            <div>
              <FieldLabel t={t}>Minimum Selling Price</FieldLabel>
              <TextInput t={t} type="number" step="0.01" min="0" value={form.minPrice} onChange={set("minPrice")} placeholder="Floor price alert" required />
            </div>

            <div className="flex gap-2.5 mt-1">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => { onDelete(form.id); }}
                  className="rounded-xl px-4 py-3 transition-transform duration-150 active:scale-95"
                  style={{ background: `${t.danger}1A`, color: t.danger, border: `1px solid ${t.border}` }}
                >
                  <Trash2 size={17} />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-transform duration-150 active:scale-[0.98]"
                style={{ background: t.accent, color: t.accentText }}
              >
                {isEdit ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/* Product detail drawer                                               */
/* ------------------------------------------------------------------ */

function ProductDrawer({ t, product, currency, onClose, onEdit, onAdjust }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 200); };

  const margin = product.retailPrice - product.purchasePrice;
  const marginPct = product.purchasePrice > 0 ? (margin / product.purchasePrice) * 100 : 0;
  const totalValue = product.stock * product.purchasePrice;
  const belowFloor = product.retailPrice < product.minPrice;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-end" onClick={close}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8,9,11,0.55)", backdropFilter: "blur(6px)", opacity: visible ? 1 : 0, transition: "opacity .2s ease" }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:w-[420px] sm:h-full rounded-t-3xl sm:rounded-none sm:rounded-l-3xl overflow-y-auto max-h-[92vh] sm:max-h-full mt-auto sm:mt-0"
        style={{
          background: t.surface,
          borderLeft: `1px solid ${t.border}`,
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform .28s cubic-bezier(.2,.9,.3,1.05)",
        }}
      >
        <div className="h-1.5 w-10 rounded-full mx-auto mt-3 sm:hidden" style={{ background: t.border }} />
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>Product Details</span>
          <button onClick={close}><X size={19} color={t.textMuted} /></button>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-5">
          <div className="w-full h-44 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: t.surfaceAlt }}>
            {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Package size={36} color={t.textMuted} />}
          </div>

          <div>
            <p className="text-lg font-bold" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>{product.name}</p>
            <p className="text-sm" style={{ color: t.textMuted }}>{product.company}</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: t.surfaceAlt }}>
            <div>
              <p className="text-xs" style={{ color: t.textMuted }}>Remaining stock</p>
              <p className="text-2xl font-mono font-bold" style={{ color: t.text }}>{product.stock}</p>
            </div>
            <div className="flex items-center gap-2">
              <IconBtn t={t} onClick={() => onAdjust(product.id, -1)}><Minus size={15} /></IconBtn>
              <IconBtn t={t} onClick={() => onAdjust(product.id, 1)}><Plus size={15} /></IconBtn>
            </div>
          </div>

          {belowFloor && (
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: `${t.danger}1A`, border: `1px solid ${t.danger}44` }}>
              <AlertTriangle size={15} color={t.danger} className="shrink-0" />
              <p className="text-xs" style={{ color: t.danger }}>Retail price is below the minimum selling threshold.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard t={t} label="Purchase Price" value={fmtMoney(product.purchasePrice, currency)} />
            <StatCard t={t} label="Retail Price" value={fmtMoney(product.retailPrice, currency)} accent />
            <StatCard t={t} label="Min. Selling Price" value={fmtMoney(product.minPrice, currency)} />
            <StatCard t={t} label="Profit Margin" value={`${fmtMoney(margin, currency)} · ${marginPct.toFixed(0)}%`} good={margin >= 0} />
          </div>

          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: t.accentSoft }}>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} color={t.accent} />
              <span className="text-sm font-medium" style={{ color: t.text }}>Total inventory value</span>
            </div>
            <span className="text-sm font-mono font-bold" style={{ color: t.text }}>{fmtMoney(totalValue, currency)}</span>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => onEdit(product)}
              className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform duration-150 active:scale-[0.98]"
              style={{ background: t.accent, color: t.accentText }}
            >
              <Edit3 size={15} /> Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ t, label, value, accent, good }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: t.surfaceAlt }}>
      <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: t.textMuted }}>{label}</p>
      <p className="text-sm font-mono font-bold" style={{ color: good === false ? t.danger : accent ? t.accent : t.text }}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings panel                                                      */
/* ------------------------------------------------------------------ */

function SettingsPanel({ t, themeKey, setThemeKey, currency, setCurrency, user, onClose, onConvert, onLogout }) {
  return (
    <Overlay t={t} onClose={onClose} align="bottom">
      {(close) => (
        <div
          className="w-full sm:max-w-md sm:mx-auto rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0" style={{ background: t.surface }}>
            <h3 className="text-base font-bold" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h3>
            <button onClick={close}><X size={19} color={t.textMuted} /></button>
          </div>

          <div className="px-5 pb-8 flex flex-col gap-6">
            {user.isGuest && (
              <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: t.accentSoft }}>
                <div className="flex items-center gap-2">
                  <Link2 size={16} color={t.accent} />
                  <p className="text-sm font-semibold" style={{ color: t.text }}>You're in guest mode</p>
                </div>
                <p className="text-xs" style={{ color: t.textMuted }}>Link an account to back up your inventory — nothing you've saved will be lost.</p>
                <button
                  onClick={onConvert}
                  className="mt-1 rounded-xl py-2.5 text-sm font-semibold transition-transform duration-150 active:scale-[0.98]"
                  style={{ background: t.accent, color: t.accentText }}
                >
                  Link via Log In / Sign Up
                </button>
              </div>
            )}

            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surfaceAlt }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: t.accentSoft, color: t.accent }}>
                {initials(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{user.fullName}</p>
                <p className="text-xs truncate" style={{ color: t.textMuted }}>{user.shopName}{user.email ? ` · ${user.email}` : ""}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: t.textMuted }}>
                <Palette size={13} /> Theme
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(THEMES).map(([key, th]) => (
                  <button
                    key={key}
                    onClick={() => setThemeKey(key)}
                    className="rounded-xl p-3 flex items-center gap-2.5 transition-transform duration-150 active:scale-[0.97]"
                    style={{ background: th.bg, border: `2px solid ${themeKey === key ? t.accent : t.border}` }}
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      {th.swatch.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full" style={{ background: c, border: `1.5px solid ${th.bg}` }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium truncate" style={{ color: th.text }}>{th.label}</span>
                    {themeKey === key && <Check size={13} color={t.accent} className="ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel t={t}>Currency</FieldLabel>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
                style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}
              >
                {CURRENCIES.map(([code, name, sym]) => (
                  <option key={code} value={code}>{code} — {name} ({sym})</option>
                ))}
              </select>
            </div>

            <button
              onClick={onLogout}
              className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
              style={{ background: `${t.danger}1A`, color: t.danger, border: `1px solid ${t.border}` }}
            >
              <LogOut size={15} /> Log Out
            </button>
          </div>
        </div>
      )}
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ t, user, products, setProducts, themeKey, setThemeKey, currency, setCurrency, onConvert, onLogout }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [modalProduct, setModalProduct] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [drawerProduct, setDrawerProduct] = useState(null);

  const groups = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (!map[p.company]) map[p.company] = { name: p.company, products: [], value: 0 };
      map[p.company].products.push(p);
      map[p.company].value += p.stock * p.purchasePrice;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const companyNames = useMemo(() => [...new Set(products.map((p) => p.company))], [products]);

  const scoped = selectedCompany ? products.filter((p) => p.company === selectedCompany) : products;
  const filtered = query.trim()
    ? scoped.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : scoped;

  const openProduct = (p) => setDrawerProduct(p);

  const saveProduct = async (p) => {
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    setModalProduct(undefined);
    setDrawerProduct((d) => (d && d.id === p.id ? p : d));
    if (!user.isGuest) {
      await supabase.from("products").upsert(toDbProduct(p, user.id));
    }
  };

  const deleteProduct = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setModalProduct(undefined);
    setDrawerProduct(null);
    if (!user.isGuest) {
      await supabase.from("products").delete().eq("id", id);
    }
  };

  const adjustStock = async (id, delta) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const newStock = Math.max(0, current.stock + delta);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
    setDrawerProduct((d) => (d && d.id === id ? { ...d, stock: newStock } : d));
    if (!user.isGuest) {
      await supabase.from("products").update({ stock: newStock }).eq("id", id);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: t.bg }}>
      <Header t={t} user={user} onOpenSettings={() => setShowSettings(true)} />
      {user.isGuest && <GuestBanner t={t} onConvert={onConvert} />}
      <SearchBar t={t} value={query} onChange={setQuery} scopeLabel={selectedCompany} />

      {selectedCompany && (
        <div className="px-4 sm:px-8 pt-1 pb-1">
          <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70" style={{ color: t.accent }}>
            <ChevronLeft size={16} /> All companies
          </button>
          <p className="text-xl font-bold mt-2" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>{selectedCompany}</p>
        </div>
      )}

      {query.trim() ? (
        <div className="px-4 sm:px-8 pb-28 flex flex-col gap-2.5 mt-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState t={t} icon={<Search size={22} />} title="No matches found" subtitle="Try a different product name." />
            </div>
          ) : (
            filtered.map((p, i) => <SearchResultRow key={p.id} t={t} p={p} currency={currency} onOpen={openProduct} index={i} />)
          )}
        </div>
      ) : selectedCompany ? (
        <ProductGrid t={t} products={filtered} currency={currency} onOpen={openProduct} />
      ) : (
        <CompanyGrid t={t} groups={groups} currency={currency} onOpen={setSelectedCompany} />
      )}

      {/* FAB */}
      <button
        onClick={() => setModalProduct(null)}
        className="fixed bottom-6 right-5 sm:right-10 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 active:scale-90"
        style={{ background: t.accent, color: t.accentText, boxShadow: `0 8px 24px ${t.accentSoft}` }}
      >
        <Plus size={24} />
      </button>

      {modalProduct !== undefined && (
        <ProductModal
          t={t}
          initial={modalProduct}
          companies={companyNames}
          currency={currency}
          onClose={() => setModalProduct(undefined)}
          onSave={saveProduct}
          onDelete={deleteProduct}
        />
      )}

      {drawerProduct && (
        <ProductDrawer
          t={t}
          product={drawerProduct}
          currency={currency}
          onClose={() => setDrawerProduct(null)}
          onEdit={(p) => { setModalProduct(p); }}
          onAdjust={adjustStock}
        />
      )}

      {showSettings && (
        <SettingsPanel
          t={t}
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          currency={currency}
          setCurrency={setCurrency}
          user={user}
          onClose={() => setShowSettings(false)}
          onConvert={() => { setShowSettings(false); onConvert(); }}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root App                                                             */
/* ------------------------------------------------------------------ */

export default function App() {
  const [themeKey, setThemeKey] = useState("dark");
  const [currency, setCurrency] = useState("USD");
  const [view, setView] = useState("landing"); // landing | signup | login | convert | dashboard
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const t = THEMES[themeKey];

  // Restore a logged-in session on page load/refresh
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserFromSession(session);
      setCheckingSession(false);
    });
  }, []);

  async function loadUserFromSession(session) {
    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    // Self-heal: if no profile row exists yet (e.g. it failed to save during signup), create a basic one now.
    if (!profile) {
      const fallback = {
        id: session.user.id,
        full_name: "Shop Owner",
        shop_name: "My Shop",
        shop_address: "",
        contact: "",
        email: session.user.email,
      };
      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert(fallback)
        .select()
        .single();
      if (!createErr) profile = created;
    }

    setUser({
      id: session.user.id,
      fullName: profile?.full_name || "Shop Owner",
      shopName: profile?.shop_name || "My Shop",
      shopAddress: profile?.shop_address || "",
      contact: profile?.contact || "",
      email: session.user.email,
      isGuest: false,
    });
    const { data: rows } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", session.user.id);
    setProducts((rows || []).map(fromDbProduct));
    setView("dashboard");
  }

  const handlePick = (mode) => {
    setAuthError("");
    if (mode === "guest") {
      setUser({ fullName: "Guest", shopName: "My Shop", isGuest: true });
      setProducts(SEED_PRODUCTS);
      setView("dashboard");
    } else {
      setView(mode);
    }
  };

  const handleSignup = async (form) => {
    setAuthError("");
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    setAuthLoading(false);
    if (error) return setAuthError(error.message);
    if (!data.user) return setAuthError("Something went wrong. Please try again.");

    if (data.session) {
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: form.fullName || "Shop Owner",
        shop_name: form.shopName || "My Shop",
        shop_address: form.shopAddress,
        contact: form.contact,
        email: form.email,
      });
      if (profileErr) console.warn("Profile save failed, will self-heal on next login:", profileErr.message);
      setUser({
        id: data.user.id,
        fullName: form.fullName || "Shop Owner",
        shopName: form.shopName || "My Shop",
        shopAddress: form.shopAddress,
        contact: form.contact,
        email: form.email,
        isGuest: false,
      });
      setProducts([]);
      setView("dashboard");
    } else {
      setAuthError("Account created! Check your email to confirm it, then log in.");
    }
  };

  const handleLogin = async (form) => {
    setAuthError("");
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setAuthLoading(false);
    if (error) return setAuthError(error.message);
    if (data.session) await loadUserFromSession(data.session);
  };

  const handleConvertSubmit = async (form) => {
    setAuthError("");
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    setAuthLoading(false);
    if (error) return setAuthError(error.message);
    if (!data.user) return setAuthError("Something went wrong. Please try again.");

    if (data.session) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: form.fullName || "Shop Owner",
        shop_name: form.shopName || "My Shop",
        shop_address: form.shopAddress,
        contact: form.contact,
        email: form.email,
      });
    }

    if (products.length) {
      await supabase.from("products").insert(products.map((p) => toDbProduct(p, data.user.id)));
    }

    if (data.session) {
      setUser({
        id: data.user.id,
        fullName: form.fullName || "Shop Owner",
        shopName: form.shopName || "My Shop",
        shopAddress: form.shopAddress,
        contact: form.contact,
        email: form.email,
        isGuest: false,
      });
      setView("dashboard");
    } else {
      setAuthError("Account created! Check your email to confirm it, then log in.");
    }
  };

  const handleConvert = () => { setAuthError(""); setView("convert"); };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProducts(SEED_PRODUCTS);
    setView("landing");
  };

  if (checkingSession) {
    return <div style={{ background: t.bg, minHeight: "100vh" }} />;
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; }
        ::selection { background: ${t.accentSoft}; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {view === "landing" && <Landing t={t} onPick={handlePick} />}
      {view === "signup" && (
        <AuthForm t={t} mode="signup" onBack={() => setView("landing")} onSubmit={handleSignup} error={authError} loading={authLoading} />
      )}
      {view === "login" && (
        <AuthForm t={t} mode="login" onBack={() => setView("landing")} onSubmit={handleLogin} error={authError} loading={authLoading} />
      )}
      {view === "convert" && (
        <AuthForm
          t={t}
          mode="convert"
          onBack={() => setView("dashboard")}
          onSubmit={handleConvertSubmit}
          error={authError}
          loading={authLoading}
        />
      )}
      {view === "dashboard" && user && (
        <Dashboard
          t={t}
          user={user}
          products={products}
          setProducts={setProducts}
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          currency={currency}
          setCurrency={setCurrency}
          onConvert={handleConvert}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
 ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const THEMES = {
  dark: {
    label: "Dark Mode",
    bg: "#14171B",
    surface: "#1D2126",
    surfaceAlt: "#252A30",
    surfaceRaise: "#2B3138",
    border: "#31373E",
    text: "#EAEDF0",
    textMuted: "#8B94A0",
    accent: "#2DD4E8",
    accentText: "#06282C",
    accentSoft: "rgba(45,212,232,0.14)",
    danger: "#F2685C",
    warn: "#E8B94D",
    good: "#3DDC97",
    swatch: ["#14171B", "#2DD4E8", "#252A30"],
  },
  olive: {
    label: "Olive Green Dark",
    bg: "#1C241B",
    surface: "#26301F",
    surfaceAlt: "#2E3A26",
    surfaceRaise: "#354028",
    border: "#3E4B33",
    text: "#EEF1E6",
    textMuted: "#A6B096",
    accent: "#D4AF37",
    accentText: "#2C2408",
    accentSoft: "rgba(212,175,55,0.16)",
    danger: "#E07A5F",
    warn: "#E0B84A",
    good: "#8FBF6F",
    swatch: ["#1C241B", "#D4AF37", "#26301F"],
  },
  red: {
    label: "Rich Red & Black",
    bg: "#0C0B0D",
    surface: "#171214",
    surfaceAlt: "#201A1C",
    surfaceRaise: "#2A2124",
    border: "#372A2D",
    text: "#F4EBEA",
    textMuted: "#AC9291",
    accent: "#C6828F",
    accentText: "#2A0F13",
    accentSoft: "rgba(198,130,143,0.16)",
    danger: "#E1483A",
    warn: "#DE9C55",
    good: "#7DAE8B",
    swatch: ["#0C0B0D", "#8B1E2B", "#C6828F"],
  },
  light: {
    label: "Light Modern",
    bg: "#F6F6F3",
    surface: "#FFFFFF",
    surfaceAlt: "#F0F1EE",
    surfaceRaise: "#FFFFFF",
    border: "#E3E4E0",
    text: "#1C1F23",
    textMuted: "#6B7178",
    accent: "#3767E0",
    accentText: "#FFFFFF",
    accentSoft: "rgba(55,103,224,0.10)",
    danger: "#D8433A",
    warn: "#C17A1E",
    good: "#1E9165",
    swatch: ["#F6F6F3", "#3767E0", "#FFFFFF"],
  },
};

const CURRENCIES = [
  ["USD","US Dollar","$"],["EUR","Euro","€"],["GBP","British Pound","£"],
  ["PKR","Pakistani Rupee","₨"],["INR","Indian Rupee","₹"],["AED","UAE Dirham","د.إ"],
  ["SAR","Saudi Riyal","﷼"],["CAD","Canadian Dollar","$"],["AUD","Australian Dollar","$"],
  ["NZD","New Zealand Dollar","$"],["CHF","Swiss Franc","Fr"],["SGD","Singapore Dollar","$"],
  ["HKD","Hong Kong Dollar","$"],["JPY","Japanese Yen","¥"],["CNY","Chinese Yuan","¥"],
  ["KRW","South Korean Won","₩"],["MYR","Malaysian Ringgit","RM"],["THB","Thai Baht","฿"],
  ["IDR","Indonesian Rupiah","Rp"],["PHP","Philippine Peso","₱"],["VND","Vietnamese Dong","₫"],
  ["BDT","Bangladeshi Taka","৳"],["LKR","Sri Lankan Rupee","₨"],["NPR","Nepalese Rupee","₨"],
  ["TRY","Turkish Lira","₺"],["RUB","Russian Ruble","₽"],["ZAR","South African Rand","R"],
  ["NGN","Nigerian Naira","₦"],["EGP","Egyptian Pound","£"],["KES","Kenyan Shilling","KSh"],
  ["BRL","Brazilian Real","R$"],["MXN","Mexican Peso","$"],["ARS","Argentine Peso","$"],
  ["SEK","Swedish Krona","kr"],["NOK","Norwegian Krone","kr"],["DKK","Danish Krone","kr"],
  ["PLN","Polish Zloty","zł"],["CZK","Czech Koruna","Kč"],["ILS","Israeli Shekel","₪"],
  ["QAR","Qatari Riyal","﷼"],["KWD","Kuwaiti Dinar","د.ك"],["OMR","Omani Rial","﷼"],
  ["JOD","Jordanian Dinar","د.ا"],["BHD","Bahraini Dinar",".د.ب"],
];

function fmtMoney(value, code) {
  const v = Number(value) || 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(v);
  } catch {
    const c = CURRENCIES.find((x) => x[0] === code);
    return `${c ? c[2] : code} ${v.toFixed(2)}`;
  }
}

function initials(name) {
  if (!name) return "X";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const SEED_PRODUCTS = [
  { id: uid(), name: "Instant Coffee 200g", company: "Solvora Foods", image: null, stock: 34, purchasePrice: 3.2, retailPrice: 5.5, minPrice: 4.0 },
  { id: uid(), name: "Noodles Family Pack", company: "Solvora Foods", image: null, stock: 6, purchasePrice: 1.1, retailPrice: 2.0, minPrice: 1.6 },
  { id: uid(), name: "Chocolate Wafer Bar", company: "Solvora Foods", image: null, stock: 58, purchasePrice: 0.6, retailPrice: 1.25, minPrice: 0.9 },
  { id: uid(), name: "Herbal Soap 100g", company: "Meridia Home", image: null, stock: 12, purchasePrice: 0.9, retailPrice: 1.8, minPrice: 1.3 },
  { id: uid(), name: "Black Tea 500g", company: "Meridia Home", image: null, stock: 3, purchasePrice: 4.0, retailPrice: 6.75, minPrice: 5.2 },
  { id: uid(), name: "Shampoo 350ml", company: "Meridia Home", image: null, stock: 21, purchasePrice: 2.4, retailPrice: 4.3, minPrice: 3.3 },
  { id: uid(), name: "Basmati Rice 5kg", company: "Harvest Row", image: null, stock: 17, purchasePrice: 8.5, retailPrice: 12.0, minPrice: 9.8 },
  { id: uid(), name: "Wild Honey 500g", company: "Harvest Row", image: null, stock: 9, purchasePrice: 6.1, retailPrice: 10.5, minPrice: 7.9 },
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function IconBtn({ t, onClick, children, title, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="transition-all duration-150 active:scale-90 rounded-full p-2 flex items-center justify-center"
      style={{
        background: t.surfaceAlt,
        color: danger ? t.danger : t.text,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </button>
  );
}

function StockGauge({ stock, t, size = 44, low = 5, warn = 12 }) {
  const ratio = stock / (warn * 1.6);
  const pct = Math.max(0.04, Math.min(1, ratio));
  const status = stock <= 0 ? "out" : stock <= low ? "low" : stock <= warn ? "warn" : "good";
  const color = status === "out" || status === "low" ? t.danger : status === "warn" ? t.warn : t.good;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={t.border} strokeWidth="4" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span className="absolute font-mono font-semibold" style={{ fontSize: size * 0.28, color: t.text }}>
        {stock}
      </span>
    </div>
  );
}

function FieldLabel({ t, children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: t.textMuted }}>
      {children}
    </label>
  );
}

function TextInput({ t, ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-shadow duration-150 focus:ring-2"
      style={{
        background: t.bg,
        color: t.text,
        border: `1px solid ${t.border}`,
        boxShadow: "none",
      }}
      onFocus={(e) => (e.target.style.boxShadow = `0 0 0 3px ${t.accentSoft}`)}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Overlay (backdrop + animated panel)                                 */
/* ------------------------------------------------------------------ */

function Overlay({ t, onClose, children, align = "center" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const close = () => {
    setVisible(false);
    setTimeout(onClose, 180);
  };
  const panelPos =
    align === "center"
      ? "items-center justify-center p-4"
      : "items-end sm:items-center justify-center sm:p-4";
  return (
    <div
      className={`fixed inset-0 z-50 flex ${panelPos}`}
      style={{
        background: "rgba(8,9,11,0.55)",
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: visible ? "scale(1) translateY(0)" : align === "center" ? "scale(0.94) translateY(6px)" : "translateY(24px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.24s cubic-bezier(.2,.9,.3,1.2), opacity 0.2s ease",
        }}
        className="w-full"
      >
        {children(close)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

function Landing({ t, onPick }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: t.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: t.accentSoft, border: `1px solid ${t.border}` }}
          >
            <Boxes size={30} color={t.accent} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            Xstock
          </h1>
          <p className="mt-2 text-sm text-center" style={{ color: t.textMuted }}>
            Know what's on your shelf, before you run out.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onPick("signup")}
            className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
            style={{ background: t.accent, color: t.accentText }}
          >
            <UserPlus size={17} /> Sign Up
          </button>
          <button
            onClick={() => onPick("login")}
            className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
            style={{ background: t.surfaceAlt, color: t.text, border: `1px solid ${t.border}` }}
          >
            <LogIn size={17} /> Log In
          </button>
          <button
            onClick={() => onPick("guest")}
            className="w-full rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-opacity duration-150 hover:opacity-70"
            style={{ color: t.textMuted }}
          >
            Continue as Guest <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auth / Onboarding form                                              */
/* ------------------------------------------------------------------ */

function AuthForm({ t, mode, onBack, onSubmit, error, loading }) {
  const isSignup = mode === "signup" || mode === "convert";
  const [form, setForm] = useState({
    fullName: "", shopName: "", shopAddress: "", contact: "", email: "", password: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ background: t.bg }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-6 w-fit transition-opacity hover:opacity-70" style={{ color: t.textMuted }}>
        <ChevronLeft size={17} /> Back
      </button>
      <div className="w-full max-w-sm mx-auto flex-1">
        <h2 className="text-2xl font-bold mb-1" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          {mode === "convert" ? "Link your account" : isSignup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-sm mb-7" style={{ color: t.textMuted }}>
          {mode === "convert" ? "Your guest data stays exactly where it is." : isSignup ? "Set up your shop profile to get started." : "Log in to access your inventory."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <>
              <div>
                <FieldLabel t={t}>Full Name</FieldLabel>
                <TextInput t={t} value={form.fullName} onChange={set("fullName")} placeholder="e.g. Alex Morgan" required />
              </div>
              <div>
                <FieldLabel t={t}>Shop Name</FieldLabel>
                <TextInput t={t} value={form.shopName} onChange={set("shopName")} placeholder="e.g. Morgan Traders" required />
              </div>
              <div>
                <FieldLabel t={t}>Shop Address</FieldLabel>
                <TextInput t={t} value={form.shopAddress} onChange={set("shopAddress")} placeholder="Street, city" />
              </div>
              <div>
                <FieldLabel t={t}>Contact Number</FieldLabel>
                <TextInput t={t} value={form.contact} onChange={set("contact")} placeholder="+1 555 0100" />
              </div>
            </>
          )}
          <div>
            <FieldLabel t={t}>Email Address</FieldLabel>
            <TextInput t={t} type="email" value={form.email} onChange={set("email")} placeholder="you@shop.com" required />
          </div>
          <div>
            <FieldLabel t={t}>{isSignup ? "Create Password" : "Password"}</FieldLabel>
            <TextInput t={t} type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: `${t.danger}1A`, color: t.danger }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
            style={{ background: t.accent, color: t.accentText }}
          >
            {loading ? "Please wait..." : (
              <>{mode === "convert" ? "Link Account" : isSignup ? "Create Account" : "Log In"} <ArrowRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ t, user, onOpenSettings }) {
  return (
    <div
      className="sticky top-0 z-30 px-4 sm:px-8 pt-5 pb-4 flex items-center justify-between"
      style={{
        background: `${t.bg}E6`,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
        >
          {initials(user.fullName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            {user.fullName}'s Stocks
          </h1>
          <p className="text-xs truncate flex items-center gap-1" style={{ color: t.textMuted }}>
            <Building2 size={11} /> {user.shopName}
          </p>
        </div>
      </div>
      <button
        onClick={onOpenSettings}
        className="p-2.5 rounded-full shrink-0 transition-transform duration-150 active:scale-90"
        style={{ background: t.surfaceAlt, border: `1px solid ${t.border}` }}
      >
        <Settings size={18} color={t.text} />
      </button>
    </div>
  );
}

function GuestBanner({ t, onConvert }) {
  return (
    <div className="mx-4 sm:mx-8 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: t.accentSoft, border: `1px solid ${t.border}` }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Link2 size={16} color={t.accent} className="shrink-0" />
        <p className="text-xs sm:text-sm truncate" style={{ color: t.text }}>
          You're browsing as a guest. Link an account to keep this data safe.
        </p>
      </div>
      <button
        onClick={onConvert}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-transform duration-150 active:scale-95"
        style={{ background: t.accent, color: t.accentText }}
      >
        Link
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search bar                                                          */
/* ------------------------------------------------------------------ */

function SearchBar({ t, value, onChange, scopeLabel }) {
  return (
    <div className="sticky top-[73px] z-20 px-4 sm:px-8 py-3" style={{ background: `${t.bg}E6`, backdropFilter: "blur(10px)" }}>
      <div
        className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{ background: t.surface, border: `1px solid ${t.border}` }}
      >
        <Search size={17} color={t.textMuted} className="shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={scopeLabel ? `Search in ${scopeLabel}...` : "Search products across all companies..."}
          className="flex-1 bg-transparent outline-none text-sm min-w-0"
          style={{ color: t.text }}
        />
        {value && (
          <button onClick={() => onChange("")} className="shrink-0">
            <X size={15} color={t.textMuted} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Company grid                                                        */
/* ------------------------------------------------------------------ */

function CompanyGrid({ t, groups, currency, onOpen }) {
  if (groups.length === 0) {
    return <EmptyState t={t} icon={<Building2 size={26} />} title="No companies yet" subtitle="Add your first product to create a company folder." />;
  }
  return (
    <div className="px-4 sm:px-8 pb-28 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 mt-1">
      {groups.map((g, i) => {
        return (
          <button
            key={g.name}
            onClick={() => onOpen(g.name)}
            className="text-left rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 active:scale-[0.97] hover:-translate-y-0.5"
            style={{ background: t.surface, border: `1px solid ${t.border}`, animation: `fadeUp .35s ease ${i * 0.03}s both` }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft }}>
              <Building2 size={20} color={t.accent} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: t.text }}>{g.name}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{g.products.length} product{g.products.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center justify-between mt-1 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <span className="text-[11px] font-mono" style={{ color: t.textMuted }}>Stock value</span>
              <span className="text-xs font-mono font-semibold" style={{ color: t.text }}>{fmtMoney(g.value, currency)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ t, icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: t.surfaceAlt, color: t.textMuted }}>
        {icon}
      </div>
      <p className="font-semibold text-sm" style={{ color: t.text }}>{title}</p>
      <p className="text-xs mt-1 max-w-[220px]" style={{ color: t.textMuted }}>{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product grid + card                                                 */
/* ------------------------------------------------------------------ */

function ProductCard({ t, p, currency, onOpen, index }) {
  return (
    <button
      onClick={() => onOpen(p)}
      className="text-left rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 w-full"
      style={{ background: t.surface, border: `1px solid ${t.border}`, animation: `fadeUp .3s ease ${index * 0.025}s both` }}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.surfaceAlt }}>
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={20} color={t.textMuted} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{p.name}</p>
        <p className="text-[11px] truncate mb-1" style={{ color: t.textMuted }}>{p.company}</p>
        <p className="text-sm font-mono font-semibold" style={{ color: t.accent }}>{fmtMoney(p.retailPrice, currency)}</p>
      </div>
      <StockGauge stock={p.stock} t={t} />
    </button>
  );
}

function ProductGrid({ t, products, currency, onOpen, searching }) {
  if (products.length === 0) {
    return (
      <EmptyState
        t={t}
        icon={searching ? <Search size={22} /> : <Package size={22} />}
        title={searching ? "No matches found" : "No products here yet"}
        subtitle={searching ? "Try a different name or brand." : "Tap the + button to add your first product."}
      />
    );
  }
  return (
    <div className="px-4 sm:px-8 pb-28 flex flex-col gap-2.5 mt-1 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
      {products.map((p, i) => (
        <ProductCard key={p.id} t={t} p={p} currency={currency} onOpen={onOpen} index={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search quick-view row (rich result with all four values)            */
/* ------------------------------------------------------------------ */

function SearchResultRow({ t, p, currency, onOpen, index }) {
  return (
    <button
      onClick={() => onOpen(p)}
      className="text-left rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-150 active:scale-[0.98] w-full"
      style={{ background: t.surface, border: `1px solid ${t.border}`, animation: `fadeUp .3s ease ${index * 0.025}s both` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: t.surfaceAlt }}>
          {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package size={16} color={t.textMuted} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{p.name}</p>
          <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{p.company}</p>
        </div>
        <StockGauge stock={p.stock} t={t} size={36} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2.5" style={{ borderTop: `1px solid ${t.border}` }}>
        <MiniStat t={t} label="Retail" value={fmtMoney(p.retailPrice, currency)} />
        <MiniStat t={t} label="Floor" value={fmtMoney(p.minPrice, currency)} />
        <MiniStat t={t} label="Cost" value={fmtMoney(p.purchasePrice, currency)} />
      </div>
    </button>
  );
}

function MiniStat({ t, label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: t.textMuted }}>{label}</p>
      <p className="text-xs font-mono font-semibold truncate" style={{ color: t.text }}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product Add/Edit modal                                              */
/* ------------------------------------------------------------------ */

function ProductModal({ t, initial, companies, currency, onClose, onSave, onDelete }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial || { name: "", company: companies[0] || "", image: null, stock: 0, purchasePrice: "", retailPrice: "", minPrice: "" }
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const bump = (delta) => setForm((f) => ({ ...f, stock: Math.max(0, Number(f.stock || 0) + delta) }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.company) return;
    onSave({
      ...form,
      id: form.id || uid(),
      stock: Number(form.stock) || 0,
      purchasePrice: Number(form.purchasePrice) || 0,
      retailPrice: Number(form.retailPrice) || 0,
      minPrice: Number(form.minPrice) || 0,
    });
  };

  return (
    <Overlay t={t} onClose={onClose} align="bottom">
      {(close) => (
        <div
          className="w-full sm:max-w-md sm:mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0" style={{ background: t.surface }}>
            <h3 className="text-base font-bold" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>
              {isEdit ? "Edit Product" : "Add Product"}
            </h3>
            <button onClick={close}><X size={19} color={t.textMuted} /></button>
          </div>

          <form onSubmit={submit} className="px-5 pb-6 flex flex-col gap-4">
            {/* image uploader */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInput.current?.click()}
              className="rounded-2xl h-32 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150 overflow-hidden relative"
              style={{ background: t.bg, border: `1.5px dashed ${dragOver ? t.accent : t.border}` }}
            >
              {form.image ? (
                <img src={form.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={20} color={t.textMuted} />
                  <p className="text-xs" style={{ color: t.textMuted }}>Drag & drop, or tap to choose</p>
                </>
              )}
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <div>
              <FieldLabel t={t}>Product Name</FieldLabel>
              <TextInput t={t} value={form.name} onChange={set("name")} placeholder="e.g. Instant Coffee 200g" required />
            </div>

            <div>
              <FieldLabel t={t}>Company / Brand Name</FieldLabel>
              <TextInput t={t} value={form.company} onChange={set("company")} placeholder="e.g. Solvora Foods" list="company-list" required />
              <datalist id="company-list">
                {companies.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <FieldLabel t={t}>Remaining Stock</FieldLabel>
              <div className="flex items-center gap-3">
                <IconBtn t={t} onClick={() => bump(-1)}><Minus size={15} /></IconBtn>
                <span className="flex-1 text-center text-xl font-mono font-bold" style={{ color: t.text }}>{form.stock}</span>
                <IconBtn t={t} onClick={() => bump(1)}><Plus size={15} /></IconBtn>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel t={t}>Purchase Price</FieldLabel>
                <TextInput t={t} type="number" step="0.01" min="0" value={form.purchasePrice} onChange={set("purchasePrice")} placeholder="0.00" required />
              </div>
              <div>
                <FieldLabel t={t}>Retail Price</FieldLabel>
                <TextInput t={t} type="number" step="0.01" min="0" value={form.retailPrice} onChange={set("retailPrice")} placeholder="0.00" required />
              </div>
            </div>
            <div>
              <FieldLabel t={t}>Minimum Selling Price</FieldLabel>
              <TextInput t={t} type="number" step="0.01" min="0" value={form.minPrice} onChange={set("minPrice")} placeholder="Floor price alert" required />
            </div>

            <div className="flex gap-2.5 mt-1">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => { onDelete(form.id); }}
                  className="rounded-xl px-4 py-3 transition-transform duration-150 active:scale-95"
                  style={{ background: `${t.danger}1A`, color: t.danger, border: `1px solid ${t.border}` }}
                >
                  <Trash2 size={17} />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-transform duration-150 active:scale-[0.98]"
                style={{ background: t.accent, color: t.accentText }}
              >
                {isEdit ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/* Product detail drawer                                               */
/* ------------------------------------------------------------------ */

function ProductDrawer({ t, product, currency, onClose, onEdit, onAdjust }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 200); };

  const margin = product.retailPrice - product.purchasePrice;
  const marginPct = product.purchasePrice > 0 ? (margin / product.purchasePrice) * 100 : 0;
  const totalValue = product.stock * product.purchasePrice;
  const belowFloor = product.retailPrice < product.minPrice;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-end" onClick={close}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8,9,11,0.55)", backdropFilter: "blur(6px)", opacity: visible ? 1 : 0, transition: "opacity .2s ease" }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:w-[420px] sm:h-full rounded-t-3xl sm:rounded-none sm:rounded-l-3xl overflow-y-auto max-h-[92vh] sm:max-h-full mt-auto sm:mt-0"
        style={{
          background: t.surface,
          borderLeft: `1px solid ${t.border}`,
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform .28s cubic-bezier(.2,.9,.3,1.05)",
        }}
      >
        <div className="h-1.5 w-10 rounded-full mx-auto mt-3 sm:hidden" style={{ background: t.border }} />
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>Product Details</span>
          <button onClick={close}><X size={19} color={t.textMuted} /></button>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-5">
          <div className="w-full h-44 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: t.surfaceAlt }}>
            {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Package size={36} color={t.textMuted} />}
          </div>

          <div>
            <p className="text-lg font-bold" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>{product.name}</p>
            <p className="text-sm" style={{ color: t.textMuted }}>{product.company}</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: t.surfaceAlt }}>
            <div>
              <p className="text-xs" style={{ color: t.textMuted }}>Remaining stock</p>
              <p className="text-2xl font-mono font-bold" style={{ color: t.text }}>{product.stock}</p>
            </div>
            <div className="flex items-center gap-2">
              <IconBtn t={t} onClick={() => onAdjust(product.id, -1)}><Minus size={15} /></IconBtn>
              <IconBtn t={t} onClick={() => onAdjust(product.id, 1)}><Plus size={15} /></IconBtn>
            </div>
          </div>

          {belowFloor && (
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: `${t.danger}1A`, border: `1px solid ${t.danger}44` }}>
              <AlertTriangle size={15} color={t.danger} className="shrink-0" />
              <p className="text-xs" style={{ color: t.danger }}>Retail price is below the minimum selling threshold.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard t={t} label="Purchase Price" value={fmtMoney(product.purchasePrice, currency)} />
            <StatCard t={t} label="Retail Price" value={fmtMoney(product.retailPrice, currency)} accent />
            <StatCard t={t} label="Min. Selling Price" value={fmtMoney(product.minPrice, currency)} />
            <StatCard t={t} label="Profit Margin" value={`${fmtMoney(margin, currency)} · ${marginPct.toFixed(0)}%`} good={margin >= 0} />
          </div>

          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: t.accentSoft }}>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} color={t.accent} />
              <span className="text-sm font-medium" style={{ color: t.text }}>Total inventory value</span>
            </div>
            <span className="text-sm font-mono font-bold" style={{ color: t.text }}>{fmtMoney(totalValue, currency)}</span>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => onEdit(product)}
              className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform duration-150 active:scale-[0.98]"
              style={{ background: t.accent, color: t.accentText }}
            >
              <Edit3 size={15} /> Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ t, label, value, accent, good }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: t.surfaceAlt }}>
      <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: t.textMuted }}>{label}</p>
      <p className="text-sm font-mono font-bold" style={{ color: good === false ? t.danger : accent ? t.accent : t.text }}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings panel                                                      */
/* ------------------------------------------------------------------ */

function SettingsPanel({ t, themeKey, setThemeKey, currency, setCurrency, user, onClose, onConvert, onLogout }) {
  return (
    <Overlay t={t} onClose={onClose} align="bottom">
      {(close) => (
        <div
          className="w-full sm:max-w-md sm:mx-auto rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0" style={{ background: t.surface }}>
            <h3 className="text-base font-bold" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h3>
            <button onClick={close}><X size={19} color={t.textMuted} /></button>
          </div>

          <div className="px-5 pb-8 flex flex-col gap-6">
            {user.isGuest && (
              <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: t.accentSoft }}>
                <div className="flex items-center gap-2">
                  <Link2 size={16} color={t.accent} />
                  <p className="text-sm font-semibold" style={{ color: t.text }}>You're in guest mode</p>
                </div>
                <p className="text-xs" style={{ color: t.textMuted }}>Link an account to back up your inventory — nothing you've saved will be lost.</p>
                <button
                  onClick={onConvert}
                  className="mt-1 rounded-xl py-2.5 text-sm font-semibold transition-transform duration-150 active:scale-[0.98]"
                  style={{ background: t.accent, color: t.accentText }}
                >
                  Link via Log In / Sign Up
                </button>
              </div>
            )}

            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surfaceAlt }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: t.accentSoft, color: t.accent }}>
                {initials(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{user.fullName}</p>
                <p className="text-xs truncate" style={{ color: t.textMuted }}>{user.shopName}{user.email ? ` · ${user.email}` : ""}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: t.textMuted }}>
                <Palette size={13} /> Theme
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(THEMES).map(([key, th]) => (
                  <button
                    key={key}
                    onClick={() => setThemeKey(key)}
                    className="rounded-xl p-3 flex items-center gap-2.5 transition-transform duration-150 active:scale-[0.97]"
                    style={{ background: th.bg, border: `2px solid ${themeKey === key ? t.accent : t.border}` }}
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      {th.swatch.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full" style={{ background: c, border: `1.5px solid ${th.bg}` }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium truncate" style={{ color: th.text }}>{th.label}</span>
                    {themeKey === key && <Check size={13} color={t.accent} className="ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel t={t}>Currency</FieldLabel>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
                style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}
              >
                {CURRENCIES.map(([code, name, sym]) => (
                  <option key={code} value={code}>{code} — {name} ({sym})</option>
                ))}
              </select>
            </div>

            <button
              onClick={onLogout}
              className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
              style={{ background: `${t.danger}1A`, color: t.danger, border: `1px solid ${t.border}` }}
            >
              <LogOut size={15} /> Log Out
            </button>
          </div>
        </div>
      )}
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ t, user, products, setProducts, themeKey, setThemeKey, currency, setCurrency, onConvert, onLogout }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [modalProduct, setModalProduct] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [drawerProduct, setDrawerProduct] = useState(null);

  const groups = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (!map[p.company]) map[p.company] = { name: p.company, products: [], value: 0 };
      map[p.company].products.push(p);
      map[p.company].value += p.stock * p.purchasePrice;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const companyNames = useMemo(() => [...new Set(products.map((p) => p.company))], [products]);

  const scoped = selectedCompany ? products.filter((p) => p.company === selectedCompany) : products;
  const filtered = query.trim()
    ? scoped.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : scoped;

  const openProduct = (p) => setDrawerProduct(p);

  const saveProduct = async (p) => {
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    setModalProduct(undefined);
    setDrawerProduct((d) => (d && d.id === p.id ? p : d));
    if (!user.isGuest) {
      await supabase.from("products").upsert(toDbProduct(p, user.id));
    }
  };

  const deleteProduct = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setModalProduct(undefined);
    setDrawerProduct(null);
    if (!user.isGuest) {
      await supabase.from("products").delete().eq("id", id);
    }
  };

  const adjustStock = async (id, delta) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const newStock = Math.max(0, current.stock + delta);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
    setDrawerProduct((d) => (d && d.id === id ? { ...d, stock: newStock } : d));
    if (!user.isGuest) {
      await supabase.from("products").update({ stock: newStock }).eq("id", id);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: t.bg }}>
      <Header t={t} user={user} onOpenSettings={() => setShowSettings(true)} />
      {user.isGuest && <GuestBanner t={t} onConvert={onConvert} />}
      <SearchBar t={t} value={query} onChange={setQuery} scopeLabel={selectedCompany} />

      {selectedCompany && (
        <div className="px-4 sm:px-8 pt-1 pb-1">
          <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70" style={{ color: t.accent }}>
            <ChevronLeft size={16} /> All companies
          </button>
          <p className="text-xl font-bold mt-2" style={{ color: t.text, fontFamily: "'Space Grotesk', sans-serif" }}>{selectedCompany}</p>
        </div>
      )}

      {query.trim() ? (
        <div className="px-4 sm:px-8 pb-28 flex flex-col gap-2.5 mt-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState t={t} icon={<Search size={22} />} title="No matches found" subtitle="Try a different product name." />
            </div>
          ) : (
            filtered.map((p, i) => <SearchResultRow key={p.id} t={t} p={p} currency={currency} onOpen={openProduct} index={i} />)
          )}
        </div>
      ) : selectedCompany ? (
        <ProductGrid t={t} products={filtered} currency={currency} onOpen={openProduct} />
      ) : (
        <CompanyGrid t={t} groups={groups} currency={currency} onOpen={setSelectedCompany} />
      )}

      {/* FAB */}
      <button
        onClick={() => setModalProduct(null)}
        className="fixed bottom-6 right-5 sm:right-10 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 active:scale-90"
        style={{ background: t.accent, color: t.accentText, boxShadow: `0 8px 24px ${t.accentSoft}` }}
      >
        <Plus size={24} />
      </button>

      {modalProduct !== undefined && (
        <ProductModal
          t={t}
          initial={modalProduct}
          companies={companyNames}
          currency={currency}
          onClose={() => setModalProduct(undefined)}
          onSave={saveProduct}
          onDelete={deleteProduct}
        />
      )}

      {drawerProduct && (
        <ProductDrawer
          t={t}
          product={drawerProduct}
          currency={currency}
          onClose={() => setDrawerProduct(null)}
          onEdit={(p) => { setModalProduct(p); }}
          onAdjust={adjustStock}
        />
      )}

      {showSettings && (
        <SettingsPanel
          t={t}
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          currency={currency}
          setCurrency={setCurrency}
          user={user}
          onClose={() => setShowSettings(false)}
          onConvert={() => { setShowSettings(false); onConvert(); }}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root App                                                             */
/* ------------------------------------------------------------------ */

export default function App() {
  const [themeKey, setThemeKey] = useState("dark");
  const [currency, setCurrency] = useState("USD");
  const [view, setView] = useState("landing"); // landing | signup | login | convert | dashboard
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const t = THEMES[themeKey];

  // Restore a logged-in session on page load/refresh
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserFromSession(session);
      setCheckingSession(false);
    });
  }, []);

  async function loadUserFromSession(session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    setUser({
      id: session.user.id,
      fullName: profile?.full_name || "Shop Owner",
      shopName: profile?.shop_name || "My Shop",
      shopAddress: profile?.shop_address || "",
      contact: profile?.contact || "",
      email: session.user.email,
      isGuest: false,
    });
    const { data: rows } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", session.user.id);
    setProducts((rows || []).map(fromDbProduct));
    setView("dashboard");
  }

  const handlePick = (mode) => {
    setAuthError("");
    if (mode === "guest") {
      setUser({ fullName: "Guest", shopName: "My Shop", isGuest: true });
      setProducts(SEED_PRODUCTS);
      setView("dashboard");
    } else {
      setView(mode);
    }
  };

  const handleSignup = async (form) => {
    setAuthError("");
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    setAuthLoading(false);
    if (error) return setAuthError(error.message);
    if (!data.user) return setAuthError("Something went wrong. Please try again.");

    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: form.fullName || "Shop Owner",
      shop_name: form.shopName || "My Shop",
      shop_address: form.shopAddress,
      contact: form.contact,
      email: form.email,
    });

    if (data.session) {
      setUser({
        id: data.user.id,
        fullName: form.fullName || "Shop Owner",
        shopName: form.shopName || "My Shop",
        shopAddress: form.shopAddress,
        contact: form.contact,
        email: form.email,
        isGuest: false,
      });
      setProducts([]);
      setView("dashboard");
    } else {
      setAuthError("Account created! Check your email to confirm it, then log in.");
    }
  };

  const handleLogin = async (form) => {
    setAuthError("");
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setAuthLoading(false);
    if (error) return setAuthError(error.message);
    if (data.session) await loadUserFromSession(data.session);
  };

  const handleConvertSubmit = async (form) => {
    setAuthError("");
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    setAuthLoading(false);
    if (error) return setAuthError(error.message);
    if (!data.user) return setAuthError("Something went wrong. Please try again.");

    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: form.fullName || "Shop Owner",
      shop_name: form.shopName || "My Shop",
      shop_address: form.shopAddress,
      contact: form.contact,
      email: form.email,
    });

    if (products.length) {
      await supabase.from("products").insert(products.map((p) => toDbProduct(p, data.user.id)));
    }

    if (data.session) {
      setUser({
        id: data.user.id,
        fullName: form.fullName || "Shop Owner",
        shopName: form.shopName || "My Shop",
        shopAddress: form.shopAddress,
        contact: form.contact,
        email: form.email,
        isGuest: false,
      });
      setView("dashboard");
    } else {
      setAuthError("Account created! Check your email to confirm it, then log in.");
    }
  };

  const handleConvert = () => { setAuthError(""); setView("convert"); };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProducts(SEED_PRODUCTS);
    setView("landing");
  };

  if (checkingSession) {
    return <div style={{ background: t.bg, minHeight: "100vh" }} />;
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; }
        ::selection { background: ${t.accentSoft}; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {view === "landing" && <Landing t={t} onPick={handlePick} />}
      {view === "signup" && (
        <AuthForm t={t} mode="signup" onBack={() => setView("landing")} onSubmit={handleSignup} error={authError} loading={authLoading} />
      )}
      {view === "login" && (
        <AuthForm t={t} mode="login" onBack={() => setView("landing")} onSubmit={handleLogin} error={authError} loading={authLoading} />
      )}
      {view === "convert" && (
        <AuthForm
          t={t}
          mode="convert"
          onBack={() => setView("dashboard")}
          onSubmit={handleConvertSubmit}
          error={authError}
          loading={authLoading}
        />
      )}
      {view === "dashboard" && user && (
        <Dashboard
          t={t}
          user={user}
          products={products}
          setProducts={setProducts}
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          currency={currency}
          setCurrency={setCurrency}
          onConvert={handleConvert}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

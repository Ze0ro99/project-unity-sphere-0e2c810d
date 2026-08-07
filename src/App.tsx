import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import {
  Activity, Layers, Radio, Cpu, ArrowDownUp, FlaskConical, ShieldCheck, Lock, Menu, X,
} from "lucide-react";
import { initPi } from "@/lib/piSdk";
import PiConnectButton from "@/components/PiConnectButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";
import Explorer from "./pages/Explorer";
import Layers7 from "./pages/Layers7";
import MicroDevice from "./pages/MicroDevice";
import Network from "./pages/Network";
import PiDEX from "./pages/PiDEX";
import Testnet from "./pages/Testnet";
import Standards from "./pages/Standards";
import Bn254 from "./pages/Bn254";

const NAV = [
  { to: "/", key: "nav.pidex", icon: ArrowDownUp },
  { to: "/explorer", key: "nav.explorer", icon: Activity },
  { to: "/layers", key: "nav.layers", icon: Layers },
  { to: "/micro-device", key: "nav.micro", icon: Cpu },
  { to: "/network", key: "nav.network", icon: Radio },
  { to: "/standards", key: "nav.standards", icon: ShieldCheck },
  { to: "/bn254", key: "nav.bn254", icon: Lock },
  { to: "/testnet", key: "nav.testnet", icon: FlaskConical },
];

export default function App() {
  useEffect(() => {
    initPi().catch((e) => console.warn("Pi SDK init:", e?.message ?? e));
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-3 sm:px-4 py-4">
        <Routes>
          <Route path="/" element={<PiDEX />} />
          <Route path="/pidex" element={<PiDEX />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/layers" element={<Layers7 />} />
          <Route path="/micro-device" element={<MicroDevice />} />
          <Route path="/network" element={<Network />} />
          <Route path="/testnet" element={<Testnet />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/bn254" element={<Bn254 />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="border-b border-border bg-panel/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight shrink-0">
          <span className="w-7 h-7 rounded-md bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black">π</span>
          <span>PiScan</span>
          <span className="hidden sm:inline text-xs text-muted mono">/ PiRC v3</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition ${
                  isActive ? "bg-panel2 text-text" : "text-muted hover:text-text hover:bg-panel2/50"
                }`
              }
            >
              <n.icon size={14} /> {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden xl:flex items-center gap-2 text-xs text-muted">
          <span className="pulse-dot" />
          <span className="mono">MAINNET · api.mainnet.minepi.com</span>
        </div>
        <div className="ml-auto lg:ml-0 flex items-center gap-2">
          <LanguageSwitcher />
          <PiConnectButton />
          <button
            className="lg:hidden p-2 rounded-md border border-border hover:bg-panel2"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-panel px-3 py-2 grid grid-cols-2 gap-1 text-sm">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-md transition ${
                  isActive ? "bg-panel2 text-text" : "text-muted hover:text-text hover:bg-panel2/50"
                }`
              }
            >
              <n.icon size={15} /> {t(n.key)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted">
      PiScan · PiRC Sovereign Network Ecosystem · Data streaming live from Pi Network Horizon
    </footer>
  );
}

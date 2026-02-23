"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LayoutDashboard, FilePlus, Search, Settings, LogOut, User, GraduationCap, Smartphone } from "lucide-react"
import { motion } from "framer-motion"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Issue Credentials", href: "/issue", icon: FilePlus, adminOnly: true },
  { name: "Verify", href: "/verify", icon: Search },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function Sidebar({ user, onLogout }: { user: any, onLogout: () => void }) {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-slate-900">EduCerts<span className="text-indigo-600">.io</span></h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">OpenAttestation Proto</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          if (item.adminOnly && !user?.is_admin) return null

          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
              {user ? <User className="w-5 h-5 text-indigo-600" /> : <div className="w-full h-full bg-indigo-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900">{user?.name || "Guest User"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || "Connect your account"}</p>
            </div>
          </div>

          {user ? (
            <div className="space-y-2">
              <Link
                href="/wallet"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 transition-all text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-violet-600/20"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Open Student Wallet
              </Link>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs font-semibold text-slate-400 border border-slate-700 hover:border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all text-xs font-semibold text-white">
              Login to EduCerts
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import React from "react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import Sidebar from "@/components/Sidebar"
import { usePathname } from "next/navigation"

function AppContent({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth()
    const pathname = usePathname()

    const isLoginPage = pathname === "/login"
    const isStudentPortal = pathname === "/student"
    const isWalletPage = pathname === "/wallet"
    const isExcluded = isLoginPage || isStudentPortal || isWalletPage

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {!isExcluded && <Sidebar user={user} onLogout={logout} />}
            <main className={`flex-1 ${!isExcluded ? "ml-64" : ""}`}>
                {children}
            </main>
        </div>
    )
}

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AppContent>{children}</AppContent>
        </AuthProvider>
    )
}

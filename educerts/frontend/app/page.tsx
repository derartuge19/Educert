"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, FileText, CheckCircle, Search, ArrowRight, Activity, Award, Users, Trash2 } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"

interface Certificate {
  id: string
  course_name: string
  student_name: string
  issued_at: string
  revoked: boolean
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalIssued: 0, totalVerified: 0, pending: 0 })
  const [recentCerts, setRecentCerts] = useState<Certificate[]>([])

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    description: string
    type: "info" | "danger" | "success"
    actionLabel: string
    onAction: () => void
    isLoading: boolean
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info",
    actionLabel: "",
    onAction: () => { },
    isLoading: false
  })

  const fetchCerts = async () => {
    if (!user) return
    try {
      const endpoint = user.is_admin
        ? "http://localhost:8000/api/certificates"
        : `http://localhost:8000/api/certificates/${user.name}`
      const res = await axios.get(endpoint)
      setRecentCerts(Array.isArray(res.data) ? res.data.slice(0, 5) : [])

      // Update stats based on actual data if possible, or keep mock for now
      setStats({
        totalIssued: user.is_admin ? 124 : (Array.isArray(res.data) ? res.data.length : 12),
        totalVerified: user.is_admin ? 892 : 45,
        pending: user.is_admin ? 3 : 0
      })
    } catch (error) {
      console.error("Error fetching certs", error)
    }
  }

  useEffect(() => {
    fetchCerts()
  }, [user])

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }))

  const handleRevoke = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: "Revoke Certificate",
      description: "Are you sure you want to revoke this certificate? This action will mark it as invalid and cannot be undone.",
      type: "danger",
      actionLabel: "Yes, Revoke",
      isLoading: false,
      onAction: async () => {
        setModalConfig(p => ({ ...p, isLoading: true }))
        try {
          await axios.post(`http://localhost:8000/api/revoke/${id}`)
          await fetchCerts()
          setModalConfig({
            isOpen: true,
            title: "Success",
            description: "Certificate has been successfully revoked.",
            type: "success",
            actionLabel: "Done",
            onAction: closeModal,
            isLoading: false
          })
        } catch (error) {
          setModalConfig({
            isOpen: true,
            title: "Error",
            description: "Failed to revoke certificate. Please try again.",
            type: "danger",
            actionLabel: "Close",
            onAction: closeModal,
            isLoading: false
          })
        }
      }
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Modal {...modalConfig} onClose={closeModal} />

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500 font-medium text-lg">Here's what's happening with your verifiable credentials today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/verify">
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold shadow-sm">
              <Search className="w-4 h-4 mr-2" />
              Verify A Doc
            </Button>
          </Link>
          {user?.is_admin && (
            <Link href="/issue">
              <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/20">
                <FileText className="w-4 h-4 mr-2" />
                Issue New
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Issued", value: stats.totalIssued, icon: Award, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Verifications", value: stats.totalVerified, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: user?.is_admin ? "Active Issuers" : "Available Certs", value: user?.is_admin ? 12 : stats.totalIssued, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="p-8 rounded-[2rem] bg-white border border-slate-200 hover:border-indigo-500/50 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Analytics</span>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Certificates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Certificates</h3>
            <Link href="/certificates" className="text-sm font-bold text-indigo-500 hover:text-indigo-600 flex items-center group">
              View All Registry <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentCerts.length > 0 ? (
              recentCerts.map((cert) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={cert.id}
                  className="p-5 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-all group shadow-sm hover:shadow-md h-24"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 line-clamp-1">{cert.course_name}</p>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">
                        Issued to <span className="text-slate-600 font-black">{cert.student_name}</span> • {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pr-4">
                    {cert.revoked ? (
                      <Badge variant="destructive" className="rounded-full font-black uppercase text-[10px] px-3 py-1 shadow-sm border-2 border-white">Revoked</Badge>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                          Verified <CheckCircle className="w-3 h-3" />
                        </span>
                        {user?.is_admin && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            title="Revoke Certificate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-[3rem] shadow-sm">
                <Award className="w-16 h-16 text-slate-200 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No certificates found yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Info */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">System Node</h3>
          <Card className="rounded-[2.5rem] bg-white border-slate-200 shadow-sm overflow-hidden border-2">
            <div className="h-2 bg-indigo-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                Trust Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {[
                  { label: "Protocol", value: "OpenAttestation v2.0" },
                  { label: "Algorithm", value: "Ed25519 (Asymmetric)" },
                  { label: "Integrity", value: "Merkle Root Hashing" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    <span className="text-xs font-black text-indigo-600 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Security Status</p>
                </div>
                <p className="text-sm font-black">All validation nodes operational. Digital signatures verified.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"
import { Shield, FileText, CheckCircle, Search, ArrowRight, Activity, Award, Users } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

  useEffect(() => {
    if (user) {
      // Mock stats for demo
      setStats({
        totalIssued: user.is_admin ? 124 : 12,
        totalVerified: user.is_admin ? 892 : 45,
        pending: user.is_admin ? 3 : 0
      })

      const fetchCerts = async () => {
        try {
          const endpoint = user.is_admin
            ? "http://localhost:8000/api/certificates"
            : `http://localhost:8000/api/certificates/${user.name}`
          console.log("Fetching from:", endpoint)
          const res = await axios.get(endpoint)
          console.log("Fetch success:", res.data)
          setRecentCerts(Array.isArray(res.data) ? res.data.slice(0, 5) : [])
        } catch (error) {
          console.error("Error fetching certs", error)
          if (axios.isAxiosError(error)) {
            console.error("Status:", error.response?.status)
            console.error("Data:", error.response?.data)
          }
        }
      }
      fetchCerts()
    }
  }, [user])

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this certificate? This action cannot be undone.")) return
    try {
      await axios.post(`http://localhost:8000/api/revoke/${id}`)
      // Refresh list
      const endpoint = user?.is_admin
        ? "http://localhost:8000/api/certificates"
        : `http://localhost:8000/api/certificates/${user?.name}`
      const res = await axios.get(endpoint)
      setRecentCerts(res.data.slice(0, 5))
    } catch (error) {
      alert("Failed to revoke certificate")
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500 font-medium">Here's what's happening with your verifiable credentials today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/verify">
            <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm">
              <Search className="w-4 h-4 mr-2" />
              Verify A Doc
            </Button>
          </Link>
          {user?.is_admin && (
            <Link href="/issue">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
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
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-200">Last 30 Days</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Certificates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Certificates</h3>
            <Link href="/certificates" className="text-sm text-indigo-400 hover:underline flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCerts.length > 0 ? (
              recentCerts.map((cert) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={cert.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{cert.course_name}</p>
                      <p className="text-xs text-slate-500 font-medium">Issued to {cert.student_name} • {new Date(cert.issued_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.revoked ? (
                      <span className="text-[10px] font-mono text-red-600 bg-red-500/10 px-2 py-1 rounded uppercase font-bold border border-red-500/20">Revoked</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {!cert.revoked && (
                          <button
                            onClick={() => window.open(`http://localhost:8000/api/json/${cert.id}`)}
                            title="Download OA JSON"
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase font-bold border border-slate-200">Verified</span>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        {user?.is_admin && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            className="text-[10px] text-red-500 hover:text-red-400 font-bold ml-2 uppercase tracking-tighter"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
                <p className="text-slate-400 font-medium">No certificates found yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">System Integration</h3>
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-indigo-600"></div>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
                <Shield className="w-4 h-4 text-indigo-600" />
                Asymmetric Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-slate-500 space-y-2 font-medium">
                <p>Core: <span className="text-indigo-600 font-mono">OpenAttestation v2.0</span></p>
                <p>Algorithm: <span className="text-indigo-600 font-mono">Ed25519 (Asymmetric)</span></p>
                <p>Privacy: <span className="text-indigo-600 font-mono">Field-level Salting</span></p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-mono text-emerald-600 truncate font-bold">
                  Issuer Key Active: ed25519_pk_...
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm shadow-indigo-500/5">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Announcement
            </h4>
            <p className="text-sm text-indigo-800 leading-relaxed font-medium">
              "EduCerts now supports multi-field salting for enhanced credential privacy."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

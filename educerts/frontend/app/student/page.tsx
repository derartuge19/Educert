"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Download, FileText, Search, ShieldCheck, ExternalLink, Calendar, GraduationCap, ArrowLeft, Loader2, QrCode, Share2, LogOut } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Certificate {
    id: string
    course_name: string
    student_name: string
    issued_at: string
    revoked: boolean
    signature: string
}

export default function StudentPortal() {
    const { user } = useAuth()
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            const fetchCerts = async () => {
                try {
                    const res = await axios.get<Certificate[]>(`http://localhost:8000/api/certificates/${user.name}`)
                    setCerts(res.data)
                } catch (error) {
                    console.error("Error fetching student certs", error)
                } finally {
                    setLoading(false)
                }
            }
            fetchCerts()
        }
    }, [user])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Achievement Portal...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Hero */}
            <div className="bg-indigo-600 text-white pt-12 pb-24 px-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <Award className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h1 className="font-bold text-xl tracking-tight">EduCerts<span className="text-indigo-200">.io</span></h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-widest">Verified Student Profile</span>
                            </div>
                            <Button
                                variant="ghost"
                                className="text-white hover:bg-white/10"
                                onClick={() => {
                                    // Handle Logout or simple back
                                    window.location.href = "/login"
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Exit Portal
                            </Button>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Achievement Portal</h1>
                        <p className="text-indigo-100 text-lg mt-2 font-medium">Hello, {user?.name}! Here are your cryptographically secured achievements.</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-8 -mt-16 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">

                    {/* Left: Summary Card */}
                    <div className="space-y-6">
                        <Card className="bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden border-0">
                            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Achievements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-black text-slate-900">{certs.length}</div>
                                <p className="text-xs text-slate-500 mt-2 font-medium">Verifiable Academic Credentials</p>
                                <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <QrCode className="w-3.5 h-3.5" />
                                        QR Sharing Active
                                    </h4>
                                    <p className="text-xs text-indigo-800 leading-relaxed">
                                        All your PDF downloads now include a **verification QR code** for instant document validation.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Certificate List */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-600" />
                            Issued Credentials
                        </h3>

                        <div className="space-y-4">
                            {certs.length > 0 ? (
                                certs.map((cert) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={cert.id}
                                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                                                    <Award className="w-8 h-8 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-slate-900">{cert.course_name}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(cert.issued_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono">ID: {cert.id.slice(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={() => window.open(`http://localhost:8000/api/download/${cert.id}`)}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10 px-6 font-bold"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download PDF
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => window.location.href = `/verify?id=${cert.id}`}
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
                                                >
                                                    <Search className="w-4 h-4 mr-2" />
                                                    Verify
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Security Detail Bar */}
                                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tighter">Encryption</span>
                                                    <span className="text-[10px] text-slate-600 font-bold tracking-wider">Ed25519 Signed</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tighter">Status</span>
                                                    <span className={`text-[10px] font-bold tracking-wider ${cert.revoked ? "text-red-500" : "text-emerald-500"}`}>
                                                        {cert.revoked ? "Revoked" : "Live & Active"}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="text-xs text-indigo-600 hover:bg-indigo-50 font-bold">
                                                <Share2 className="w-3.5 h-3.5 mr-2" />
                                                Share Credential
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-20 text-center space-y-4 shadow-inner">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                                        <FileText className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No credentials found in your name</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

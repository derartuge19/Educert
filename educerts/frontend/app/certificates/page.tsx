"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"
import { FileText, Download, ShieldCheck, Calendar, Award, ExternalLink, Loader2, Search } from "lucide-react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Certificate {
    id: string
    course_name: string
    student_name: string
    issued_at: string
    revoked: boolean
}

export default function CertificatesPage() {
    const { user } = useAuth()
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (user) {
            const fetchCerts = async () => {
                try {
                    const res = await axios.get<Certificate[]>(`http://localhost:8000/api/certificates/${user.name}`)
                    setCerts(res.data)
                } catch (error) {
                    console.error("Error fetching certs", error)
                } finally {
                    setLoading(false)
                }
            }
            fetchCerts()
        }
    }, [user])

    const filteredCerts = certs.filter(cert =>
        cert.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Award className="w-8 h-8 text-indigo-600" />
                        My Certificates
                    </h1>
                    <p className="text-slate-500 font-medium">View and manage your verifiable academic credentials.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search certificates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 border font-medium shadow-sm"
                    />
                </div>
            </div>

            {filteredCerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCerts.map((cert) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={cert.id}
                            className={`group relative p-6 rounded-2xl border transition-all hover:shadow-xl ${cert.revoked ? "bg-slate-50 border-red-200 grayscale shadow-sm" : "bg-white border-slate-200 hover:border-indigo-500/50 shadow-sm"}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-xl shadow-sm ${cert.revoked ? "bg-red-100" : "bg-indigo-50"}`}>
                                    <FileText className={`w-6 h-6 ${cert.revoked ? "text-red-500" : "text-indigo-600"}`} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border shadow-sm ${cert.revoked ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                                        {cert.revoked ? "Revoked" : "Authentic"}
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-2 font-mono font-bold">ID: {cert.id.slice(0, 8)}...</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{cert.course_name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">Issued on {new Date(cert.issued_at).toLocaleDateString()}</p>
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tighter">Standards</span>
                                        <span className="text-[10px] text-slate-600 font-bold tracking-wider">OA v2.0</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tighter">Security</span>
                                        <span className="text-[10px] text-slate-600 font-bold tracking-wider">ED25519</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {!cert.revoked && (
                                        <div className="flex gap-2 flex-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
                                                onClick={() => window.open(`http://localhost:8000/api/download/${cert.id}`)}
                                            >
                                                <Download className="w-3.5 h-3.5 mr-2" />
                                                PDF
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
                                                onClick={() => window.open(`http://localhost:8000/api/json/${cert.id}`)}
                                            >
                                                <FileText className="w-3.5 h-3.5 mr-2" />
                                                JSON
                                            </Button>
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 font-semibold"
                                        onClick={() => window.location.href = `/verify?id=${cert.id}`}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                        Verify
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="bg-white border-slate-200 border-dashed border-2 py-20 rounded-2xl shadow-inner">
                    <CardContent className="flex flex-col items-center space-y-4">
                        <Award className="w-16 h-16 text-slate-100" />
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest text-xs">No Certificates Found</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2 font-medium">Any academic credentials issued to you will appear here for management and download.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

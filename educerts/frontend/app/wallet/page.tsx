"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import {
    Wallet,
    Plus,
    Award,
    Download,
    FileText,
    ShieldCheck,
    LogOut,
    Loader2,
    Smartphone,
    QrCode,
    ChevronRight,
    ArrowLeft,
    Share2,
    Info,
    CheckCircle2,
    Search,
    X,
    Maximize2
} from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Certificate {
    id: string
    course_name: string
    student_name: string
    issued_at: string
    revoked: boolean
    organization: string
}

export default function WalletPage() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState("wallet")
    const [claimPin, setClaimPin] = useState("")
    const [organization, setOrganization] = useState("EduCerts Academy")
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [scanInput, setScanInput] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

    useEffect(() => {
        if (user) {
            fetchClaimedCerts()
        }
    }, [user])

    const fetchClaimedCerts = async () => {
        setLoading(true)
        try {
            const res = await axios.get<Certificate[]>(`http://localhost:8000/api/certificates/${user?.name}`)
            setCerts(res.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleClaim = async () => {
        if (!claimPin) return
        setClaiming(true)
        try {
            const res = await axios.post("http://localhost:8000/api/claim", {
                pin: claimPin,
                organization: organization
            })
            setSuccessMessage(`Successfully claimed: ${res.data.course_name}`)
            setClaimPin("")
            fetchClaimedCerts()

            // Auto-display the newly claimed cert
            const newCert = res.data
            setSelectedCert(newCert)

            setTimeout(() => setSuccessMessage(""), 3000)
            setActiveTab("wallet")
        } catch (error: any) {
            alert(error.response?.data?.detail || "Claim failed. Check your PIN.")
        } finally {
            setClaiming(false)
        }
    }

    const simulateScan = async () => {
        if (!scanInput) return
        setScanning(true)
        try {
            // Find cert by ID (simulating QR scan of ID)
            const id = scanInput.includes("/") ? scanInput.split("/").pop() : scanInput
            const res = await axios.get(`http://localhost:8000/api/download/${id}`)

            // In a real scan, we'd get the cert data. Here we simulate getting the metadata
            // Let's assume we find it in our certificates list or fetch its info
            const infoRes = await axios.get<Certificate[]>(`http://localhost:8000/api/certificates`)
            const found = infoRes.data.find((c: Certificate) => c.id === id)

            if (found) {
                setSelectedCert(found)
                setSuccessMessage("Certificate Found & Scanned!")
                setScanInput("")
                setScanning(false)
                setTimeout(() => setSuccessMessage(""), 3000)
            } else {
                throw new Error("Certificate not found in registry")
            }
        } catch (error: any) {
            alert("Scan simulation failed. Ensure you enter a valid Certificate ID.")
        } finally {
            setScanning(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
            {/* Top Bar */}
            <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50 px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold tracking-tight text-lg">EduWallet</span>
                </div>
                <button
                    onClick={() => window.location.href = "/"}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </header>

            <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 border border-emerald-400 mb-6"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-bold text-sm">{successMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Section */}
                <div className="mb-10 flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-600/20">
                        {user?.name?.[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900">{user?.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Verified Identity</span>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="ml-auto p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-300 hover:text-red-500"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="w-full bg-slate-100 border border-slate-200 rounded-2xl h-14 p-1">
                        <TabsTrigger
                            value="wallet"
                            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            Credentials
                        </TabsTrigger>
                        <TabsTrigger
                            value="claim"
                            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            Claim
                        </TabsTrigger>
                        <TabsTrigger
                            value="scan"
                            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            Scan QR
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="wallet" className="space-y-4 outline-none">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Your Assets</h3>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{certs.length} Docs</span>
                        </div>

                        <div className="space-y-4">
                            {certs.length > 0 ? (
                                certs.map((cert) => (
                                    <motion.div
                                        key={cert.id}
                                        layoutId={cert.id}
                                        onClick={() => setSelectedCert(cert)}
                                        className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                                                <Award className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{cert.course_name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cert.organization}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-inner">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No achievements found</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="claim" className="space-y-6 outline-none">
                        <Card className="border-0 shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <CardTitle className="text-2xl font-black tracking-tight">Claim Document</CardTitle>
                                <CardDescription className="font-medium">Enter your secure 6-digit credential PIN.</CardDescription>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PIN CODE</label>
                                    <input
                                        type="text"
                                        placeholder="······"
                                        value={claimPin}
                                        onChange={(e) => setClaimPin(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-16 text-center text-3xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none"
                                        maxLength={6}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ORGANIZATION</label>
                                    <input
                                        type="text"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 font-bold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none"
                                    />
                                </div>

                                <Button
                                    onClick={handleClaim}
                                    disabled={claiming || !claimPin}
                                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 text-lg transition-all active:scale-95"
                                >
                                    {claiming ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Claim"}
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="scan" className="space-y-6 outline-none text-center">
                        <Card className="border-0 shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden p-10 space-y-8">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto relative group overflow-hidden">
                                <QrCode className="w-10 h-10 text-slate-300 group-hover:text-indigo-600 transition-all" />
                                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Search className="w-8 h-8 text-indigo-600" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight">QR Scan Simulation</h3>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                    In a real app, this would use your camera. Paste the **Certificate ID** from a signed PDF to simulate a scan.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Paste Certificate ID..."
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 font-mono text-xs focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none"
                                />
                                <Button
                                    onClick={simulateScan}
                                    disabled={scanning || !scanInput}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/10 text-xs tracking-widest uppercase"
                                >
                                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMULATE SCAN"}
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Certificate Details Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-end justify-center"
                        onClick={() => setSelectedCert(null)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-lg bg-white rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                                        <Award className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 line-clamp-1">{selectedCert.course_name}</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedCert.organization}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 text-sm">
                                        <ShieldCheck className="w-4 h-4" />
                                        Verified
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued On</p>
                                    <p className="font-bold text-slate-700 text-sm">{new Date(selectedCert.issued_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => window.open(`http://localhost:8000/api/download/${selectedCert.id}`)}
                                    className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-md flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <Download className="w-5 h-5" />
                                    DOWNLOAD SIGNED PDF
                                </Button>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => window.open(`http://localhost:8000/api/json/${selectedCert.id}`)}
                                        variant="outline"
                                        className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        OA JSON
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        SHARE
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-indigo-100">
                                    <QrCode className="w-5 h-5 text-indigo-600" />
                                </div>
                                <p className="text-[10px] text-indigo-900/60 leading-relaxed font-bold uppercase tracking-wide">
                                    This document contains a unique Merkle proof. Proof of issuance is recorded on the EduCerts private blockchain.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 inset-x-0 h-20 bg-white/80 backdrop-blur-2xl border-t border-slate-100 z-50 px-8 flex items-center justify-around max-w-lg mx-auto rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveTab("wallet")}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === "wallet" ? "text-indigo-600 scale-110" : "text-slate-400"}`}
                >
                    <Award className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Assets</span>
                </button>
                <div className="relative -top-10">
                    <button
                        onClick={() => setActiveTab("claim")}
                        className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 border-8 border-[#F8FAFC] hover:scale-110 active:scale-95 transition-all text-white"
                    >
                        <Plus className="w-8 h-8 font-black" />
                    </button>
                </div>
                <button
                    onClick={() => setActiveTab("scan")}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === "scan" ? "text-indigo-600 scale-110" : "text-slate-400"}`}
                >
                    <QrCode className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Scan</span>
                </button>
            </nav>
        </div>
    )
}

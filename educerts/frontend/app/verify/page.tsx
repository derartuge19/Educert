"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShieldCheck, ShieldAlert, FileSearch, Upload, CheckCircle, XCircle, Info, Hash, Fingerprint, Lock, Loader2 } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface VerificationResult {
    summary: {
        all: boolean
        documentStatus: boolean
        documentIntegrity: boolean
        issuerIdentity: boolean
        signature: boolean
    }
    data: Array<{
        type: string
        name: string
        status: string
        data?: any
    }>
    certificate?: {
        student_name: string
        course_name: string
    }
}

export default function VerifyPage() {
    const [verifyId, setVerifyId] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<VerificationResult | null>(null)
    const [activeMode, setActiveMode] = useState<"id" | "file">("id")
    const [dragActive, setDragActive] = useState(false)

    const handleVerifyId = async () => {
        if (!verifyId) return
        setLoading(true)
        setResult(null)
        try {
            const res = await axios.post("http://localhost:8000/api/verify", {
                certificate_id: verifyId
            })
            setResult(res.data)
        } catch (err: unknown) {
            setResult(null)
            alert("Verification failed: Certificate not found.")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (file: File) => {
        setLoading(true)
        setResult(null)
        try {
            const text = await file.text()
            const jsonData = JSON.parse(text)

            const res = await axios.post<VerificationResult>("http://localhost:8000/api/verify", {
                data_payload: jsonData
            })
            setResult(res.data)
        } catch (err: any) {
            setResult(null)
            const errorMsg = err.response?.data?.detail || err.message || "Invalid document format."
            alert(`Verification failed: ${JSON.stringify(errorMsg)}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0])
        }
    }

    const FragmentStatus = ({ label, isValid }: { label: string, isValid: boolean }) => (
        <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isValid ? "bg-emerald-500" : "bg-red-500"}`} />
                {label}
            </span>
            {isValid ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
        </div>
    )

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100"
                >
                    <Search className="w-8 h-8 text-indigo-600" />
                </motion.div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Trust but <span className="text-indigo-600 underline decoration-indigo-600/30">Verify</span>.</h1>
                <p className="text-slate-500 max-w-xl mx-auto font-medium">
                    EduCerts uses OpenAttestation standards to ensure every credential is authentic, issued by a valid authority, and untampered.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-sm">
                        <button
                            onClick={() => setActiveMode("id")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeMode === "id" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Hash className="w-4 h-4" />
                            By ID
                        </button>
                        <button
                            onClick={() => setActiveMode("file")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeMode === "file" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Upload className="w-4 h-4" />
                            By Document
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeMode === "id" ? (
                            <motion.div
                                key="id"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                            >
                                <Card className="bg-white border-slate-200 shadow-lg overflow-hidden rounded-2xl">
                                    <div className="h-1 bg-indigo-600"></div>
                                    <CardHeader>
                                        <CardTitle className="text-md">Verify via Registry</CardTitle>
                                        <CardDescription>Enter the unique certificate UUID.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative">
                                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Paste Certificate ID..."
                                                value={verifyId}
                                                onChange={(e) => setVerifyId(e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-10 py-3 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none border font-semibold"
                                            />
                                        </div>
                                        <Button onClick={handleVerifyId} disabled={loading || !verifyId} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl font-bold">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Authenticity"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="file"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`h-[200px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all shadow-sm ${dragActive ? "border-indigo-600 bg-indigo-50 shadow-indigo-600/10" : "border-slate-200 bg-white"}`}
                                >
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                        <FileSearch className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-900">Drag your OA document here</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider uppercase">Accepts .json only</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".json"
                                        className="hidden"
                                        id="file-verify"
                                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                                    />
                                    <label htmlFor="file-verify" className="text-xs text-indigo-400 hover:underline cursor-pointer font-semibold">Or browse files</label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-3">
                        <Info className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            Verification involves checking the document's Merkle proof matches the issued hash and validating the Ed25519 signature of the issuer.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {!result ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center space-y-4 border border-slate-200 rounded-3xl bg-white border-dashed shadow-inner"
                            >
                                <ShieldCheck className="w-16 h-16 text-slate-100" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting Data...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-8 rounded-3xl border h-full flex flex-col shadow-xl ${result.summary.all ? "bg-white border-emerald-200" : "bg-white border-red-200"}`}
                            >
                                <div className={`h-1.5 -mx-8 -mt-8 mb-8 rounded-t-3xl ${result.summary.all ? "bg-emerald-500" : "bg-red-500"}`}></div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${result.summary.all ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-red-500 text-white shadow-lg shadow-red-500/20"}`}>
                                        {result.summary.all ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-bold ${result.summary.all ? "text-emerald-700" : "text-red-700"}`}>
                                            {result.summary.all ? "Fully Verified" : "Verification Failed"}
                                        </h3>
                                        <p className={`text-sm font-medium ${result.summary.all ? "text-emerald-600" : "text-red-600"}`}>
                                            {result.summary.all ? "The credential is legitimate and intact." : "Integrity or identity check failed."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    {result.summary.all && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Student</p>
                                                <p className="text-sm font-bold text-slate-900">{result.certificate?.student_name || "N/A"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Course</p>
                                                <p className="text-sm font-bold text-slate-900">{result.certificate?.course_name || "N/A"}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-6 border-t border-slate-100">
                                        <FragmentStatus label="Document Integrity" isValid={result.summary.documentIntegrity} />
                                        <FragmentStatus label="Issuance Status" isValid={result.summary.documentStatus} />
                                        <FragmentStatus label="Issuer Identity" isValid={result.summary.issuerIdentity} />
                                        <FragmentStatus label="Cryptographic Signature" isValid={result.summary.signature} />
                                    </div>

                                    <div className="mt-auto pt-6">
                                        <button onClick={() => setResult(null)} className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-sm font-bold transition-all border border-slate-200 shadow-sm">
                                            Clear Result
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

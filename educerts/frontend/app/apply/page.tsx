"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Briefcase, QrCode, ArrowRight, CheckCircle2, Loader2, Sparkles, Building2 } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import qrcode from "qrcode"

export default function ApplyPage() {
    const [step, setStep] = useState(1)
    const [qrData, setQrData] = useState("")
    const [loading, setLoading] = useState(false)
    const [verified, setVerified] = useState(false)

    const generateChallenge = async () => {
        setLoading(true)
        try {
            const res = await axios.get("http://localhost:8000/api/apply/challenge")
            const url = await qrcode.toDataURL(JSON.stringify(res.data))
            setQrData(url)
            setStep(2)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const simulateScan = () => {
        setStep(3)
        setVerified(true)
    }

    return (
        <div className="flex items-center justify-center min-h-[85vh] p-4 bg-slate-50/50">
            <div className="w-full max-w-lg">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                                <div className="h-2 bg-indigo-600"></div>
                                <CardHeader className="text-center pt-10 pb-2">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
                                        <Building2 className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Global Tech Corp</CardTitle>
                                    <CardDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Job Application Portal</CardDescription>
                                </CardHeader>
                                <CardContent className="px-10 pb-10 space-y-8">
                                    <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100">
                                        <h4 className="text-indigo-900 font-bold mb-1 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Senior Software Engineer
                                        </h4>
                                        <p className="text-indigo-600/70 text-sm font-medium">To complete your application, please verify your Bachelor's Degree using your EduCerts Wallet.</p>
                                    </div>

                                    <Button
                                        onClick={generateChallenge}
                                        disabled={loading}
                                        className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-xl shadow-indigo-600/20 group"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                Verify & Attach Degree
                                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8 flex justify-center gap-6">
                                    <ShieldCheck className="w-5 h-5 text-slate-300" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by OpenAttestation</p>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-center space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">Scan to Verify</h2>
                                <p className="text-slate-500 font-medium">Open your EduCerts Wallet app and scan this code.</p>
                            </div>

                            <div className="p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-100 inline-block relative">
                                <img src={qrData} alt="QR Code" className="w-64 h-64" />
                                <div className="absolute inset-0 flex items-center justify-center animate-pulse pointer-events-none">
                                    <div className="w-72 h-72 border-2 border-indigo-600/20 rounded-[3.5rem]"></div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-6">
                                <div className="flex items-center justify-center gap-3 text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Awaiting wallet connection...</span>
                                </div>

                                <Card className="w-full max-w-xs border-dashed bg-slate-50/50 p-6 space-y-4">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Demo Sandbox</p>
                                    <input
                                        type="password"
                                        placeholder="Enter Wallet PIN..."
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-600/20"
                                        maxLength={6}
                                    />
                                    <Button
                                        onClick={simulateScan}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-12"
                                    >
                                        Simulate Scan & Authorize
                                    </Button>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100 text-center space-y-8 overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 relative">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                                <motion.div
                                    initial={{ scale: 1 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="absolute inset-0 bg-emerald-500 rounded-full"
                                />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-slate-900">Verification Successful</h2>
                                <p className="text-emerald-600 font-bold px-4 py-2 bg-emerald-50 rounded-full inline-block text-sm transform -rotate-1">
                                    Degree Verified via Ethiopia Blockchain
                                </p>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto pt-4">Your Bachelor's Degree has been securely attached to your application.</p>
                            </div>

                            <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold" onClick={() => setStep(1)}>
                                Finish Application
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

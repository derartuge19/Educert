"use client"

import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { Shield, ArrowRight, Mail, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({ name: "", email: "", password: "" })
    const [error, setError] = useState("")
    const { login, signup } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        try {
            if (isLogin) {
                await login(formData)
            } else {
                await signup(formData)
                setIsLogin(true)
                setError("Registration successful! Please login.")
            }
        } catch (err: unknown) {
            let errorMsg = "An error occurred"
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.detail || errorMsg
            }
            setError(errorMsg)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Brand Section */}
            <div className="hidden lg:flex bg-slate-50 border-r border-slate-200 flex-col p-12 justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="font-bold text-2xl tracking-tight text-slate-900">EduCerts<span className="text-indigo-600">.io</span></h1>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900">
                        Secure, Verifiable, <br /> Professional.
                    </h2>
                    <p className="text-lg text-slate-600 max-w-md font-medium">
                        The next generation of academic credentialing. Built on OpenAttestation standards with modern asymmetric encryption.
                    </p>
                </div>

                <div className="relative z-10 flex gap-8">
                    <div>
                        <p className="text-2xl font-bold text-slate-900">100%</p>
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Tamper proof</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">Ed25519</p>
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Encryption</p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="mb-8 block lg:hidden">
                            {/* Mobile Logo */}
                            <div className="flex items-center gap-3 justify-center mb-10">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="font-bold text-xl text-slate-900">EduCerts<span className="text-indigo-600">.io</span></h1>
                            </div>
                        </div>

                        <div className="text-center lg:text-left mb-8">
                            <h3 className="text-3xl font-bold text-slate-900 mb-2">{isLogin ? "Sign In" : "Get Started"}</h3>
                            <p className="text-slate-500 font-medium">{isLogin ? "Access your digital certificates." : "Create an account to start issuing."}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isLogin ? 'login' : 'signup'}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Name / Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-10 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 border"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>

                                    {!isLogin && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    required
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-10 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 border"
                                                    placeholder="name@example.com"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-10 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 border"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {error && (
                                <div className={`p-3 rounded-lg text-sm ${error.includes("successful") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-md font-bold shadow-lg shadow-indigo-600/20 group transition-all">
                                {isLogin ? "Sign In" : "Create Account"}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                                className="text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
                            >
                                {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

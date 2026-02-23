"use client"

import React from "react"

import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"
import { Settings, User, Shield, Key, Bell, Globe, Cpu, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
    const { user } = useAuth()

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Nav (Internal) */}
                <div className="space-y-1">
                    {[
                        { name: "My Profile", icon: User, active: true },
                        { name: "Security", icon: Shield },
                        { name: "API Keys", icon: Key },
                        { name: "Notifications", icon: Bell },
                        { name: "Integration", icon: Globe },
                    ].map((item) => (
                        <button
                            key={item.name}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${item.active ? "bg-white text-indigo-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                        >
                            <item.icon className={`w-4 h-4 ${item.active ? "text-indigo-600" : "text-slate-400"}`} />
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-900">Profile Information</CardTitle>
                            <CardDescription className="font-medium">Update your personal details and account settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
                                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-600/20">
                                    {user?.name?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{user?.name}</h4>
                                    <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
                                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${user?.is_admin ? "bg-indigo-100 text-indigo-600 border border-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
                                        {user?.is_admin ? "Administrator" : "Verified Student"}
                                    </span>
                                </div>
                                <Button variant="outline" size="sm" className="ml-auto bg-white border-slate-200 shadow-sm font-bold">Edit</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-900">Security & Encryption</CardTitle>
                            <CardDescription className="font-medium">Your account is protected by industry-standard cryptography.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <Cpu className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-900">Asymmetric Signing (Ed25519)</h5>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Every credential issued is signed using a unique Ed25519 private key. The public key is embedded in the JSON for verification.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <Database className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-900">Field Salting (OpenAttestation v2)</h5>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Individual fields are salted to prevent brute-force dictionary attacks on certificate data. Selective disclosure ready.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button variant="link" className="text-indigo-600 text-xs p-0 font-bold">Learn more about our security model</Button>
                        </CardFooter>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" className="text-slate-400 font-bold">Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-bold">Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

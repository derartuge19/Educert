"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { AnimatePresence, motion } from "framer-motion"
import {
    Search, FileText, CheckCircle2, Clock, XCircle, ShieldCheck, Eye, Trash2,
    Calendar, Tag, Download, RefreshCcw, LayoutGrid, List as ListIcon, Loader2,
    Fingerprint, ShieldAlert, MoreVertical, ExternalLink, Award, CheckSquare,
    Square, Trash, Ban, DownloadCloud
} from "lucide-react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Modal } from "@/components/ui/modal"

const API = "http://localhost:8000"

interface Certificate {
    id: string
    course_name: string
    student_name: string
    cert_type: string
    issued_at: string
    revoked: boolean
    signing_status: string // "signed" | "unsigned"
    organization: string
}

export default function CertificatesPage() {
    const { user } = useAuth()
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all") // all, signed, unsigned, revoked
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

    const router = useRouter()

    const fetchCerts = async () => {
        if (!user) return
        setLoading(true)
        setSelectedIds(new Set()) // Clear selection on refresh
        try {
            const endpoint = user.is_admin
                ? `${API}/api/certificates`
                : `${API}/api/certificates/${user.name}`
            const res = await axios.get<Certificate[]>(endpoint, { withCredentials: true })
            setCerts(res.data)
        } catch (error) {
            console.error("Error fetching certs", error)
        } finally {
            setLoading(false)
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
            description: "Are you sure you want to revoke this certificate? This action will mark it as invalid in the registry and cannot be reversed.",
            type: "danger",
            actionLabel: "Yes, Revoke",
            isLoading: false,
            onAction: async () => {
                setModalConfig(p => ({ ...p, isLoading: true }))
                try {
                    await axios.post(`${API}/api/revoke/${id}`, {}, { withCredentials: true })
                    fetchCerts()
                    closeModal()
                } catch (err) {
                    alert("Failed to revoke certificate")
                    setModalConfig(p => ({ ...p, isLoading: false }))
                }
            }
        })
    }

    const handleDelete = (id: string) => {
        setModalConfig({
            isOpen: true,
            title: "Delete Record",
            description: "PERMANENTLY DELETE this certificate record? This will remove all data and physical PDF files from the server.",
            type: "danger",
            actionLabel: "Delete Forever",
            isLoading: false,
            onAction: async () => {
                setModalConfig(p => ({ ...p, isLoading: true }))
                try {
                    await axios.delete(`${API}/api/certificates/${id}`, { withCredentials: true })
                    fetchCerts()
                    closeModal()
                } catch (err) {
                    alert("Failed to delete certificate")
                    setModalConfig(p => ({ ...p, isLoading: false }))
                }
            }
        })
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredCerts.map(c => c.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleBulkRevoke = () => {
        if (selectedIds.size === 0) return
        setModalConfig({
            isOpen: true,
            title: `Revoke ${selectedIds.size} Certificates`,
            description: `You are about to revoke ${selectedIds.size} certificates. This will notify the registry that these credentials are no longer valid.`,
            type: "danger",
            actionLabel: "Revoke Selected",
            isLoading: false,
            onAction: async () => {
                setModalConfig(p => ({ ...p, isLoading: true }))
                try {
                    await axios.post(`${API}/api/certificates/bulk-revoke`, {
                        cert_ids: Array.from(selectedIds)
                    }, { withCredentials: true })
                    fetchCerts()
                    closeModal()
                } catch (err) {
                    alert("Bulk revoke failed")
                    setModalConfig(p => ({ ...p, isLoading: false }))
                }
            }
        })
    }

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return
        setModalConfig({
            isOpen: true,
            title: `Delete ${selectedIds.size} Documents`,
            description: `This will permanently erase ${selectedIds.size} records and their associated PDF files. This action is irreversible.`,
            type: "danger",
            actionLabel: "Delete Selected",
            isLoading: false,
            onAction: async () => {
                setModalConfig(p => ({ ...p, isLoading: true }))
                try {
                    await axios.post(`${API}/api/certificates/bulk-delete`, {
                        cert_ids: Array.from(selectedIds)
                    }, { withCredentials: true })
                    fetchCerts()
                    closeModal()
                } catch (err) {
                    alert("Bulk delete failed")
                    setModalConfig(p => ({ ...p, isLoading: false }))
                }
            }
        })
    }

    const handleSignRedirect = (id: string) => {
        router.push(`/issue?step=2&certId=${id}`)
    }

    const categories = useMemo(() => {
        const cats = Array.from(new Set(certs.map(c => c.cert_type || "certificate")))
        return ["all", ...cats]
    }, [certs])

    const filteredCerts = useMemo(() => {
        return certs.filter(cert => {
            const matchesSearch =
                cert.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cert.id.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                statusFilter === "all" ? true :
                    statusFilter === "revoked" ? cert.revoked :
                        statusFilter === "signed" ? (cert.signing_status === "signed" && !cert.revoked) :
                            statusFilter === "unsigned" ? (cert.signing_status === "unsigned" && !cert.revoked) : true

            const matchesCategory =
                categoryFilter === "all" ? true : cert.cert_type === categoryFilter

            return matchesSearch && matchesStatus && matchesCategory
        })
    }, [certs, searchTerm, statusFilter, categoryFilter])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Registry...</p>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative pb-32">
            <Modal {...modalConfig} onClose={closeModal} />

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={selectedIds.size > 0 && selectedIds.size === filteredCerts.length}
                            onCheckedChange={handleSelectAll}
                            className="bg-white border-slate-300"
                        />
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <Award className="w-10 h-10 text-indigo-600" />
                            Certificate Registry
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg ml-9">
                        {user?.is_admin ? "Manage and audit all issued educational credentials." : "Your verifiable academic portfolio."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name... (e.g. John Doe)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 border font-bold shadow-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-slate-200 h-[46px] w-[46px]"
                        onClick={() => fetchCerts()}
                    >
                        <RefreshCcw className="w-4 h-4 text-slate-600" />
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                    <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm">
                        <TabsTrigger value="all" className="rounded-lg px-4 py-2 font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all capitalize">All ({certs.length})</TabsTrigger>
                        <TabsTrigger value="signed" className="rounded-lg px-4 py-2 font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all capitalize">Signed</TabsTrigger>
                        <TabsTrigger value="unsigned" className="rounded-lg px-4 py-2 font-bold text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all capitalize">Unsigned</TabsTrigger>
                        <TabsTrigger value="revoked" className="rounded-lg px-4 py-2 font-bold text-xs data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all capitalize">Revoked</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none focus:ring-0 capitalize"
                        >
                            <option value="all">Every Category</option>
                            {categories.filter(c => c !== "all").map(cat => (
                                <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            className={`rounded-none px-3 border-none ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            className={`rounded-none px-3 border-none ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                            onClick={() => setViewMode("list")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[40] w-full max-w-2xl px-4"
                    >
                        <div className="bg-slate-900 text-white rounded-[2rem] p-4 shadow-2xl shadow-indigo-500/20 border border-white/10 flex items-center justify-between gap-6 backdrop-blur-xl">
                            <div className="flex items-center gap-4 ml-4">
                                <div className="bg-indigo-600 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full shadow-lg">
                                    {selectedIds.size}
                                </div>
                                <p className="text-sm font-bold text-slate-300">items selected</p>
                            </div>

                            <div className="flex items-center gap-2 pr-2">
                                <Button
                                    onClick={handleBulkRevoke}
                                    variant="ghost"
                                    className="h-12 px-6 rounded-2xl text-xs font-black text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Revoke
                                </Button>
                                <Button
                                    onClick={handleBulkDelete}
                                    className="h-12 px-8 rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all active:scale-95"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete Documents
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence mode="wait">
                {filteredCerts.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}
                    >
                        {filteredCerts.map((cert) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={cert.id}
                                className={`group relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden bg-white/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/10 ${cert.revoked
                                    ? "border-rose-200 grayscale-[0.5]"
                                    : cert.signing_status === "signed"
                                        ? "border-emerald-100 hover:border-emerald-500/40"
                                        : "border-amber-100 hover:border-indigo-500/40"
                                    } ${selectedIds.has(cert.id) ? "ring-4 ring-indigo-500/30 border-indigo-500" : ""}`}
                            >
                                <div className="absolute top-4 left-4 z-10">
                                    <Checkbox
                                        checked={selectedIds.has(cert.id)}
                                        onCheckedChange={() => toggleSelect(cert.id)}
                                        className="bg-white/80 backdrop-blur border-slate-200"
                                    />
                                </div>

                                {/* Premium Card Background Accent */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${cert.revoked ? "bg-rose-500" : cert.signing_status === "signed" ? "bg-emerald-500" : "bg-indigo-500"}`}></div>

                                <div className="p-8 pt-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-3xl shadow-lg ring-1 ring-white/50 ${cert.revoked ? "bg-rose-50 text-rose-600" :
                                            cert.signing_status === "signed" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                                            }`}>
                                            <Fingerprint className="w-10 h-10" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2.5">
                                            <div className="flex gap-2">
                                                {cert.revoked ? (
                                                    <Badge variant="destructive" className="rounded-full font-black uppercase text-[10px] px-3 py-1 shadow-sm border-2 border-white">
                                                        Revoked
                                                    </Badge>
                                                ) : cert.signing_status === "signed" ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black uppercase text-[10px] px-3 py-1 shadow-sm border-2 border-white">
                                                        Standard
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-500 text-white border-none rounded-full font-black uppercase text-[10px] px-3 py-1 shadow-sm border-2 border-white">
                                                        Unsigned
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-mono font-bold tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">#{cert.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[2.2em]">{cert.course_name}</h3>
                                            <div className="flex flex-col gap-3 mt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 border-2 border-white shadow-sm overflow-hidden">
                                                        {cert.student_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-700 capitalize line-clamp-1">{cert.student_name}</p>
                                                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">{cert.organization || "Academic Institute"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <p className="text-[12px] text-slate-400 font-bold flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(cert.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <div className="px-3 py-1 rounded-xl bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200/50">
                                                        {cert.cert_type || "Credential"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                                            <div className="flex-1 flex gap-2">
                                                {!cert.revoked && (
                                                    <>
                                                        {user?.is_admin && cert.signing_status === "unsigned" && (
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 font-black rounded-2xl h-12 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                onClick={() => handleSignRedirect(cert.id)}
                                                            >
                                                                <ShieldCheck className="w-5 h-5 mr-2" />
                                                                Sign Now
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            className={`flex-1 bg-slate-900 hover:bg-indigo-600 text-white shadow-lg shadow-slate-900/20 font-black rounded-2xl h-12 transition-all hover:scale-[1.02] active:scale-[0.98] ${cert.signing_status === "unsigned" ? "hidden" : ""}`}
                                                            onClick={() => window.open(`${API}/api/download/${cert.id}`)}
                                                        >
                                                            <Eye className="w-5 h-5 mr-2" />
                                                            Preview
                                                        </Button>
                                                    </>
                                                )}
                                                {user?.is_admin && (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-2xl border-slate-200 h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                                        onClick={() => handleDelete(cert.id)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-12 px-4 text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl"
                                                onClick={() => window.location.href = `/verify?id=${cert.id}`}
                                            >
                                                Verify
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="bg-slate-50/50 border-slate-200 border-dashed border-4 py-32 rounded-[2rem] shadow-none">
                            <CardContent className="flex flex-col items-center space-y-6">
                                <Award className="w-20 h-20 text-slate-200 animate-pulse" />
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest leading-none">No Match Found</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto mt-4 font-bold text-sm">
                                        Try adjusting your filters or search terms. If you haven't issued any certs yet, head over to the Issuance page!
                                    </p>
                                    <Button
                                        variant="link"
                                        className="mt-4 text-indigo-600 font-bold"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("all");
                                            setCategoryFilter("all");
                                        }}
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

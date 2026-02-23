"use client"

import React, { useState, useRef, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import {
    Shield, Upload, Loader2, Sparkles, Download, FilePlus,
    Check, ArrowRight, X, Tag, Eye, LayoutTemplate, RefreshCw,
    GraduationCap, Award, BookOpen, Briefcase, Star, Users, FileText,
    AlertCircle, Table2, FileSpreadsheet, CheckCircle2, PenLine,
    Stamp, UserCheck, ChevronRight, FileSearch, Signature, Lock,
    ClipboardCheck, SquarePen
} from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const API = "http://localhost:8000"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedTemplate {
    all_fields: string[]
    system_fields: string[]
    signature_fields: string[]
    custom_fields: string[]
    input_fields: string[]
    template_name: string
    template_type: "html" | "pdf"
}

interface IssuedCert {
    id: string
    student_name: string
    course_name: string
    signing_status: "unsigned" | "signed"
}

interface SignRecord {
    id: number
    signer_name: string
    signer_role: string
    has_signature: boolean
    has_stamp: boolean
    uploaded_at: string
}

// ── Cert Types ─────────────────────────────────────────────────────────────────
const CERT_TYPES = [
    { id: "degree", label: "Degree", icon: GraduationCap, color: "from-indigo-500 to-indigo-700", border: "border-indigo-200", ring: "ring-indigo-500", bg: "bg-indigo-50", desc: "Bachelor's, Master's, PhD" },
    { id: "diploma", label: "Diploma", icon: Award, color: "from-violet-500 to-violet-700", border: "border-violet-200", ring: "ring-violet-500", bg: "bg-violet-50", desc: "Diploma, HND, Foundation" },
    { id: "training", label: "Training", icon: BookOpen, color: "from-emerald-500 to-emerald-700", border: "border-emerald-200", ring: "ring-emerald-500", bg: "bg-emerald-50", desc: "Bootcamp, workshop, course" },
    { id: "professional", label: "Professional", icon: Briefcase, color: "from-amber-500 to-amber-700", border: "border-amber-200", ring: "ring-amber-500", bg: "bg-amber-50", desc: "Certification, license" },
    { id: "achievement", label: "Achievement", icon: Star, color: "from-rose-500 to-rose-700", border: "border-rose-200", ring: "ring-rose-500", bg: "bg-rose-50", desc: "Award, honor, recognition" },
    { id: "attendance", label: "Attendance", icon: Users, color: "from-sky-500 to-sky-700", border: "border-sky-200", ring: "ring-sky-500", bg: "bg-sky-50", desc: "Event, conference, seminar" },
    { id: "certificate", label: "Generic", icon: FileText, color: "from-slate-500 to-slate-700", border: "border-slate-200", ring: "ring-slate-500", bg: "bg-slate-50", desc: "Custom / other" },
]

const SYSTEM_AUTO = new Set(["issued_at", "cert_id", "signature", "qr_code"])
const SIG_FIELDS = new Set(["digital_signature", "stamp"])
const SYSTEM_AUTO_LABELS: Record<string, string> = {
    issued_at: "Issue Date (auto)", cert_id: "Certificate ID (auto)",
    signature: "Cryptographic Signature (auto)", qr_code: "QR Code (auto)",
    digital_signature: "Digital Signature (signing step)", stamp: "Official Stamp (signing step)",
}

// ── Fuzzy Field Helpers ────────────────────────────────────────────────────────
const normalizeKey = (k: string) => k.toLowerCase().replace(/_/g, "").replace(/\s/g, "")
const isNameField = (k: string) => {
    const n = normalizeKey(k)
    return n === "studentname" || n === "fullname" || n === "name" || n === "recipient" || n === "recipientname"
}
const isCourseField = (k: string) => {
    const n = normalizeKey(k)
    return n === "coursename" || n === "course" || n === "subject" || n === "program" || n === "training"
}

// ── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current, step, label, icon: Icon }: { current: number; step: number; label: string; icon: React.ElementType }) {
    const done = current > step
    const active = current === step
    return (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all ${active ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100" : done ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white opacity-50"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-indigo-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <div>
                <p className={`text-xs font-black uppercase tracking-widest ${active ? "text-indigo-700" : done ? "text-emerald-700" : "text-slate-400"}`}>Step {step}</p>
                <p className={`text-sm font-bold leading-tight ${active ? "text-indigo-900" : done ? "text-emerald-900" : "text-slate-400"}`}>{label}</p>
            </div>
            {active && <ChevronRight className="w-4 h-4 text-indigo-400 ml-auto" />}
        </div>
    )
}

// ── Template Upload Widget ─────────────────────────────────────────────────────
function TemplateUpload({ parsed, parsing, onFile, onClear }: {
    parsed: ParsedTemplate | null; parsing: boolean; onFile: (f: File) => void; onClear: () => void
}) {
    const ref = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)

    return (
        <Card
            className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer ${dragging ? "border-violet-500 bg-violet-50" : parsed ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-violet-300"}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
                e.preventDefault(); setDragging(false)
                const f = e.dataTransfer.files[0]
                if (f && (f.name.endsWith(".html") || f.name.endsWith(".pdf"))) onFile(f)
            }}
            onClick={() => !parsed && ref.current?.click()}
        >
            <CardContent className="p-6 text-center space-y-3">
                <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${parsed ? "bg-emerald-100" : dragging ? "bg-violet-100" : "bg-slate-50 border border-slate-200"}`}>
                    {parsing
                        ? <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
                        : parsed
                            ? <Check className="w-7 h-7 text-emerald-600" />
                            : <LayoutTemplate className={`w-7 h-7 ${dragging ? "text-violet-600" : "text-slate-400"}`} />
                    }
                </div>
                <div>
                    <h3 className={`text-base font-bold ${parsed ? "text-emerald-700" : "text-slate-800"}`}>
                        {parsed ? `${parsed.template_name}` : "Upload Certificate Template"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {parsing ? "Extracting fields…"
                            : parsed
                                ? `${parsed.all_fields.length} fields extracted — ${parsed.template_type.toUpperCase()} template ready`
                                : "Drag & drop or click — .pdf or .html"}
                    </p>
                </div>
                {!parsed && (
                    <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-3 text-left max-w-xs mx-auto space-y-1">
                        <p className="font-bold text-slate-600">Use {"{{ }}"} placeholders in your template:</p>
                        <code className="text-violet-600">{"{{ student_name }}, {{ course_name }}, {{ gpa }}"}</code>
                        <p className="font-bold text-slate-600 pt-1">For signing areas:</p>
                        <code className="text-indigo-600">{"{{ digital_signature }},  {{ stamp }}"}</code>
                    </div>
                )}
                {parsed && (
                    <button onClick={e => { e.stopPropagation(); onClear() }}
                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mx-auto mt-1">
                        <RefreshCw className="w-3 h-3" /> Change template
                    </button>
                )}
                <input ref={ref} type="file" accept=".html,.pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
            </CardContent>
        </Card>
    )
}

// ── Image Upload Box ────────────────────────────────────────────────────────────
function ImageUploadBox({ label, icon: Icon, file, onChange, accept = "image/*" }: {
    label: string; icon: React.ElementType; file: File | null; onChange: (f: File | null) => void; accept?: string
}) {
    const ref = useRef<HTMLInputElement>(null)
    const preview = file ? URL.createObjectURL(file) : null
    return (
        <div
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${file ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 bg-slate-50"}`}
            onClick={() => ref.current?.click()}
        >
            {preview ? (
                <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={label} className="max-h-24 mx-auto rounded-lg object-contain" />
                    <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center"
                        onClick={e => { e.stopPropagation(); onChange(null) }}
                    ><X className="w-3 h-3" /></button>
                </div>
            ) : (
                <>
                    <Icon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">{label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG / JPG / WEBP</p>
                </>
            )}
            <input ref={ref} type="file" accept={accept} className="hidden"
                onChange={e => onChange(e.target.files?.[0] || null)} />
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IssuePage() {
    const { user } = useAuth()

    // ── Step state
    const [step, setStep] = useState<1 | 2>(1)

    // ── Global feedback
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // ── Step 1: Template
    const [parsedTemplate, setParsedTemplate] = useState<ParsedTemplate | null>(null)
    const [templateParsing, setTemplateParsing] = useState(false)

    // ── Step 1: Issue mode
    const [issueMode, setIssueMode] = useState<"single" | "bulk">("single")
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({})
    const [bulkFile, setBulkFile] = useState<File | null>(null)
    const bulkInputRef = useRef<HTMLInputElement>(null)

    // ── Step 1: Issued certs  
    const [issuedCerts, setIssuedCerts] = useState<IssuedCert[]>([])

    // ── Step 2: Signing
    const [signerName, setSignerName] = useState("")
    const [signerRole, setSignerRole] = useState("")
    const [signatureFile, setSignatureFile] = useState<File | null>(null)
    const [stampFile, setStampFile] = useState<File | null>(null)
    const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set())
    const [signedResults, setSignedResults] = useState<Array<{ id: string; student_name: string }>>([])
    const [sigRecordId, setSigRecordId] = useState<number | null>(null)
    const [signLoading, setSignLoading] = useState(false)
    const [uploadedSignatureRecord, setUploadedSignatureRecord] = useState<SignRecord | null>(null)

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const parseTemplate = async (file: File) => {
        setTemplateParsing(true); setError("")
        try {
            const fd = new FormData(); fd.append("file", file)
            const res = await axios.post<ParsedTemplate>(`${API}/api/templates/parse`, fd)
            setParsedTemplate(res.data)
            const init: Record<string, string> = {}
            for (const f of res.data.input_fields) init[f] = ""
            setTemplateFields(init)
        } catch {
            setError("Failed to parse template. Ensure it's a valid .html or .pdf file.")
        } finally { setTemplateParsing(false) }
    }

    const clearTemplate = () => {
        setParsedTemplate(null); setTemplateFields({})
        setBulkFile(null)
        if (bulkInputRef.current) bulkInputRef.current.value = ""
    }

    const handleSingleIssue = async () => {
        if (!parsedTemplate) return

        // Find best candidates for required fields
        const sNameKey = Object.keys(templateFields).find(isNameField) || "student_name"
        const cNameKey = Object.keys(templateFields).find(isCourseField) || "course_name"

        const sName = templateFields[sNameKey] || ""
        const cName = templateFields[cNameKey] || ""

        if (!sName.trim() || !cName.trim()) {
            setError("A Name and Course/Subject are required.");
            return
        }

        setLoading(true); setError("")
        try {
            // For PDF templates: use bulk-issue-excel with a synthetic single row via the API
            // For HTML: use the existing /api/issue endpoint  
            if (parsedTemplate.template_type === "pdf") {
                // Build a one-row CSV in memory and POST it
                const headers = Object.keys(templateFields).join(",")
                const values = Object.values(templateFields).map(v => `"${v}"`).join(",")
                const csvContent = `${headers}\n${values}`
                const csvBlob = new Blob([csvContent], { type: "text/csv" })
                const csvFile = new File([csvBlob], "single.csv")
                const fd = new FormData(); fd.append("file", csvFile)
                const res = await axios.post(`${API}/api/templates/bulk-issue-excel`, fd, { withCredentials: true })
                const certs: IssuedCert[] = (res.data.certificates || []).map((c: IssuedCert) => ({ ...c, signing_status: "unsigned" }))
                setIssuedCerts(certs)
                setSelectedCertIds(new Set(certs.map((c: IssuedCert) => c.id)))
            } else {
                const res = await axios.post(`${API}/api/issue`, {
                    student_name: sName,
                    course_name: cName,
                    cert_type: templateFields["cert_type"] || "certificate",
                    data_payload: { ...templateFields }
                }, { withCredentials: true })
                const cert: IssuedCert = { id: res.data.id, student_name: sName, course_name: cName, signing_status: "unsigned" }
                setIssuedCerts([cert])
                setSelectedCertIds(new Set([cert.id]))
            }
            setTemplateFields({})
            setStep(2)
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Failed to issue" : "Failed")
        } finally { setLoading(false) }
    }

    const handleBulkIssue = async () => {
        if (!bulkFile) return
        setLoading(true); setError("")
        try {
            const fd = new FormData(); fd.append("file", bulkFile)
            const endpoint = bulkFile.name.endsWith(".xlsx")
                ? `${API}/api/templates/bulk-issue-excel`
                : `${API}/api/templates/bulk-issue`
            const res = await axios.post(endpoint, fd, { withCredentials: true })
            const certs: IssuedCert[] = (res.data.certificates || []).map((c: IssuedCert) => ({ ...c, signing_status: "unsigned" }))
            setIssuedCerts(certs)
            setSelectedCertIds(new Set(certs.map((c: IssuedCert) => c.id)))
            setBulkFile(null)
            if (bulkInputRef.current) bulkInputRef.current.value = ""
            setStep(2)
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Bulk import failed" : "Bulk import failed")
        } finally { setLoading(false) }
    }

    const handleUploadSignatureAssets = async () => {
        if (!signerName || !signerRole) { setError("Signer name and role are required."); return }
        if (!signatureFile && !stampFile) { setError("Upload at least a signature or stamp image."); return }
        setSignLoading(true); setError("")
        try {
            const fd = new FormData()
            if (signatureFile) fd.append("signature_file", signatureFile)
            if (stampFile) fd.append("stamp_file", stampFile)
            fd.append("signer_name", signerName)
            fd.append("signer_role", signerRole)
            const res = await axios.post<SignRecord>(`${API}/api/sign/upload`, fd, { withCredentials: true })
            setSigRecordId(res.data.id)
            setUploadedSignatureRecord(res.data)
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Upload failed" : "Upload failed")
        } finally { setSignLoading(false) }
    }

    const handleApplySignatures = async () => {
        if (selectedCertIds.size === 0) { setError("Select at least one certificate to sign."); return }
        if (!sigRecordId) { setError("Upload your signature/stamp first."); return }
        setSignLoading(true); setError("")
        try {
            const res = await axios.post(`${API}/api/sign/apply`, {
                cert_ids: Array.from(selectedCertIds),
                signer_name: signerName,
                signer_role: signerRole,
                signature_record_id: sigRecordId
            }, { withCredentials: true })
            setSignedResults(res.data.signed || [])
            // Update local state
            setIssuedCerts(prev => prev.map(c =>
                selectedCertIds.has(c.id) ? { ...c, signing_status: "signed" } : c
            ))
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Signing failed" : "Signing failed")
        } finally { setSignLoading(false) }
    }

    const toggleCert = useCallback((id: string) => {
        setSelectedCertIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    // ─────────────────────────────────────────────────────────────────────────
    // Access guard
    // ─────────────────────────────────────────────────────────────────────────

    if (!user?.is_admin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-900">Access Restricted</h1>
                <p className="text-slate-500 max-w-sm font-medium">Only authorized administrators can issue credentials.</p>
            </div>
        )
    }

    const allSigned = issuedCerts.length > 0 && issuedCerts.every(c => c.signing_status === "signed")

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">

            {/* ── Page Header ── */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <FilePlus className="w-8 h-8 text-indigo-600" />Issue Credentials
                </h1>
                <p className="text-slate-500 font-medium mt-1">Two-step process: generate certificates from a template, then apply digital signatures.</p>
            </div>

            {/* ── Step Indicators ── */}
            <div className="grid grid-cols-2 gap-3">
                <StepIndicator current={step} step={1} label="Generate Certificates" icon={FilePlus} />
                <StepIndicator current={step} step={2} label="Sign & Stamp" icon={PenLine} />
            </div>

            {/* ── Global error / success ── */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700 font-medium flex-1">{error}</p>
                        <button onClick={() => setError("")}><X className="w-4 h-4 text-red-400 hover:text-red-600" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════
                STEP 1 — GENERATE CERTIFICATES
                ══════════════════════════════════════════════════════════════ */}
            {step === 1 && (
                <div className="space-y-6">

                    {/* Template upload */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileSearch className="w-3.5 h-3.5" /> Step 1A — Upload Template <span className="text-red-400 text-[10px] normal-case font-semibold tracking-normal">(Required)</span>
                        </p>
                        <TemplateUpload parsed={parsedTemplate} parsing={templateParsing} onFile={parseTemplate} onClear={clearTemplate} />
                    </div>

                    {!parsedTemplate && !templateParsing && (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-700 font-medium">
                                Upload a <strong>.pdf</strong> or <strong>.html</strong> template above. All <code className="text-amber-800 bg-amber-100 px-1 rounded">{"{{placeholder}}"}</code> fields will become form inputs automatically.
                            </p>
                        </div>
                    )}

                    {parsedTemplate && (
                        <AnimatePresence>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                                {/* Signature fields info banner */}
                                {parsedTemplate.signature_fields?.length > 0 && (
                                    <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                                        <Signature className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-indigo-800">Signature placeholders detected</p>
                                            <p className="text-xs text-indigo-600 mt-0.5">
                                                {parsedTemplate.signature_fields.map(f => (
                                                    <code key={f} className="bg-indigo-100 px-1.5 py-0.5 rounded mr-1">{`{{${f}}}`}</code>
                                                ))}
                                                — these will be filled in Step 2 with your uploaded signature/stamp images.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Auto-filled system fields */}
                                {parsedTemplate.system_fields.filter(f => SYSTEM_AUTO.has(f)).length > 0 && (
                                    <Card className="bg-slate-50 border-slate-200 rounded-2xl">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Eye className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Auto-Filled by System</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {[...parsedTemplate.system_fields.filter(f => SYSTEM_AUTO.has(f)),
                                                ...parsedTemplate.signature_fields || []].map(f => (
                                                    <span key={f} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                                        <Check className="w-3 h-3 text-emerald-500" />{SYSTEM_AUTO_LABELS[f] || f}
                                                    </span>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Single / Bulk toggle */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                                    {[{ key: "single", label: "Single Certificate", icon: SquarePen },
                                    { key: "bulk", label: "Bulk (CSV / Excel)", icon: FileSpreadsheet }].map(m => (
                                        <button key={m.key} onClick={() => setIssueMode(m.key as "single" | "bulk")}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${issueMode === m.key ? "bg-white shadow text-indigo-700 border border-indigo-100" : "text-slate-500 hover:text-slate-800"}`}>
                                            <m.icon className="w-4 h-4" />{m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* ── Single mode ── */}
                                {issueMode === "single" && (
                                    <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-600" />Fill in Certificate Fields</CardTitle>
                                            <CardDescription>
                                                {parsedTemplate.input_fields.length} field{parsedTemplate.input_fields.length !== 1 ? "s" : ""} extracted from <span className="font-semibold text-violet-600">{parsedTemplate.template_name}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {parsedTemplate.input_fields.map(field => {
                                                const isCore = isNameField(field) || isCourseField(field)
                                                const isSig = SIG_FIELDS.has(field)
                                                if (isSig) return null // handled in step 2
                                                return (
                                                    <div key={field} className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                            <span className={`w-2 h-2 rounded-full inline-block ${isCore ? "bg-indigo-500" : "bg-violet-400"}`} />
                                                            {field.replace(/_/g, " ")}
                                                            {isCore && <span className="text-red-400">*</span>}
                                                        </label>
                                                        <input type="text" placeholder={`Enter ${field.replace(/_/g, " ")}`}
                                                            value={templateFields[field] || ""}
                                                            onChange={e => setTemplateFields({ ...templateFields, [field]: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 outline-none transition-all font-medium placeholder:text-slate-400" />
                                                    </div>
                                                )
                                            })}
                                            <div className="md:col-span-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-2">
                                                <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                                                <p className="text-[10px] leading-tight font-medium text-slate-600">
                                                    Fields will be injected into the template at the exact placeholder positions. All fields are individually salted, hashed, and signed with Ed25519.
                                                </p>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-slate-50 border-t border-slate-100 p-5">
                                            {(() => {
                                                const hasName = Object.keys(templateFields).some(k => isNameField(k) && templateFields[k].trim())
                                                const hasCourse = Object.keys(templateFields).some(k => isCourseField(k) && templateFields[k].trim())
                                                const canIssue = hasName && hasCourse

                                                return (
                                                    <Button onClick={handleSingleIssue}
                                                        className="w-full h-12 rounded-xl text-base font-bold group shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 border-0"
                                                        disabled={loading || !canIssue}>
                                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                            <>Generate Certificate <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                                                        )}
                                                    </Button>
                                                )
                                            })()}
                                        </CardFooter>
                                    </Card>
                                )}

                                {/* ── Bulk mode ── */}
                                {issueMode === "bulk" && (
                                    <div className="space-y-5">
                                        {/* Column mapping table */}
                                        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="h-1 bg-indigo-500" />
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Table2 className="w-4 h-4 text-indigo-500" />
                                                    CSV / Excel Column → Template Field Mapping
                                                </CardTitle>
                                                <CardDescription>
                                                    Your file must have these exact column headers. Each row = one certificate.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Column Header</th>
                                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Template Placeholder</th>
                                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Required?</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {parsedTemplate.input_fields.filter(f => !SIG_FIELDS.has(f)).map((field, i) => (
                                                                <tr key={field} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                                    <td className="px-4 py-2.5"><code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono text-xs">{field}</code></td>
                                                                    <td className="px-4 py-2.5"><code className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded font-mono text-xs">{"{{ " + field + " }}"}</code></td>
                                                                    <td className="px-4 py-2.5">
                                                                        {(field === "student_name" || field === "course_name")
                                                                            ? <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Required</span>
                                                                            : <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {parsedTemplate.system_fields.filter(f => SYSTEM_AUTO.has(f)).map((field, i) => (
                                                                <tr key={field} className={(parsedTemplate.input_fields.length + i) % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                                    <td className="px-4 py-2.5"><span className="text-slate-400 italic text-xs">(auto)</span></td>
                                                                    <td className="px-4 py-2.5"><code className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">{"{{ " + field + " }}"}</code></td>
                                                                    <td className="px-4 py-2.5"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-filled</span></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* File upload */}
                                        <Card className="bg-white border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
                                            <div className="h-1 bg-indigo-600" />
                                            <CardContent className="p-8 text-center space-y-5">
                                                <div className="w-16 h-16 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center border-2 border-slate-100">
                                                    <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Upload Bulk Data File</h3>
                                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                                        Upload a <strong>.csv</strong> or <strong>.xlsx</strong> (Excel) file. Each row generates one signed certificate.
                                                    </p>
                                                </div>
                                                <input ref={bulkInputRef} type="file" accept=".csv,.xlsx" id="bulk-upload"
                                                    onChange={e => e.target.files && setBulkFile(e.target.files[0])} className="hidden" />
                                                <div className="flex flex-col gap-3 items-center">
                                                    <label htmlFor="bulk-upload"
                                                        className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 cursor-pointer border border-slate-200 font-semibold shadow-sm flex items-center gap-2">
                                                        <Upload className="w-4 h-4" />
                                                        {bulkFile ? bulkFile.name : "Select .csv or .xlsx File"}
                                                    </label>
                                                    {bulkFile && (
                                                        <Button onClick={handleBulkIssue}
                                                            className="bg-indigo-600 hover:bg-indigo-700 max-w-sm w-full h-12 rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                                                            disabled={loading}>
                                                            {loading
                                                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Issuing…</>
                                                                : <><FileSpreadsheet className="w-4 h-4 mr-2" />Issue All from {bulkFile.name}</>
                                                            }
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 2 — SIGN & STAMP
                ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
                <div className="space-y-6">
                    {/* Summary banner */}
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-emerald-800">{issuedCerts.length} Certificate{issuedCerts.length !== 1 ? "s" : ""} Generated</h3>
                            <p className="text-sm text-emerald-600 mt-0.5">Now apply your digital signature and/or official stamp to finalize them.</p>
                        </div>
                        <button onClick={() => { setStep(1); setIssuedCerts([]); setSignedResults([]) }}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5" /> Start Over
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* ── Left: Signer Info + Images ── */}
                        <div className="space-y-5">
                            <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600" />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-purple-600" />Signer Details</CardTitle>
                                    <CardDescription>Upload your signature and stamp, then apply them to the selected certificates.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Signer Full Name *</label>
                                        <input type="text" placeholder="e.g. Dr. Abebe Girma"
                                            value={signerName} onChange={e => setSignerName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all font-medium placeholder:text-slate-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role / Title *</label>
                                        <input type="text" placeholder="e.g. Dean of Faculty / Director"
                                            value={signerRole} onChange={e => setSignerRole(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all font-medium placeholder:text-slate-400" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><PenLine className="w-3 h-3" /> Signature</p>
                                            <ImageUploadBox label="Upload Signature" icon={Signature} file={signatureFile} onChange={setSignatureFile} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Stamp className="w-3 h-3" /> Stamp</p>
                                            <ImageUploadBox label="Upload Stamp" icon={Stamp} file={stampFile} onChange={setStampFile} />
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-slate-400 text-center">
                                        Images will be placed on top of the <code>{"{{digital_signature}}"}</code> / <code>{"{{stamp}}"}</code> placeholders in the PDF.
                                    </p>
                                </CardContent>
                                <CardFooter className="border-t border-slate-100 bg-slate-50 p-5 flex flex-col gap-3">
                                    {!uploadedSignatureRecord ? (
                                        <Button onClick={handleUploadSignatureAssets}
                                            className="w-full h-11 rounded-xl font-bold bg-purple-600 hover:bg-purple-700"
                                            disabled={signLoading || !signerName || !signerRole || (!signatureFile && !stampFile)}>
                                            {signLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Upload Signature & Stamp
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl w-full">
                                            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-purple-800">Signature assets uploaded</p>
                                                <p className="text-xs text-purple-600">
                                                    {uploadedSignatureRecord.has_signature ? "✓ Signature " : ""}
                                                    {uploadedSignatureRecord.has_stamp ? "✓ Stamp" : ""}
                                                </p>
                                            </div>
                                            <button className="text-xs text-purple-400 hover:text-purple-700 font-semibold"
                                                onClick={() => { setUploadedSignatureRecord(null); setSigRecordId(null) }}>
                                                Change
                                            </button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>

                        {/* ── Right: Certificate Selection ── */}
                        <div className="space-y-5">
                            <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-sky-500" />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-indigo-600" />Select Certificates to Sign</CardTitle>
                                    <CardDescription>
                                        {selectedCertIds.size} of {issuedCerts.length} selected
                                        <button className="ml-3 text-indigo-600 hover:text-indigo-800 font-semibold underline text-xs"
                                            onClick={() => setSelectedCertIds(new Set(issuedCerts.map(c => c.id)))}>
                                            Select All
                                        </button>
                                        <button className="ml-2 text-slate-500 hover:text-slate-700 font-semibold underline text-xs"
                                            onClick={() => setSelectedCertIds(new Set())}>
                                            None
                                        </button>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 max-h-64 overflow-y-auto">
                                    {issuedCerts.map((cert, i) => (
                                        <div key={cert.id}
                                            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${selectedCertIds.has(cert.id) ? "bg-indigo-50" : "bg-white hover:bg-slate-50"}`}
                                            onClick={() => cert.signing_status !== "signed" && toggleCert(cert.id)}>
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${cert.signing_status === "signed" ? "border-emerald-500 bg-emerald-500" : selectedCertIds.has(cert.id) ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                                                {(cert.signing_status === "signed" || selectedCertIds.has(cert.id)) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{cert.student_name}</p>
                                                <p className="text-xs text-slate-500 truncate">{cert.course_name}</p>
                                            </div>

                                            {/* Preview Button */}
                                            <a
                                                href={`${API}/api/download/${cert.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Preview Unsigned Certificate"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>

                                            {cert.signing_status === "signed" ? (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">Signed</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Pending</span>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                                <CardFooter className="border-t border-slate-100 bg-slate-50 p-5">
                                    <Button onClick={handleApplySignatures}
                                        className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 shadow-lg shadow-indigo-600/20"
                                        disabled={signLoading || !sigRecordId || selectedCertIds.size === 0 || allSigned}>
                                        {signLoading
                                            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing…</>
                                            : allSigned
                                                ? <><CheckCircle2 className="w-4 h-4 mr-2" />All Signed!</>
                                                : <><Lock className="w-4 h-4 mr-2" />Apply Digital Signature to {selectedCertIds.size} Cert{selectedCertIds.size !== 1 ? "s" : ""}</>
                                        }
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Download section — shown after signing */}
                            {signedResults.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="bg-white border-emerald-200 shadow-lg rounded-2xl overflow-hidden">
                                        <div className="h-1.5 bg-emerald-500" />
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                {signedResults.length} Certificate{signedResults.length !== 1 ? "s" : ""} Signed — Ready to Download
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 max-h-48 overflow-y-auto p-4">
                                            {signedResults.map(cert => (
                                                <div key={cert.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                                    <div>
                                                        <p className="text-sm font-semibold text-emerald-900">{cert.student_name}</p>
                                                    </div>
                                                    <a href={`${API}/api/download/${cert.id}`} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm transition-all hover:shadow">
                                                        <Download className="w-3.5 h-3.5" /> Download PDF
                                                    </a>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

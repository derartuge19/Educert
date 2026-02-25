"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children?: React.ReactNode
    type?: "info" | "danger" | "success"
    actionLabel?: string
    onAction?: () => void
    isLoading?: boolean
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    type = "info",
    actionLabel,
    onAction,
    isLoading
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    const icons = {
        info: <Info className="w-6 h-6 text-indigo-600" />,
        danger: <AlertCircle className="w-6 h-6 text-rose-600" />,
        success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />
    }

    const actionColors = {
        info: "bg-indigo-600 hover:bg-indigo-700",
        danger: "bg-rose-600 hover:bg-rose-700",
        success: "bg-emerald-600 hover:bg-emerald-700"
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden bg-white rounded-[2.5rem] shadow-2xl border border-slate-200"
                    >
                        <div className="absolute top-6 right-6">
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-10 pt-12">
                            <div className="flex items-start gap-5 mb-8">
                                <div className={cn(
                                    "p-4 rounded-3xl shadow-sm border",
                                    type === "info" && "bg-indigo-50 border-indigo-100",
                                    type === "danger" && "bg-rose-50 border-rose-100",
                                    type === "success" && "bg-emerald-50 border-emerald-100"
                                )}>
                                    {icons[type]}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                                    {description && (
                                        <p className="text-slate-500 font-medium">{description}</p>
                                    )}
                                </div>
                            </div>

                            {children && (
                                <div className="mb-8">
                                    {children}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 h-14 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50"
                                >
                                    Cancel
                                </Button>
                                {actionLabel && onAction && (
                                    <Button
                                        onClick={onAction}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex-1 h-14 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95",
                                            actionColors[type]
                                        )}
                                    >
                                        {isLoading ? "Processing..." : actionLabel}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

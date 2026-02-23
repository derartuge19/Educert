"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

// Configure axios to always send cookies
axios.defaults.withCredentials = true

interface User {
    id: number
    name: string
    email: string
    is_admin: boolean
}

interface LoginCredentials {
    name: string
    password: string
}

interface SignupData {
    name: string
    email: string
    password: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    signup: (userData: SignupData) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // On mount, check if there's an active session via the HttpOnly cookie
        const restoreSession = async () => {
            try {
                const res = await axios.get<User>("http://localhost:8000/api/me")
                setUser(res.data)
            } catch {
                // No valid cookie — user is not logged in
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        restoreSession()
    }, [])

    const login = async (formData: LoginCredentials) => {
        const params = new URLSearchParams()
        params.append("username", formData.name)
        params.append("password", formData.password)

        // Backend sets the HttpOnly cookie in the response
        const res = await axios.post<{ user: User }>("http://localhost:8000/api/login", params)
        setUser(res.data.user)
        window.location.href = "/"
    }

    const signup = async (userData: SignupData) => {
        try {
            await axios.post("http://localhost:8000/api/signup", userData)
        } catch (err: unknown) {
            console.error("Signup failed", err)
            throw err
        }
    }

    const logout = async () => {
        try {
            await axios.post("http://localhost:8000/api/logout")
        } catch { /* ignore */ }
        setUser(null)
        window.location.href = "/login"
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { SignInDialog } from "./sign-in-dialog"
import { ProfileDialog } from "./profile-dialog"

type LoginMethod = "google" | "anonymous"

export default function Component() {
  const [signInOpen, setSignInOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<LoginMethod | null>(null)

  const handleMethodSelect = (method: LoginMethod) => {
    setSelectedMethod(method)
    setSignInOpen(false)
    setProfileOpen(true)
  }

  const handleBackToSignIn = () => {
    setProfileOpen(false)
    setSignInOpen(true)
    setSelectedMethod(null)
  }

  const handleProfileComplete = (username: string, displayName: string) => {
    console.log("Login completed:")
    console.log("Method:", selectedMethod)
    console.log("Username:", username)
    console.log("Display Name:", displayName)

    // Close all dialogs
    setProfileOpen(false)
    setSelectedMethod(null)
  }

  const handleSignInClose = (open: boolean) => {
    setSignInOpen(open)
    if (!open) {
      setSelectedMethod(null)
    }
  }

  const handleProfileClose = (open: boolean) => {
    setProfileOpen(open)
    if (!open) {
      setSelectedMethod(null)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Button size="lg" className="gap-2" onClick={() => setSignInOpen(true)}>
        <LogIn className="h-4 w-4" />
        Login
      </Button>

      <SignInDialog open={signInOpen} onOpenChange={handleSignInClose} onMethodSelect={handleMethodSelect} />

      <ProfileDialog
        open={profileOpen}
        onOpenChange={handleProfileClose}
        loginMethod={selectedMethod}
        onBack={handleBackToSignIn}
        onComplete={handleProfileComplete}
      />
    </div>
  )
}

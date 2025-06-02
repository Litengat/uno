"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type LoginMethod = "google" | "anonymous"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loginMethod: LoginMethod | null
  onBack: () => void
  onComplete: (username: string, displayName: string) => void
}

// Mock existing usernames for validation
const existingUsernames = ["admin", "user", "test", "demo", "john", "jane", "alex"]

export function ProfileDialog({ open, onOpenChange, loginMethod, onBack, onComplete }: ProfileDialogProps) {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isUsernameValid, setIsUsernameValid] = useState(false)
  const [isDisplayNameManuallyEdited, setIsDisplayNameManuallyEdited] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setUsername("")
      setDisplayName("")
      setUsernameError("")
      setIsValidating(false)
      setIsUsernameValid(false)
      setIsDisplayNameManuallyEdited(false)
    }
  }, [open])

  // Simulate username validation with API call
  const validateUsername = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim()) {
      setUsernameError("")
      setIsUsernameValid(false)
      return
    }

    if (usernameToCheck.length < 3) {
      setUsernameError("Username must be at least 3 characters long")
      setIsUsernameValid(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameError("Username can only contain letters, numbers, and underscores")
      setIsUsernameValid(false)
      return
    }

    setIsValidating(true)
    setUsernameError("")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (existingUsernames.includes(usernameToCheck.toLowerCase())) {
      setUsernameError("This username is already taken")
      setIsUsernameValid(false)
    } else {
      setUsernameError("")
      setIsUsernameValid(true)
    }

    setIsValidating(false)
  }

  // Debounced username validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        validateUsername(username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  // Auto-sync display name with username unless manually edited
  useEffect(() => {
    if (!isDisplayNameManuallyEdited && username) {
      setDisplayName(username)
    }
  }, [username, isDisplayNameManuallyEdited])

  const handleComplete = () => {
    if (isUsernameValid && displayName.trim()) {
      onComplete(username, displayName)
    }
  }

  const isFormValid = isUsernameValid && displayName.trim() && !isValidating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-1 h-auto">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Complete your profile
          </DialogTitle>
          <DialogDescription>Choose a unique username and display name for your account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="Enter a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`pr-8 ${usernameError ? "border-red-500" : isUsernameValid ? "border-green-500" : ""}`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isValidating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                {!isValidating && usernameError && <AlertCircle className="h-4 w-4 text-red-500" />}
                {!isValidating && isUsernameValid && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
            {usernameError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{usernameError}</AlertDescription>
              </Alert>
            )}
            {isUsernameValid && <p className="text-sm text-green-600">✓ Username is available</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setIsDisplayNameManuallyEdited(true)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Auto-filled from username. You can change this if you prefer.
            </p>
          </div>

          <Button onClick={handleComplete} className="w-full" disabled={!isFormValid}>
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Complete sign-in"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { convertTempToRealUser } from "@/lib/temp-user"
import { supabase } from "@/lib/supabase/client"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tempUserId: string
  onSuccess?: () => void
  title?: string
  description?: string
}

export function SignupModal({ 
  open, 
  onOpenChange, 
  tempUserId,
  onSuccess,
  title = "Sign up to save your progress",
  description = "Create an account to save your test results, access leaderboards, and unlock video explanations."
}: SignupModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!email || !username || !password || !fullName) {
        setError("All fields are required")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        setIsLoading(false)
        return
      }

      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setError("Failed to create account")
        setIsLoading(false)
        return
      }

      const realUserId = authData.user.id

      // Step 2: Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: realUserId,
          email,
          username,
          name: fullName,
          role: 'STUDENT',
          school_id: null, // Will be set to default RealSAT school ID in the future
          gems_balance: 50, // Starting balance
          video_requests: [],
        })

      if (userError) {
        console.error('Error creating user record:', userError)
        setError("Failed to create user profile")
        setIsLoading(false)
        return
      }

      // Step 3: Convert temp user's test_results to real user
      console.log('Converting temp user:', tempUserId, 'to real user:', realUserId)
      const { success: conversionSuccess, error: conversionError } = await convertTempToRealUser(
        tempUserId,
        realUserId
      )

      if (!conversionSuccess) {
        console.error('Error converting temp user:', conversionError)
        // Don't block signup - account is created, results migration can be retried
      } else {
        console.log('Successfully converted temp user to real user')
      }

      // Step 4: Query users table to get the real user UUID
      console.log('[SIGNUP] Querying users table for email:', email)
      const { data: userData, error: userQueryError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (userQueryError || !userData) {
        console.error('[SIGNUP] Error fetching user from database:', userQueryError)
        setError('Account created but failed to fetch user data. Please try logging in.')
        setIsLoading(false)
        return
      }

      const realUserIdFromDb = userData.id
      console.log('[SIGNUP] ✅ Real user ID from database:', realUserIdFromDb)

      // Step 5: Update localStorage with real user ID
      const { setUserId } = await import('@/lib/temp-user')
      setUserId(realUserIdFromDb)
      console.log('[SIGNUP] ✅ localStorage updated with real user ID')

      // Success!
      setSuccess(true)

      // Step 6: Reload page to query with real user ID
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        window.location.reload()
      }, 1000)

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Account created successfully!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your progress has been saved. Redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creating account..." : "Create Account & Save Progress"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you'll get 50 free gems to unlock video explanations!
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

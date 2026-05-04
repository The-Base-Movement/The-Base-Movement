import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Shield, ArrowRight } from 'lucide-react'

import { authService } from '@/services/authService'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login(email, password)
      toast.success('Access Granted. Welcome to the Command Center.')
      navigate('/admin')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed. Please check your credentials.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Card className="border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[var(--brand-red)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-[var(--brand-red)]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--brand-black)] mb-1">Admin Login</h1>
              <p className="text-sm text-gray-500">Authorized personnel only</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="admin-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thebase.org"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--brand-black)] hover:bg-[#333] text-white font-semibold py-3"
              >
                {isLoading ? "Authenticating..." : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" /> Sign In
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-medium">Or authorized via</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await authService.signInWithGoogle()
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Google login failed')
                  }
                }}
                className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google Command Access
              </Button>
            </form>

            <div className="text-center mt-4 pt-4 border-t">
              <Link to="/login" className="text-sm text-gray-500 hover:text-[#006B3C] hover:underline">
                Member login instead?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

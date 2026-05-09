import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Shield, ArrowRight } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'

import { authService } from '@/services/authService'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

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
      <SEO 
        title="Admin Portal"
        noindex
      />
      <div className="max-w-md w-full">
        <Card className="border-border/40 shadow-2xl rounded-sm overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardContent className="p-10">
            <div className="text-center mb-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-sm flex items-center justify-center mb-4 rotate-3">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-on-surface mb-2 font-meta tracking-tight">Admin login</h1>
              <BrandLine className="mb-4" />
              <p className="text-micro text-muted-foreground/60 font-bold capitalize tracking-tight">Authorized personnel only</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-xs font-bold text-on-surface/80 capitalize tracking-tight">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thebase.org"
                  className="h-12 bg-muted/5 border-border/60 focus-visible:ring-on-surface rounded-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-xs font-bold text-on-surface/80 capitalize tracking-tight">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 bg-muted/5 border-border/60 focus-visible:ring-on-surface rounded-sm pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full h-14"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    Sign in to Command <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40"></span>
                </div>
                <div className="relative flex justify-center text-micro capitalize tracking-tight font-bold">
                  <span className="bg-white px-4 text-muted-foreground/40">Or authorized via</span>
                </div>
              </div>

              <Button
                type="button"
                variant="default"
                onClick={async () => {
                  try {
                    await authService.signInWithGoogle()
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Google login failed')
                  }
                }}
                className="w-full h-12 flex items-center justify-center gap-3"
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

            <div className="text-center mt-6 pt-6 border-t border-border/40">
              <Link to="/login" className="text-micro font-bold capitalize tracking-tight text-muted-foreground/60 hover:text-primary transition-colors">
                Member login instead?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

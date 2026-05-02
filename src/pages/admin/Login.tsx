import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Shield, ArrowRight } from 'lucide-react'

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false)

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

            <form className="space-y-4">
              <div>
                <Label htmlFor="admin-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@thebase.org"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
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
                className="w-full bg-[var(--brand-black)] hover:bg-[#333] text-white font-semibold py-3"
              >
                <ArrowRight className="w-4 h-4 mr-2" /> Sign In
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

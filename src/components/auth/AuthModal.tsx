"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction, registerAction } from "@/lib/actions/auth"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "login" | "register"
}

export function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const router = useRouter()
  const [tab, setTab] = useState(defaultTab)
  const [pending, setPending] = useState(false)

  const [loginPhone, setLoginPhone] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [registerData, setRegisterData] = useState({
    username: "",
    phone: "",
    password: "",
    gender: "Groom",
    gotraSelf: "",
    gotraMother: "",
    dob: "",
    district: "Bhopal",
    education: "",
    profession: "",
  })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const res = await loginAction(loginPhone, loginPassword)
    setPending(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success("Login successful!")
    onOpenChange(false)
    router.push("/dashboard")
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const res = await registerAction({
      ...registerData,
      profileType: registerData.gender === "Bride" ? "BRIDE" : "GROOM",
    })
    setPending(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success(res.message)
    setTab("login")
    setLoginPhone(registerData.phone)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Access Rajput Parivar</DialogTitle>
          <DialogDescription>Verifying family credentials for secure matching.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Join Parivar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-phone">Mobile Number</Label>
                <Input id="login-phone" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="Enter mobile number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter password" />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>{pending ? "Verifying..." : "Access My Dashboard"}</Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input id="reg-name" value={registerData.username} onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-gender">Gender</Label>
                  <select
                    id="reg-gender"
                    className="flex min-h-[52px] w-full rounded-2xl border-2 border-gold-hover bg-white px-4 text-base"
                    value={registerData.gender}
                    onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                  >
                    <option value="Groom">Groom (Male)</option>
                    <option value="Bride">Bride (Female)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-gotra-self">Gotra (Self)</Label>
                  <Input id="reg-gotra-self" value={registerData.gotraSelf} onChange={(e) => setRegisterData({ ...registerData, gotraSelf: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-gotra-mother">Gotra (Mother)</Label>
                  <Input id="reg-gotra-mother" value={registerData.gotraMother} onChange={(e) => setRegisterData({ ...registerData, gotraMother: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-dob">Date of Birth</Label>
                  <Input id="reg-dob" type="date" value={registerData.dob} onChange={(e) => setRegisterData({ ...registerData, dob: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-district">District</Label>
                  <select
                    id="reg-district"
                    className="flex min-h-[52px] w-full rounded-2xl border-2 border-gold-hover bg-white px-4 text-base"
                    value={registerData.district}
                    onChange={(e) => setRegisterData({ ...registerData, district: e.target.value })}
                  >
                    <option>Bhopal</option>
                    <option>Sehore</option>
                    <option>Rajgarh</option>
                    <option>Indore</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-education">Education</Label>
                  <Input id="reg-education" value={registerData.education} onChange={(e) => setRegisterData({ ...registerData, education: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-profession">Profession</Label>
                  <Input id="reg-profession" value={registerData.profession} onChange={(e) => setRegisterData({ ...registerData, profession: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Mobile Number</Label>
                  <Input id="reg-phone" value={registerData.phone} onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Set Password</Label>
                  <Input id="reg-password" type="password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating..." : "Register Matrimonial Profile"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

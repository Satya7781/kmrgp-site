"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Users, Shield, CheckCircle, Scroll, UserPlus, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getSuperAdminStatsAction,
  listAdminsAction,
  createAdminAction,
  demoteAdminAction,
} from "@/lib/actions/superAdmin"
import type { SuperAdminStats, User } from "@/types"

export function SuperAdminPanel() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null)
  const [admins, setAdmins] = useState<User[]>([])
  const [logs, setLogs] = useState<Array<{ id: number; adminId: number | null; actionType: string; targetUserId: number | null; timestamp: Date }>>([])
  const [form, setForm] = useState({ name: "", phone: "", password: "" })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [sRes, aRes] = await Promise.all([getSuperAdminStatsAction(), listAdminsAction()])
    setLoading(false)
    if (sRes.success && sRes.stats) {
      setStats(sRes.stats)
    }
    if (aRes.success) setAdmins(aRes.admins as User[])
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await createAdminAction(form.name, form.phone, form.password)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success("Admin created")
    setForm({ name: "", phone: "", password: "" })
    load()
  }

  async function demote(id: number) {
    if (!confirm("Demote this admin to USER?")) return
    const res = await demoteAdminAction(id)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success("Admin demoted")
    load()
  }

  if (loading || !stats) return <div className="text-center">Loading super admin data...</div>

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} value={stats.totalUsers} label="Total Users" />
        <StatCard icon={Shield} value={stats.totalAdmins} label="Total Admins" />
        <StatCard icon={CheckCircle} value={stats.approvedUsers} label="Approved Profiles" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-maroon">
            <UserPlus className="h-5 w-5 text-maroon" /> Create Admin Account
          </h3>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label>Admin Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kunwar Vikram Singh" />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter 10-digit number" />
            </div>
            <div className="space-y-2">
              <Label>Set Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <Button type="submit" className="w-full">Create Admin</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-maroon">
            <ShieldAlert className="h-5 w-5 text-saffron" /> Manage Admin Accounts
          </h3>
          {admins.length === 0 ? (
            <p className="text-muted-foreground">No administrators registered.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Demote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold">{a.username}</TableCell>
                    <TableCell>{a.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => demote(a.id)}>Demote</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-maroon">
          <Scroll className="h-5 w-5 text-gold" /> Administrative Audit Logs
        </h3>
        {logs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No action logs available in this view.</Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.adminId}</TableCell>
                  <TableCell className="font-bold">{l.actionType}</TableCell>
                  <TableCell>{l.targetUserId}</TableCell>
                  <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-light text-maroon">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="font-heading text-2xl font-bold text-maroon">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  )
}

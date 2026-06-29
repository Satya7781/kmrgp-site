"use client"

import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Save, Printer, Camera, ShieldCheck, Clock, AlertTriangle, Edit, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { updateMyProfile, requestApprovalAction } from "@/lib/actions/profile"
import type { PublicProfile, Role } from "@/types"

interface BioDataEditorProps {
  profile: PublicProfile
  role: Role
}

export function BioDataEditor({ profile, role }: BioDataEditorProps) {
  const [form, setForm] = useState({
    username: profile.username || "",
    dob: profile.dob || "",
    height: profile.height || "5'10\"",
    type: profile.type,
    district: profile.district || "Bhopal",
    gotraSelf: profile.gotraSelf || "",
    gotraMother: profile.gotraMother || "",
    education: profile.education || "",
    profession: profile.profession || "",
    address: profile.address || "",
    contact: profile.contact || "",
  })

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
  const locked = (profile.approvalStatus === "APPROVED" || profile.approvalStatus === "PENDING") && !isAdmin

  function formatDob(dob: string) {
    if (!dob || dob === "-") return "-"
    const d = new Date(dob)
    if (isNaN(d.getTime())) return dob
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  }

  async function handleSave() {
    const res = await updateMyProfile(form)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success("Profile saved successfully!")
  }

  async function handleRequestApproval() {
    const res = await requestApprovalAction()
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success("Profile submitted for verification.")
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = new FormData()
    data.append("file", file)
    const res = await fetch("/api/profile/upload", { method: "POST", body: data })
    const json = await res.json()
    if (!json.success) {
      toast.error(json.error || "Upload failed")
      return
    }
    toast.success("Photo uploaded")
  }

  let statusConfig = {
    icon: Info,
    color: "text-gold",
    bg: "bg-white border-gold-light",
    text: "Profile Draft (Submit for Admin Verification)",
    showButton: true,
  }

  if (isAdmin) {
    statusConfig = {
      icon: ShieldCheck,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      text: "Administrator Account (Profile Settings Active)",
      showButton: false,
    }
  } else if (profile.approvalStatus === "APPROVED") {
    statusConfig = {
      icon: ShieldCheck,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      text: "Profile Verified & Active (Details Locked)",
      showButton: false,
    }
  } else if (profile.approvalStatus === "PENDING") {
    statusConfig = {
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
      text: "Verification Pending (Awaiting Admin Review)",
      showButton: false,
    }
  } else if (profile.approvalStatus === "REJECTED") {
    statusConfig = {
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      text: "Profile Rejected (Please correct details & re-submit)",
      showButton: true,
    }
  }

  const StatusIcon = statusConfig.icon

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h2 className="mb-2 font-heading text-2xl font-bold text-maroon">Edit Profile Details</h2>

        <div className={`mb-6 flex items-center justify-between gap-4 rounded-xl border p-4 ${statusConfig.bg}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            <span className={`font-bold ${statusConfig.color}`}>{statusConfig.text}</span>
          </div>
          {statusConfig.showButton && (
            <Button size="sm" onClick={handleRequestApproval}>Submit for Verification</Button>
          )}
        </div>

        <div className="mb-6">
          <Label className="mb-2">Profile Photo</Label>
          <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gold bg-cream-dark p-4 transition ${locked ? "pointer-events-none opacity-60" : "hover:bg-cream"}`}>
            <Camera className="h-6 w-6 text-gold" />
            <span className="font-semibold text-muted-foreground">Change Profile Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={locked} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name" value={form.username} onChange={(v) => setForm({ ...form, username: v })} disabled={locked} />
          <Field label="Gender">
            <select className="input-style" value={form.type} disabled={locked} onChange={(e) => setForm({ ...form, type: e.target.value as any })} >
              <option value="GROOM">Groom</option>
              <option value="BRIDE">Bride</option>
            </select>
          </Field>
          <Field label="Date of Birth" value={form.dob} onChange={(v) => setForm({ ...form, dob: v })} disabled={locked} type="date" />
          <Field label="Height" value={form.height} onChange={(v) => setForm({ ...form, height: v })} disabled={locked} />
          <Field label="Gotra (Self)" value={form.gotraSelf} onChange={(v) => setForm({ ...form, gotraSelf: v })} disabled={locked} />
          <Field label="Gotra (Mother)" value={form.gotraMother} onChange={(v) => setForm({ ...form, gotraMother: v })} disabled={locked} />
          <Field label="Education" value={form.education} onChange={(v) => setForm({ ...form, education: v })} disabled={locked} />
          <Field label="Profession" value={form.profession} onChange={(v) => setForm({ ...form, profession: v })} disabled={locked} />
          <Field label="District" value={form.district} onChange={(v) => setForm({ ...form, district: v })} disabled={locked} />
          <Field label="Contact" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} disabled={locked} />
          <div className="md:col-span-2">
            <Field label="Address / Native Place" value={form.address} onChange={(v) => setForm({ ...form, address: v })} disabled={locked} />
          </div>
        </div>

        {!locked && (
          <Button className="mt-6 w-full" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-maroon">Bio-Data Preview</h2>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>

        <div id="biodata-card" className="rounded-2xl border-8 border-double border-maroon bg-cream p-6 md:p-8">
          <div className="text-center">
            <div className="mb-2 text-lg font-bold text-maroon">॥ श्री गणेशाय नमः ॥</div>
            <div className="font-heading text-2xl font-bold text-maroon">Matrimonial Bio-Data</div>
            <div className="text-gold">Kshatriya Mewada Rajput</div>
          </div>

          <div className="mx-auto my-6 flex justify-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gold">
              <Image
                src={profile.imageUrl || `/images/${profile.username?.split(" ")[0].toLowerCase()}.jpeg`}
                alt={profile.username || ""}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <tbody className="divide-y divide-gold-light">
              <PreviewRow label="Name" value={form.username} />
              <PreviewRow label="Birth Date" value={formatDob(form.dob)} />
              <PreviewRow label="Height" value={form.height} />
              <PreviewRow label="Gender" value={form.type} />
              <PreviewRow label="District" value={form.district} />
              <PreviewRow label="Self Gotra" value={form.gotraSelf} />
              <PreviewRow label="Mother Gotra" value={form.gotraMother} />
              <PreviewRow label="Education" value={form.education} />
              <PreviewRow label="Profession" value={form.profession} />
              <PreviewRow label="Native Place" value={form.address} />
              <PreviewRow label="Contact" value={form.contact} />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  children,
}: {
  label: string
  value?: string
  onChange?: (v: string) => void
  disabled?: boolean
  type?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children || (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string | null }) {
  return (
    <tr>
      <td className="py-2 font-semibold text-maroon">{label}</td>
      <td className="py-2 text-right">{value || "-"}</td>
    </tr>
  )
}

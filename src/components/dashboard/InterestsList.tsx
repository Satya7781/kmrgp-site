"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Heart, CheckCircle2, X, HeartOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getMyInterestsAction, acceptInterestAction, declineInterestAction } from "@/lib/actions/interest"

interface InterestItem {
  id: number
  senderId: number
  senderName: string | null
  senderImage: string | null
  senderType: string
  age: number | null
  gotraSelf: string | null
  gotraMother: string | null
  district: string | null
  status: string
}

export function InterestsList() {
  const [interests, setInterests] = useState<InterestItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await getMyInterestsAction()
    setLoading(false)
    if (res.success) {
      setInterests(res.interests as InterestItem[])
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function accept(id: number) {
    const res = await acceptInterestAction(id)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success("Interest accepted")
    load()
  }

  async function decline(id: number) {
    const res = await declineInterestAction(id)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.info("Interest declined")
    load()
  }

  if (loading) return <div className="text-center text-muted-foreground">Loading interests...</div>

  if (interests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <HeartOff className="mx-auto mb-3 h-10 w-10 text-gold" />
        <p className="font-semibold text-muted-foreground">No pending interests received.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {interests.map((item) => (
        <Card key={item.id} className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-gold">
              {item.senderImage ? (
                <img src={item.senderImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-maroon text-white">{item.senderName?.[0]}</div>
              )}
            </div>
            <div>
              <div className="font-heading text-lg font-bold text-maroon">{item.senderName}</div>
              <div className="text-sm text-muted-foreground">
                {item.age} yrs · Gotra: {item.gotraSelf} (Mother: {item.gotraMother}) · Dist: {item.district}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {item.status === "PENDING" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => decline(item.id)}>
                  <X className="mr-1 h-4 w-4" /> Decline
                </Button>
                <Button size="sm" onClick={() => accept(item.id)}>
                  <Heart className="mr-1 h-4 w-4" /> Accept
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                <CheckCircle2 className="mr-1 h-4 w-4" /> {item.status}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

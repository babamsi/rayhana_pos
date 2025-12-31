"use client"

import { MapPin, Clock, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface LocationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLocationChange?: (location: string) => void
}

const locations = [
  {
    id: "kilimani",
    name: "Kilimani",
    address: "Shujaa Mall, Kilimani",
    hours: "10am - 10pm",
  },
  {
    id: "parklands",
    name: "Parklands",
    address: "Limuru Road, Parklands",
    hours: "10am - 10pm",
  },
  {
    id: "southc",
    name: "South C",
    address: "Muhoho Avenue, South C",
    hours: "10am - 10pm",
  },
]

export function LocationSheet({ open, onOpenChange, onLocationChange }: LocationSheetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState("kilimani")

  useEffect(() => {
    const locationParam = searchParams.get("location")
    if (locationParam && locations.some((l) => l.id === locationParam)) {
      setSelected(locationParam)
    }
  }, [searchParams])

  const handleSelect = (id: string) => {
    setSelected(id)

    // Update URL with new location
    const params = new URLSearchParams(searchParams.toString())
    params.set("location", id)
    router.replace(`/order?${params.toString()}`, { scroll: false })

    if (onLocationChange) {
      onLocationChange(id)
    }

    setTimeout(() => onOpenChange(false), 200)
  }

  const selectedLocation = locations.find((l) => l.id === selected)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="text-left text-base">Pickup Location</SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                selected === loc.id
                  ? "bg-secondary/50 border border-transparent"
                  : "bg-primary/10 border border-primary/30"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selected === loc.id ? "bg-primary" : "bg-secondary"
                }`}
              >
                {selected === loc.id ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{loc.name}</h3>
                <p className="text-xs text-muted-foreground">{loc.address}</p>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {loc.hours}
                </span>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function getLocationName(id: string): string {
  const loc = locations.find((l) => l.id === id)
  return loc ? loc.name : "Kilimani"
}

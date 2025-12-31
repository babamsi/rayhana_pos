"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin } from "lucide-react"

interface WhatsappBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const branches = [
  {
    id: "kilimani",
    name: "Kilimani",
    address: "Shujaa Mall",
    whatsappUrl: "https://api.whatsapp.com/send/?phone=%2B254769723159&text&type=phone_number&app_absent=0",
  },
  {
    id: "parklands",
    name: "Parklands",
    address: "Limuru Road",
    whatsappUrl: "https://api.whatsapp.com/send/?phone=%2B254799025071&text&type=phone_number&app_absent=0",
  },
  {
    id: "southc",
    name: "South C",
    address: "Muhoho Avenue",
    whatsappUrl: "https://api.whatsapp.com/send/?phone=%2B254723555569&text&type=phone_number&app_absent=0",
  },
]

export function WhatsappBranchDialog({ open, onOpenChange }: WhatsappBranchDialogProps) {
  const handleSelect = (url: string) => {
    window.open(url, "_blank")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/logos/whatsapp.avif" alt="WhatsApp" className="w-6 h-6" />
            <span>Select Branch</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSelect(branch.whatsappUrl)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-primary/10 border border-transparent hover:border-primary/30 bg-muted"
            >
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{branch.name}</h3>
                <p className="text-xs text-muted-foreground">{branch.address}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

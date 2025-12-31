import { LogoSpinner } from "@/components/logo-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LogoSpinner size="lg" text="LOADING" />
    </div>
  )
}

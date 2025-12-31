"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { X, Plus, Trash2, Edit2, Check, Copy, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReceiptManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ReceiptItem {
  id: string
  name: string
  price: number
  category: string
  description?: string
}

export function ReceiptManagementSheet({ open, onOpenChange }: ReceiptManagementSheetProps) {
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ReceiptItem[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "breakfast",
    description: "",
  })

  useEffect(() => {
    if (open) {
      const storedItems = JSON.parse(localStorage.getItem("menuItems") || "[]")
      setItems(storedItems)
    }
  }, [open])

  useEffect(() => {
    let filtered = items

    if (filterCategory !== "all") {
      filtered = filtered.filter((item) => item.category === filterCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, filterCategory])

  const saveItems = (newItems: ReceiptItem[]) => {
    localStorage.setItem("menuItems", JSON.stringify(newItems))
    setItems(newItems)
    window.dispatchEvent(new Event("menuItemsUpdated"))

    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const handleAddItem = () => {
    if (!formData.name || !formData.price) return

    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      name: formData.name,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      description: formData.description || undefined,
    }

    saveItems([...items, newItem])
    setFormData({ name: "", price: "", category: "breakfast", description: "" })
    setIsAdding(false)
  }

  const handleUpdateItem = () => {
    if (!formData.name || !formData.price || !editingId) return

    const updatedItems = items.map((item) =>
      item.id === editingId
        ? {
            ...item,
            name: formData.name,
            price: Number.parseFloat(formData.price),
            category: formData.category,
            description: formData.description || undefined,
          }
        : item,
    )

    saveItems(updatedItems)
    setFormData({ name: "", price: "", category: "breakfast", description: "" })
    setEditingId(null)
  }

  const handleDeleteItem = (id: string) => {
    if (confirm("Delete this item?")) {
      saveItems(items.filter((item) => item.id !== id))
    }
  }

  const handleDuplicateItem = (item: ReceiptItem) => {
    setFormData({
      name: `${item.name} (Copy)`,
      price: item.price.toString(),
      category: item.category,
      description: item.description || "",
    })
    setIsAdding(true)
    setEditingId(null)
  }

  const startEdit = (item: ReceiptItem) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || "",
    })
    setEditingId(item.id)
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setFormData({ name: "", price: "", category: "breakfast", description: "" })
    setEditingId(null)
    setIsAdding(false)
  }

  const itemsByCategory = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, ReceiptItem[]>,
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] rounded-t-3xl p-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-br from-card to-card/50 flex-shrink-0">
          <div>
            <h2 className="font-bold text-xl tracking-tight">Menu Management</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{items.length} total items</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-background hover:bg-muted transition-all active:scale-95 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-border bg-background/50 flex-shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-card border-2 border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {["all", "breakfast", "lunch", "desserts"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilterCategory(cat)
                  if (navigator.vibrate) navigator.vibrate(10)
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 shadow-sm ${
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card text-foreground border-2 border-border hover:border-primary/30"
                }`}
              >
                {cat === "all" ? "All Items" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {filteredItems.length === 0 && !isAdding && !editingId && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 shadow-inner">
                <span className="text-5xl">🍽️</span>
              </div>
              <p className="text-base font-bold text-foreground mb-2">
                {searchQuery ? "No items found" : "No menu items yet"}
              </p>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                {searchQuery ? "Try a different search term" : "Add your first item to get started with your menu"}
              </p>
            </div>
          )}

          {Object.keys(itemsByCategory).length > 0 && (
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{category}</h3>
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                      {categoryItems.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <div key={item.id}>
                        {editingId === item.id ? (
                          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-5 border-2 border-primary/40 space-y-4 shadow-lg">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-base flex items-center gap-2">
                                <Edit2 className="w-4 h-4" />
                                Edit Item
                              </h3>
                              <button
                                onClick={cancelEdit}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background/80 transition-all active:scale-90"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                                  Item Name*
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Chicken Sandwich"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-medium transition-all"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                                    Price (KES)*
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-bold transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                                    Category*
                                  </label>
                                  <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                  >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="desserts">Desserts</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                                  Description (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Small size, Large size"
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                />
                              </div>

                              <Button
                                onClick={handleUpdateItem}
                                disabled={!formData.name || !formData.price}
                                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="w-5 h-5 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-card rounded-xl p-4 border-2 border-border hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.99] group">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base leading-tight mb-1">{item.name}</h4>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                )}
                                <span className="inline-block text-base font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                                  KES {item.price.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleDuplicateItem(item)}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90 border border-transparent hover:border-primary/20"
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4 text-primary" />
                                </button>
                                <button
                                  onClick={() => startEdit(item)}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90 border border-transparent hover:border-primary/20"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4 text-primary" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-all active:scale-90 border border-transparent hover:border-destructive/20"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdding && (
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-5 border-2 border-primary/40 space-y-4 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Item
                </h3>
                <button
                  onClick={cancelEdit}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background/80 transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                    Item Name*
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chicken Sandwich"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                      Price (KES)*
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                      Category*
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="desserts">Desserts</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Small size, Large size"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>

                <Button
                  onClick={handleAddItem}
                  disabled={!formData.name || !formData.price}
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isAdding && !editingId && (
          <div className="border-t-2 border-border p-6 bg-gradient-to-t from-card to-background flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <Button
              onClick={() => {
                setIsAdding(true)
                setEditingId(null)
                if (navigator.vibrate) navigator.vibrate(10)
              }}
              className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Item
            </Button>
          </div>
        )}
      </SheetContent> */}
    </Sheet>
  )
}

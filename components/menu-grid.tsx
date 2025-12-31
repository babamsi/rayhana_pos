"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { Search } from "lucide-react"

const categories = [
  { id: "all", name: "All" },
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "desserts", name: "Desserts" },
]

const defaultProducts = [
  // DESSERTS
  {
    id: "d1",
    name: "Cinnamon roll",
    description: "",
    price: 250,
    category: "desserts",
  },
  {
    id: "d2",
    name: "Honey comb",
    description: "Per piece",
    price: 40,
    category: "desserts",
  },
  {
    id: "d3",
    name: "Basbusa",
    description: "",
    price: 150,
    category: "desserts",
  },
  {
    id: "d4",
    name: "Chocolate cake",
    description: "Per piece",
    price: 400,
    category: "desserts",
  },
  {
    id: "d5",
    name: "Fruit cake",
    description: "Per piece",
    price: 400,
    category: "desserts",
  },
  {
    id: "d6",
    name: "Turkish milk cake",
    description: "Per piece",
    price: 400,
    category: "desserts",
  },
  {
    id: "d7",
    name: "Brownies",
    description: "",
    price: 500,
    category: "desserts",
  },
  {
    id: "d8",
    name: "Coconut cake",
    description: "Per piece",
    price: 250,
    category: "desserts",
  },
  {
    id: "d9",
    name: "Date cheese cake",
    description: "",
    price: 400,
    category: "desserts",
  },
  {
    id: "d10",
    name: "Tiramisu",
    description: "",
    price: 500,
    category: "desserts",
  },
  // BREAKFAST
  {
    id:"b8",
    name: "Water",
    description: "",
    category: "breakfast",
    price: 50
  },
  {
    id: "b1",
    name: "Kahawa",
    description: "Per cup",
    price: 50,
    category: "breakfast",
  },
  {
    id: "b2",
    name: "Full Breakfast Package",
    description: "",
    price: 1300,
    category: "breakfast",
  },
  {
    id: "b3",
    name: "Beans",
    description: "Served with 2 pieces of bread",
    price: 400,
    category: "breakfast",
  },
  {
    id: "b4",
    name: "Pancakes (Pair)",
    description: "2 pieces",
    price: 100,
    category: "breakfast",
  },
  {
    id: "b5",
    name: "Pancake (Single)",
    description: "1 piece",
    price: 70,
    category: "breakfast",
  },
  {
    id: "b6",
    name: "Chicken Sandwich",
    description: "",
    price: 300,
    category: "breakfast",
  },
  {
    id: "b7",
    name: "Egg Sandwich",
    description: "",
    price: 200,
    category: "breakfast",
  },
  // LUNCH
  {
    id: "l1",
    name: "Shawarma",
    description: "Medium size",
    price: 400,
    category: "lunch",
  },
  {
    id: "l2",
    name: "Shawarma",
    description: "Large size",
    price: 800,
    category: "lunch",
  },
  {
    id: "l3",
    name: "Stuffed grape leaves",
    description: "Each",
    price: 150,
    category: "lunch",
  },
  {
    id: "l4",
    name: "Chicken Meal",
    description: "Chicken + Rice + Vegetables",
    price: 1000,
    category: "lunch",
  },
  {
    id: "l5",
    name: "Lamb Meal",
    description: "Lamb + Rice + Vegetables",
    price: 1200,
    category: "lunch",
  },
  {
    id: "l6",
    name: "Lasagna",
    description: "",
    price: 1000,
    category: "lunch",
  },
  {
    id: "l7",
    name: "Pasta Alfredo",
    description: "",
    price: 1300,
    category: "lunch",
  },
  {
    id: "l8",
    name: "Pasta Saldata",
    description: "",
    price: 800,
    category: "lunch",
  },
  {
    id: "l9",
    name: "Chicken Curry",
    description: "Served with Naan or Rice",
    price: 1100,
    category: "lunch",
  },
]

export function MenuGrid() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  const [activeCategory, setActiveCategory] = useState(categoryParam || "all")
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState(defaultProducts)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    localStorage.setItem("menuItems", JSON.stringify(defaultProducts))
    setProducts(defaultProducts)
  }, [])

  useEffect(() => {
    const storedItems = localStorage.getItem("menuItems")
    if (!storedItems) {
      localStorage.setItem("menuItems", JSON.stringify(defaultProducts))
      setProducts(defaultProducts)
    } else {
      const parsedItems = JSON.parse(storedItems)
      if (parsedItems.length === 0) {
        localStorage.setItem("menuItems", JSON.stringify(defaultProducts))
        setProducts(defaultProducts)
      } else {
        setProducts(parsedItems)
      }
    }
  }, [])

  useEffect(() => {
    const handleMenuUpdate = () => {
      const storedItems = localStorage.getItem("menuItems")
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems)
        setProducts(parsedItems.length > 0 ? parsedItems : defaultProducts)
      }
    }

    window.addEventListener("menuItemsUpdated", handleMenuUpdate)
    return () => window.removeEventListener("menuItemsUpdated", handleMenuUpdate)
  }, [])

  useEffect(() => {
    if (categoryParam && categories.some((c) => c.id === categoryParam)) {
      setActiveCategory(categoryParam)
    }
  }, [categoryParam])

  const handleCategoryClick = (categoryId: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }

    if (categoryId === "all") {
      setActiveCategory("all")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (activeCategory === "all" && !searchQuery) {
      const sectionElement = sectionRefs.current[categoryId]
      if (sectionElement) {
        const headerOffset = 110
        const elementPosition = sectionElement.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }
    } else {
      setActiveCategory(categoryId)
    }
  }

  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const groupedProducts = () => {
    if (activeCategory !== "all" || searchQuery) {
      return null
    }

    const groups: { [key: string]: typeof products } = {}
    categories.slice(1).forEach((cat) => {
      const items = products.filter((p) => p.category === cat.id)
      if (items.length > 0) {
        groups[cat.id] = items
      }
    })
    return groups
  }

  const groups = groupedProducts()

  return (
    <section className="pb-32">
      <div className="px-4 pb-px pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="sticky top-[49px] z-30 bg-background border-b border-border">
        <div className="overflow-x-auto no-scrollbar py-0 my-0 border-t-[-px] border-t-0">
          <div className="flex min-w-max text-center my-0.5 py-3 mt-3.5 gap-6 flex-row items-center mb-0 px-4 justify-start">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`pb-1 text-sm tracking-wide transition-all relative whitespace-nowrap active:scale-95 ${
                  activeCategory === cat.id
                    ? "text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
                {activeCategory === cat.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-0">
        {groups ? (
          Object.entries(groups).map(([categoryId, items]) => {
            const categoryName = categories.find((c) => c.id === categoryId)?.name || categoryId
            return (
              <div
                key={categoryId}
                className="pt-6"
                ref={(el) => {
                  sectionRefs.current[categoryId] = el
                }}
                id={`section-${categoryId}`}
              >
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground mb-4 pb-2 border-b border-border">
                  {categoryName}
                </h2>
                <div>
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && !groups && (
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground text-sm">No items found</p>
        </div>
      )}
    </section>
  )
}

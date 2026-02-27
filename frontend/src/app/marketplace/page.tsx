"use client";

import { useState } from "react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { CheckoutModal } from "@/components/marketplace/CheckoutModal";
import { mockProducts } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

type Product = (typeof mockProducts)[0];

const categories = ["All", "Digital Goods", "DeFi Positions", "NFTs"];

export default function MarketplacePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? mockProducts
      : mockProducts.filter((p) => p.category === activeCategory);

  const handleBuyNow = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">BNPL Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buy now, pay later with your CredScore. Zero-interest for Platinum members.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product, i) => (
          <div
            key={product.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <ProductCard product={product} onBuyNow={handleBuyNow} />
          </div>
        ))}
      </div>

      {/* Checkout modal */}
      <CheckoutModal
        product={selectedProduct}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  seller: string;
}

interface ProductCardProps {
  product: Product;
  onBuyNow: (product: Product) => void;
}

const categoryColors: Record<string, string> = {
  "Digital Goods": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "DeFi Positions": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "NFTs": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function ProductCard({ product, onBuyNow }: ProductCardProps) {
  return (
    <Card className="bg-card/50 border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden">
      <CardContent className="p-0">
        {/* Product image area */}
        <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-secondary/80 to-secondary/30 border-b border-border">
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
            {product.image}
          </span>
          <Badge
            variant="outline"
            className={`absolute top-3 left-3 text-[10px] ${categoryColors[product.category] || ""}`}
          >
            {product.category}
          </Badge>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">{product.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">${product.price}</p>
              <p className="text-[10px] text-muted-foreground">
                or ~${Math.round(product.price / 3)}/mo with Kred
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onBuyNow(product)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0"
            >
              <ShoppingCart className="h-3 w-3 mr-1.5" />
              Pay in 3
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Sold by {product.seller}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

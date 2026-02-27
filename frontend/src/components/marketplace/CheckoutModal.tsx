"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getTier, TIERS, mockCreditProfile } from "@/lib/mock-data";
import { Shield, Calendar, ArrowRight, Check, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  seller: string;
}

interface CheckoutModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function CheckoutModal({ product, open, onClose }: CheckoutModalProps) {
  if (!product) return null;

  const score = mockCreditProfile.score;
  const tier = getTier(score);
  const tierInfo = TIERS[tier];
  const collateralPct = parseFloat(tierInfo.collateral) / 100;
  const collateralAmount = product.price * collateralPct;
  const installment = Math.round((product.price / 3) * 100) / 100;
  const interestRate = parseFloat(tierInfo.rate) / 100;
  const totalInterest = Math.round(product.price * interestRate * 100) / 100;
  const totalCost = product.price + totalInterest;

  const today = new Date();
  const installments = [
    { label: "Today", amount: installment, date: today.toLocaleDateString(), status: "due" },
    { label: "Month 2", amount: installment, date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: "upcoming" },
    { label: "Month 3", amount: Math.round((product.price - installment * 2) * 100) / 100, date: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: "upcoming" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Pay in 3 with Kred
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Product summary */}
          <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-3">
            <span className="text-3xl">{product.image}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.seller}</p>
            </div>
            <p className="text-lg font-bold">${product.price}</p>
          </div>

          {/* Credit tier info */}
          <div className={cn(
            "flex items-center justify-between rounded-lg border p-3",
            tierInfo.bg, tierInfo.border,
          )}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: tierInfo.color }} />
              <span className={cn("text-sm font-medium", tierInfo.text)}>
                {tierInfo.name} Tier
              </span>
              <Badge variant="outline" className="text-[10px]">Score: {score}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {tierInfo.collateral} collateral
            </span>
          </div>

          <Separator />

          {/* Installment schedule */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Payment Schedule
            </p>
            <div className="space-y-2">
              {installments.map((inst, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    inst.status === "due"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {inst.status === "due" ? <ArrowRight className="h-3 w-3" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{inst.label}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {inst.date}
                    </p>
                  </div>
                  <p className="text-sm font-bold">${inst.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Collateral info */}
          <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Collateral Required
              </span>
              <span className="font-semibold">${collateralAmount.toFixed(2)} USDT</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interest ({tierInfo.rate})</span>
              <span className="font-semibold">${totalInterest.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-bold text-foreground">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1">
              <Check className="h-3 w-3" />
              Collateral earns ~5% APY on Venus Protocol while locked
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0">
              <Shield className="h-4 w-4 mr-2" />
              Approve & Pay
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            By clicking Approve & Pay, you authorize Kred to debit your wallet for
            the first installment and lock your collateral in the Smart Collateral Vault.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
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
import { bnplCheckout } from "@/lib/api";
import { useDemoMode } from "@/lib/demo-mode";
import { useAccount } from "wagmi";
import { Shield, Calendar, ArrowRight, Check, Sparkles, Lock, Loader2, CheckCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVenus } from "@/hooks/useVenus";

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
  const { isDemoMode } = useDemoMode();
  const { address } = useAccount();
  const { data: venusData } = useVenus();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleApprove = async () => {
    if (isDemoMode) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setSuccess(true);
      setLoading(false);
      return;
    }

    const buyerAddress = address || "0xDemoUser";
    setLoading(true);
    setError(null);
    try {
      // Use a default merchant address for demo — seller field is a display name, not a wallet
      const merchantAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
      await bnplCheckout(buyerAddress, merchantAddress, product.price, product.name);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold">Purchase Successful!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Your BNPL order for <strong>{product.name}</strong> has been placed.
              First installment of ${installment.toFixed(2)} has been charged.
            </p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              <Zap className="h-3 w-3 text-yellow-400" />
              Collateral earns {venusData?.supplyAPY?.toFixed(2) ?? "~5"}% APY on Venus Protocol while locked
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Approve & Pay
                </>
              )}
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

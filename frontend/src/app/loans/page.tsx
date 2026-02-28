"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { mockLoans, mockPaymentHistory } from "@/lib/mock-data";
import { fetchLoans, repayLoan, Loan } from "@/lib/api";
import { useDemoMode } from "@/lib/demo-mode";
import { useAccount } from "wagmi";
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Sprout,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { VenusYieldCard } from "@/components/venus/VenusYieldCard";

export default function LoansPage() {
  const { isDemoMode } = useDemoMode();
  const { address } = useAccount();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repaying, setRepaying] = useState<number | null>(null);

  const loadLoans = useCallback(async () => {
    if (isDemoMode) {
      setLoans(mockLoans as Loan[]);
      setLoading(false);
      return;
    }

    if (!address) {
      setLoans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchLoans(address);
      setLoans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load loans");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, address]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleRepay = async (loan: Loan) => {
    if (isDemoMode) {
      setRepaying(loan.id);
      await new Promise((r) => setTimeout(r, 1500));
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loan.id
            ? {
                ...l,
                installmentsPaid: l.installmentsPaid + 1,
                remainingAmount: Math.max(0, l.remainingAmount - l.installmentAmount),
                active: l.installmentsPaid + 1 < l.totalInstallments,
              }
            : l
        )
      );
      setRepaying(null);
      return;
    }

    setRepaying(loan.id);
    try {
      await repayLoan(address || "", loan.id, loan.installmentAmount);
      await loadLoans();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Repayment failed");
    } finally {
      setRepaying(null);
    }
  };

  const paymentHistory = isDemoMode ? mockPaymentHistory : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading your loans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Loan Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track active loans, repayments, and collateral yield
        </p>
      </div>

      {error && (
        <Card className="bg-rose-950/20 border-rose-500/30">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{error}</p>
            <Button variant="outline" size="sm" className="ml-auto border-rose-500/30 text-rose-400" onClick={loadLoans}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!address && !isDemoMode && (
        <Card className="bg-secondary/30 border-border">
          <CardContent className="py-12 flex flex-col items-center">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Connect your wallet to view loans</p>
            <p className="text-xs text-muted-foreground mt-1">Or enable Demo Mode to see sample data</p>
          </CardContent>
        </Card>
      )}

      {loans.length === 0 && (address || isDemoMode) && !error && (
        <Card className="bg-secondary/30 border-border">
          <CardContent className="py-12 flex flex-col items-center">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No active loans</p>
            <p className="text-xs text-muted-foreground mt-1">Browse the marketplace to get started with BNPL</p>
          </CardContent>
        </Card>
      )}

      {loans.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Active Loans</span>
                </div>
                <p className="text-2xl font-bold mt-1">{loans.filter(l => l.active).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Total Remaining</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  ${loans.reduce((s, l) => s + l.remainingAmount, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs">Total Collateral</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  ${loans.reduce((s, l) => s + l.collateralAmount, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sprout className="h-4 w-4" />
                  <span className="text-xs">Yield Earned</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-emerald-400">
                  +${loans.reduce((s, l) => s + (l.collateralYield || 0), 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Loans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loans.filter(l => l.active).map((loan, i) => (
              <Card
                key={loan.id}
                className="bg-card/50 border-border animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{loan.item}</CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {loan.status === "on-track" ? "On Track" : loan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">
                        {loan.installmentsPaid}/{loan.totalInstallments} installments paid
                      </span>
                      <span className="font-medium">
                        {Math.round((loan.installmentsPaid / loan.totalInstallments) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(loan.installmentsPaid / loan.totalInstallments) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Total Amount</p>
                      <p className="text-sm font-semibold">${loan.totalAmount}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Remaining</p>
                      <p className="text-sm font-semibold">${loan.remainingAmount.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Next Installment</p>
                      <p className="text-sm font-semibold">${loan.installmentAmount.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                      <p className="text-sm font-semibold">{loan.interestRate}%</p>
                    </div>
                  </div>

                  <VenusYieldCard collateralAmount={loan.collateralAmount} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Next due: {loan.nextDueDate}
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0"
                      onClick={() => handleRepay(loan)}
                      disabled={repaying === loan.id}
                    >
                      {repaying === loan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      )}
                      Repay ${loan.installmentAmount.toFixed(2)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment History (demo mode only, or build from API data) */}
          {paymentHistory.length > 0 && (
            <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentHistory.map((payment, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            payment.status === "paid" ? "bg-emerald-500/10" : "bg-secondary"
                          }`}
                        >
                          {payment.status === "paid" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{payment.loan}</p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">${payment.amount.toFixed(2)}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              payment.status === "paid"
                                ? "border-emerald-500/30 text-emerald-400"
                                : "border-amber-500/30 text-amber-400"
                            }`}
                          >
                            {payment.status === "paid" ? "Paid" : "Upcoming"}
                          </Badge>
                        </div>
                      </div>
                      {i < paymentHistory.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

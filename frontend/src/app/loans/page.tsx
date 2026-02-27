"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { mockLoans, mockPaymentHistory } from "@/lib/mock-data";
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Sprout,
} from "lucide-react";

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Loan Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track active loans, repayments, and collateral yield
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs">Active Loans</span>
            </div>
            <p className="text-2xl font-bold mt-1">{mockLoans.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Total Remaining</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              ${mockLoans.reduce((s, l) => s + l.remainingAmount, 0).toFixed(2)}
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
              ${mockLoans.reduce((s, l) => s + l.collateralAmount, 0).toFixed(2)}
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
              +${mockLoans.reduce((s, l) => s + l.collateralYield, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockLoans.map((loan, i) => (
          <Card
            key={loan.id}
            className="bg-card/50 border-border animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{loan.item}</CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  On Track
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
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

              {/* Loan details grid */}
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

              {/* Collateral section */}
              <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <Sprout className="h-3 w-3" />
                      Smart Collateral
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      ${loan.collateralAmount} locked
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Yield earned</p>
                    <p className="text-sm font-bold text-emerald-400">
                      +${loan.collateralYield.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Earning ~5% APY on Venus Protocol
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Next due: {loan.nextDueDate}
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0"
                >
                  Repay ${loan.installmentAmount.toFixed(2)}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPaymentHistory.map((payment, i) => (
              <div key={i}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      payment.status === "paid"
                        ? "bg-emerald-500/10"
                        : "bg-secondary"
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
                {i < mockPaymentHistory.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

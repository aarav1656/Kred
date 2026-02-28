"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPoolStats, mockLenderPosition } from "@/lib/mock-data";
import { fetchPoolStats, fetchCollateral, PoolStats, CollateralPosition } from "@/lib/api";
import { useDemoMode } from "@/lib/demo-mode";
import { useAccount } from "wagmi";
import {
  Landmark,
  TrendingUp,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { VenusStats } from "@/components/venus/VenusStats";
import { useVenus } from "@/hooks/useVenus";
import { Zap, ExternalLink } from "lucide-react";

const apyHistory = [
  { month: "Sep", apy: 6.2 },
  { month: "Oct", apy: 7.1 },
  { month: "Nov", apy: 7.8 },
  { month: "Dec", apy: 8.1 },
  { month: "Jan", apy: 8.6 },
  { month: "Feb", apy: 8.4 },
];

export default function LendPage() {
  const { isDemoMode } = useDemoMode();
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pool, setPool] = useState<PoolStats | null>(null);
  const [position, setPosition] = useState<CollateralPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (isDemoMode) {
      setPool(mockPoolStats);
      setPosition(mockLenderPosition);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const poolData = await fetchPoolStats();
      setPool(poolData);
      if (address) {
        try {
          const collateralData = await fetchCollateral(address);
          setPosition(collateralData);
        } catch {
          setPosition(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pool data");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositing(true);
    setActionSuccess(null);
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        const res = await fetch("http://localhost:3001/api/pool/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lender: address || "0xDemo", amount: parseFloat(depositAmount) }),
        });
        if (!res.ok) throw new Error("Deposit failed");
      }
      setActionSuccess(`Successfully deposited $${depositAmount} USDT`);
      setDepositAmount("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setWithdrawing(true);
    setActionSuccess(null);
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        const res = await fetch("http://localhost:3001/api/pool/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lender: address || "0xDemo", amount: parseFloat(withdrawAmount) }),
        });
        if (!res.ok) throw new Error("Withdrawal failed");
      }
      setActionSuccess(`Successfully withdrew $${withdrawAmount} USDT`);
      setWithdrawAmount("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading pool data...</p>
      </div>
    );
  }

  const displayPool = pool || mockPoolStats;
  const displayPosition = position || (isDemoMode ? mockLenderPosition : null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lender Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn yield by providing liquidity to the Kred lending pool
        </p>
      </div>

      {/* Venus Protocol Live Stats */}
      <VenusStats />

      {error && (
        <Card className="bg-rose-950/20 border-rose-500/30">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{error}</p>
            <Button variant="outline" size="sm" className="ml-auto border-rose-500/30 text-rose-400" onClick={() => { setError(null); loadData(); }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {actionSuccess && (
        <Card className="bg-emerald-950/20 border-emerald-500/30">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">{actionSuccess}</p>
          </CardContent>
        </Card>
      )}

      {/* Pool Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border animate-fade-in-up">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Landmark className="h-4 w-4" />
              <span className="text-xs">Total Deposits</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              ${displayPool.totalDeposits >= 1000 ? `${(displayPool.totalDeposits / 1000).toFixed(0)}K` : displayPool.totalDeposits}
            </p>
            <p className="text-[10px] text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Total Borrowed</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              ${displayPool.totalBorrowed >= 1000 ? `${(displayPool.totalBorrowed / 1000).toFixed(0)}K` : displayPool.totalBorrowed}
            </p>
            <p className="text-[10px] text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Lender APY</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-400">{displayPool.lenderAPY}%</p>
            <p className="text-[10px] text-muted-foreground">current rate</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-300">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PieChart className="h-4 w-4" />
              <span className="text-xs">Utilization</span>
            </div>
            <p className="text-2xl font-bold mt-1">{displayPool.utilization}%</p>
            <Progress value={displayPool.utilization} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Deposit/Withdraw */}
        <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Manage Position</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit">
              <TabsList className="w-full">
                <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground">Amount (USDT)</label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 5000].map((amt) => (
                      <Button key={amt} variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDepositAmount(String(amt))}>
                        ${amt}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="text-emerald-400 font-medium">{displayPool.lenderAPY}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Est. Monthly Yield</span>
                    <span className="font-medium">
                      ${depositAmount ? ((parseFloat(depositAmount) * displayPool.lenderAPY) / 100 / 12).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Est. Annual Yield</span>
                    <span className="font-medium">
                      ${depositAmount ? ((parseFloat(depositAmount) * displayPool.lenderAPY) / 100).toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0"
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount}
                >
                  {depositing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowDownLeft className="h-4 w-4 mr-2" />}
                  Deposit USDT
                </Button>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground">Amount (USDT)</label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {displayPosition && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWithdrawAmount(String(displayPosition.deposited * 0.25))}>25%</Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWithdrawAmount(String(displayPosition.deposited * 0.5))}>50%</Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWithdrawAmount(String(displayPosition.deposited))}>Max</Button>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">${displayPosition ? displayPosition.deposited.toLocaleString() : "0"}</span>
                  </div>
                  {displayPosition && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Earned Yield</span>
                      <span className="text-emerald-400 font-medium">+${displayPosition.earnedYield.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                >
                  {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
                  Withdraw USDT
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Middle: Your Position */}
        <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up animate-delay-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayPosition ? (
              <>
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Total Deposited</p>
                  <p className="text-4xl font-bold mt-1">${displayPosition.deposited.toLocaleString()}</p>
                  <p className="text-sm text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +${displayPosition.earnedYield.toFixed(2)} earned
                  </p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="text-emerald-400 font-semibold">{displayPosition.currentAPY}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit Date</span>
                    <span className="font-medium">
                      {displayPosition.depositDate ? new Date(displayPosition.depositDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Active</span>
                    <span className="font-medium">
                      {displayPosition.depositDate
                        ? Math.max(0, Math.floor((Date.now() - new Date(displayPosition.depositDate).getTime()) / (1000 * 60 * 60 * 24)))
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projected Annual</span>
                    <span className="font-semibold text-emerald-400">
                      ${((displayPosition.deposited * displayPosition.currentAPY) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Landmark className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No active position</p>
                <p className="text-xs text-muted-foreground mt-1">Deposit USDT to start earning yield</p>
              </div>
            )}
            <Separator />
            <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  Venus Protocol Yield
                </div>
                <a
                  href="https://app.venus.io/#/core-pool/market/0xfD5840Cd36d94D7229439859C0112a4185BC0255"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-yellow-500 hover:text-yellow-400 flex items-center gap-0.5 transition-colors"
                >
                  View on Venus <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Idle collateral is deployed to Venus Protocol vUSDT market, earning real yield for borrowers while their funds are locked.
              </p>
            </div>
            <div className="rounded-lg border border-cyan-900/30 bg-cyan-950/20 p-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium">
                <Shield className="h-3 w-3" />
                Risk Protection
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Deposits backed by borrower collateral + AI credit scoring.
                Max utilization: 80%. Insurance pool covers defaults.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Pool Analytics */}
        <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up animate-delay-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pool Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">APY History (6 months)</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={apyHistory}>
                  <defs>
                    <linearGradient id="apyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 14%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 12]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 17%)", borderRadius: "8px", fontSize: 12 }}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, "APY"]}
                  />
                  <Area type="monotone" dataKey="apy" stroke="#10b981" fill="url(#apyGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Separator />
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" />Total Loans Issued</span>
                <span className="font-medium">{displayPool.totalLoansIssued}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Loans Repaid</span>
                <span className="font-medium text-emerald-400">{displayPool.totalLoansRepaid}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Default Rate</span>
                <span className="font-medium text-amber-400">{displayPool.defaultRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3 w-3" />Protocol Revenue</span>
                <span className="font-medium">${displayPool.protocolRevenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPoolStats, mockLenderPosition } from "@/lib/mock-data";
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

// Mock APY history data
const apyHistory = [
  { month: "Sep", apy: 6.2 },
  { month: "Oct", apy: 7.1 },
  { month: "Nov", apy: 7.8 },
  { month: "Dec", apy: 8.1 },
  { month: "Jan", apy: 8.6 },
  { month: "Feb", apy: 8.4 },
];

export default function LendPage() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const pool = mockPoolStats;
  const position = mockLenderPosition;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lender Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn yield by providing liquidity to the CredShield lending pool
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border animate-fade-in-up">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Landmark className="h-4 w-4" />
              <span className="text-xs">Total Deposits</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              ${(pool.totalDeposits / 1000).toFixed(0)}K
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
              ${(pool.totalBorrowed / 1000).toFixed(0)}K
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
            <p className="text-2xl font-bold mt-1 text-emerald-400">{pool.lenderAPY}%</p>
            <p className="text-[10px] text-muted-foreground">current rate</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-300">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PieChart className="h-4 w-4" />
              <span className="text-xs">Utilization</span>
            </div>
            <p className="text-2xl font-bold mt-1">{pool.utilization}%</p>
            <Progress value={pool.utilization} className="h-1.5 mt-1" />
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
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setDepositAmount(String(amt))}
                      >
                        ${amt}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="text-emerald-400 font-medium">{pool.lenderAPY}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Est. Monthly Yield</span>
                    <span className="font-medium">
                      ${depositAmount ? ((parseFloat(depositAmount) * pool.lenderAPY) / 100 / 12).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Est. Annual Yield</span>
                    <span className="font-medium">
                      ${depositAmount ? ((parseFloat(depositAmount) * pool.lenderAPY) / 100).toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0">
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
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
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setWithdrawAmount(String(position.deposited * 0.25))}
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setWithdrawAmount(String(position.deposited * 0.5))}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setWithdrawAmount(String(position.deposited))}
                    >
                      Max
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">${position.deposited.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Earned Yield</span>
                    <span className="text-emerald-400 font-medium">
                      +${position.earnedYield.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
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
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Total Deposited</p>
              <p className="text-4xl font-bold mt-1">
                ${position.deposited.toLocaleString()}
              </p>
              <p className="text-sm text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +${position.earnedYield.toFixed(2)} earned
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current APY</span>
                <span className="text-emerald-400 font-semibold">{position.currentAPY}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit Date</span>
                <span className="font-medium">{position.depositDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Active</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(position.depositDate).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Projected Annual</span>
                <span className="font-semibold text-emerald-400">
                  ${((position.deposited * position.currentAPY) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border border-cyan-900/30 bg-cyan-950/20 p-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium">
                <Shield className="h-3 w-3" />
                Risk Protection
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Your deposits are backed by borrower collateral and AI credit scoring.
                Maximum utilization: 80%. Insurance pool covers defaults.
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
            {/* APY History Chart */}
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
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 12]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 7%)",
                      border: "1px solid hsl(217 33% 17%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, "APY"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="apy"
                    stroke="#10b981"
                    fill="url(#apyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <Separator />

            {/* Protocol stats */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Total Loans Issued
                </span>
                <span className="font-medium">{pool.totalLoansIssued}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3" />
                  Loans Repaid
                </span>
                <span className="font-medium text-emerald-400">{pool.totalLoansRepaid}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Default Rate
                </span>
                <span className="font-medium text-amber-400">{pool.defaultRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" />
                  Protocol Revenue
                </span>
                <span className="font-medium">${pool.protocolRevenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

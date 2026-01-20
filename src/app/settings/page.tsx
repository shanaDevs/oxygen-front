"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Badge, Switch } from "@/components/ui";
import { API_CONFIG } from "@/services/config";
import { Settings, Store, Server, Info, Save } from "lucide-react";

export default function SettingsPage() {
  const [useMockData, setUseMockData] = useState(API_CONFIG.USE_MOCK_DATA);
  const [apiUrl, setApiUrl] = useState(API_CONFIG.BASE_URL);
  const [storeName, setStoreName] = useState("Oxygen POS");
  const [taxRate, setTaxRate] = useState("10");
  const [currency, setCurrency] = useState("LKR");

  const handleSave = () => {
    console.log("Settings saved:", { useMockData, apiUrl, storeName, taxRate, currency });
    alert("Settings saved successfully!");
  };

  return (
    <div className="max-w-3xl space-y-6 p-1">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg shadow-gray-500/25">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your POS system</p>
        </div>
      </div>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Store Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LKR">LKR (Rs)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            API Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div>
              <p className="font-medium">Use Mock Data</p>
              <p className="text-sm text-muted-foreground">
                Enable to use dummy data instead of Express.js backend
              </p>
            </div>
            <Switch
              checked={useMockData}
              onCheckedChange={setUseMockData}
            />
          </div>

          <div className="space-y-2">
            <Label>Backend API URL</Label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={useMockData}
              placeholder="http://localhost:5000/api"
            />
            <p className="text-xs text-muted-foreground">
              Set this to your Express.js backend URL when ready
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> To switch to real backend, set{" "}
              <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">USE_MOCK_DATA: false</code> in{" "}
              <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">src/services/config.ts</code> and
              configure your Express.js API URL in the{" "}
              <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">.env.local</code> file.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Version</p>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Frontend</p>
              <Badge variant="secondary">Next.js 15</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Backend</p>
              <Badge variant="secondary">Express.js</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Styling</p>
              <Badge variant="secondary">Tailwind CSS</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

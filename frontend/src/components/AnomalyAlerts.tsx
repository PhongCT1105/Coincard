import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";

interface Anomaly {
  TS: string;
  SERIES: string;
  DISTANCE: number;
}

function AnomalyAlerts() {
  const { user } = useAuth();
  const [alert, setAlert] = useState<Anomaly | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAlertData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // --- Step 1: Fetch user's top coin ---
        let topCoinSymbol = 'BTC';
        try {
          const portfolioRes = await fetch(`http://127.0.0.1:8000/portfolio/${user.user_id}/top_coin`); // ✅ adjust user_id if dynamic
          if (portfolioRes.ok) {
            const { top_coin } = await portfolioRes.json();
            if (top_coin && top_coin.TOP_COIN) topCoinSymbol = top_coin.TOP_COIN;
          }
        } catch (e) {
          console.warn("Could not fetch user's top coin, falling back to BTC.");
        }

        // --- Step 2: Fetch anomaly predictions ---
        const res = await fetch("http://127.0.0.1:8000/anomaly/all-anomalies");
        if (!res.ok) throw new Error('Failed to fetch anomaly data.');
        const anomalyData = await res.json();

        if (!anomalyData.data || anomalyData.data.length === 0) {
          setAlert(null);
          return;
        }

        // --- Step 3: Find latest anomaly for user's coin ---
        const topCoinSeries = `"${topCoinSymbol}"`;
        const latest = anomalyData.data
                                  .filter((a: Anomaly) => a.SERIES === topCoinSeries)
                                  .sort((a: Anomaly, b: Anomaly) => new Date(b.TS).getTime() - new Date(a.TS).getTime())[0];
        setAlert(latest || null);
      } catch (err: any) {
        console.error("Error fetching anomaly alert:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlertData();
    const interval = setInterval(fetchAlertData, 5 * 60000); // every 5 min
    return () => clearInterval(interval);
  }, [user]);

  // --- Helper: Format alert message ---
  const formatAlert = (a: Anomaly) => {
    const dateTime = new Date(a.TS).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const isRise = a.DISTANCE > 0;
    const Icon = isRise ? ArrowUpCircle : ArrowDownCircle;
    const changeType = isRise ? 'rise' : 'drop';
    const colorClass = isRise ? 'text-green-400' : 'text-red-400';
    const symbol = a.SERIES.replace(/"/g, '');
    const distance = Math.abs(a.DISTANCE).toFixed(2);

    return {
      Icon,
      colorClass,
      message: `At ${dateTime}, ${symbol} had an abnormal ${changeType} of about ${distance}.`,
    };
  };

  // --- Render States ---
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 flex items-center justify-center">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking for price alerts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-900/30 border border-red-700 text-white">
        <div className="flex items-center mb-1 font-semibold">
          <AlertCircle className="w-5 h-5 mr-2" /> Alert Error
        </div>
        <p className="text-sm opacity-90">{error}</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-400">
        <h3 className="font-semibold text-white mb-1">Price Alerts</h3>
        <p className="text-sm">No new anomalies detected for your top coin.</p>
      </div>
    );
  }

  // --- Render Alert Box ---
  const { Icon, colorClass, message } = formatAlert(alert);
  return (
    <div className={`p-4 rounded-xl border ${colorClass.replace('text', 'border')} bg-gray-900/80 shadow-md shadow-black/20`}>
      <div className={`flex items-center mb-2 font-semibold ${colorClass}`}>
        <Icon className="w-5 h-5 mr-2" />
        Price Anomaly Alert
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{message}</p>
    </div>
  );
}

export default AnomalyAlerts;

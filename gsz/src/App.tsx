import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { SheetRow } from './types';
import { fetchSheetData, updateStatus } from './api';
import { DataTable } from './components/DataTable';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sheetData = await fetchSheetData();
      setData(sheetData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleStatusChange = useCallback(async (rowIndex: number, newStatus: 'Open' | 'Reserved') => {
    try {
      await updateStatus(rowIndex, newStatus);
      setData((prevData) =>
        prevData.map((row, idx) =>
          idx === rowIndex ? { ...row, statusByCallCenter: newStatus } : row
        )
      );
    } catch (err) {
      setError('Failed to update status. Please try again.');
      loadData();
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Reduced to 15 seconds for more frequent updates
    return () => clearInterval(interval);
  }, [loadData]);

  const LoadingSpinner = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin">
        <RefreshCw size={32} className="text-white" />
      </div>
    </div>
  ), []);

  if (loading && !data.length) {
    return LoadingSpinner;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="glass rounded-xl p-6 sm:p-8 mb-8 transition-all duration-300">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 glass rounded-lg">
                <FileSpreadsheet size={32} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                Google Sheets Manager
              </h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg 
                hover:bg-white/20 disabled:opacity-50 transition-all duration-300 
                hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-200/20 text-white rounded-lg 
              animate-fade-in backdrop-blur-sm">
              {error}
            </div>
          )}

          <Suspense fallback={<div className="text-white">Loading table...</div>}>
            {data.length > 0 && (
              <DataTable data={data} onStatusChange={handleStatusChange} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
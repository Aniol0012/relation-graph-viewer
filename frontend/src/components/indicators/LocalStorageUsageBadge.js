import React, { useEffect, useMemo, useState } from "react";
import { HardDrive } from "lucide-react";
import { useApp } from "../../context/AppContext";

const FALLBACK_LOCALSTORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

const getLocalStorageBytes = () => {
  try {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || "";
      // Approximation in UTF-16 bytes
      bytes += (key.length + value.length) * 2;
    }
    return bytes;
  } catch (e) {
    return 0;
  }
};

const formatBytes = (value) => {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  const decimals = idx === 0 ? 0 : 1;
  return `${size.toFixed(decimals)} ${units[idx]}`;
};

export const LocalStorageUsageBadge = () => {
  const { settings, dataSource, views, relations, lastImportedSql } = useApp();
  const [usageBytes, setUsageBytes] = useState(0);
  const quotaBytes = FALLBACK_LOCALSTORAGE_LIMIT_BYTES;

  const visible =
    dataSource === "local" && Boolean(settings.showLocalStorageUsage);

  useEffect(() => {
    if (!visible) return;

    const refreshUsage = async () => {
      const localBytes = getLocalStorageBytes();
      setUsageBytes(localBytes);
    };

    refreshUsage();
    const intervalId = window.setInterval(refreshUsage, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [visible, views, relations, lastImportedSql, settings]);

  const ratio = useMemo(() => {
    if (!quotaBytes || quotaBytes <= 0) return 0;
    return Math.min(1, usageBytes / quotaBytes);
  }, [usageBytes, quotaBytes]);

  if (!visible) return null;

  return (
    <div className="local-storage-indicator" data-testid="local-storage-indicator">
      <div className="local-storage-indicator-header">
        <HardDrive className="w-3.5 h-3.5" />
        <span>Espai local</span>
        <span className="local-storage-indicator-percent">
          {(ratio * 100).toFixed(1)}%
        </span>
      </div>
      <div className="local-storage-indicator-track">
        <div
          className="local-storage-indicator-fill"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="local-storage-indicator-meta">
        {formatBytes(usageBytes)} / {formatBytes(quotaBytes)} (limit aprox)
      </div>
    </div>
  );
};

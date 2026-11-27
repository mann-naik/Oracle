"use client";

import React, { useEffect, useState } from "react";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseNotes: string;
  downloadUrl: string;
}

declare global {
  interface Window {
    OracleAndroid?: {
      getAppVersion: () => string;
      checkForUpdates: () => void;
      downloadAndInstallUpdate: (apkUrl: string) => void;
    };
  }
}

export default function SoftwareUpdateTab() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const runUpdateCheck = () => {
    if (!window.OracleAndroid) return;
    setErrorMsg(null);
    setChecking(true);
    window.OracleAndroid.checkForUpdates();
  };

  useEffect(() => {
    const hasBridge = typeof window !== "undefined" && Boolean(window.OracleAndroid);
    setIsAndroid(hasBridge);

    if (!hasBridge) return;

    const currentVer = window.OracleAndroid?.getAppVersion() ?? "1.0.0";
    setUpdateInfo((prev) => ({
      currentVersion: currentVer,
      latestVersion: prev?.latestVersion ?? currentVer,
      updateAvailable: prev?.updateAvailable ?? false,
      releaseNotes: prev?.releaseNotes ?? "",
      downloadUrl: prev?.downloadUrl ?? "",
    }));

    const handleResult = (event: Event) => {
      const customEvent = event as CustomEvent<UpdateInfo>;
      setChecking(false);
      setErrorMsg(null);
      if (customEvent.detail) {
        setUpdateInfo(customEvent.detail);
      }
    };

    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setChecking(false);
      setErrorMsg(customEvent.detail || "Could not check for updates.");
    };

    window.addEventListener("oracle-update-result", handleResult);
    window.addEventListener("oracle-update-error", handleError);

    runUpdateCheck();

    return () => {
      window.removeEventListener("oracle-update-result", handleResult);
      window.removeEventListener("oracle-update-error", handleError);
    };
  }, []);

  const handleInstall = () => {
    if (!updateInfo?.downloadUrl || !window.OracleAndroid) return;
    window.OracleAndroid.downloadAndInstallUpdate(updateInfo.downloadUrl);
  };

  if (!isAndroid) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-300">
        <p className="font-medium text-white">Web Version Active</p>
        <p className="mt-1 text-neutral-400">
          Oracle web updates deploy automatically on Vercel. Native Android APK updates appear here when using the Oracle Android app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 text-neutral-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Software Update</h3>
          <p className="text-xs text-neutral-400">
            Installed version: v{updateInfo?.currentVersion ?? "1.0.0"}
          </p>
        </div>
        <button
          type="button"
          onClick={runUpdateCheck}
          disabled={checking}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check for Updates"}
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {updateInfo && !checking && !errorMsg && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3.5">
          {updateInfo.updateAvailable ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-400">
                  Update Available: v{updateInfo.latestVersion}
                </span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  New APK
                </span>
              </div>

              {updateInfo.releaseNotes && (
                <div className="max-h-40 overflow-y-auto whitespace-pre-line rounded bg-neutral-900 p-2.5 text-xs text-neutral-300">
                  {updateInfo.releaseNotes}
                </div>
              )}

              <button
                type="button"
                onClick={handleInstall}
                className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Download &amp; Install v{updateInfo.latestVersion}
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-300">
              Oracle is up to date (v{updateInfo.currentVersion}).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
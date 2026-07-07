import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export function useBarcodeScanner(elementId: string, onScan: (code: string) => void) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    try {
      setError(null);
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // ignore per-frame scan failures
        }
      );
      setIsScanning(true);
    } catch (err) {
      setError((err as Error).message || "Unable to access camera");
      setIsScanning(false);
    }
  }

  async function stop() {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // scanner already stopped
      }
    }
    setIsScanning(false);
  }

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, stop, isScanning, error };
}

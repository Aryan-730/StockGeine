import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { ScanLine } from "lucide-react";

const ELEMENT_ID = "stockgenie-barcode-reader";

export function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}) {
  const { start, stop, error } = useBarcodeScanner(ELEMENT_ID, (code) => {
    onDetected(code);
    stop();
    onClose();
  });

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => start(), 150);
      return () => clearTimeout(timer);
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Scan barcode">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScanLine className="h-4 w-4" />
          Point your camera at a product barcode
        </div>
        <div
          id={ELEMENT_ID}
          className="w-full overflow-hidden rounded-xl border border-border"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}

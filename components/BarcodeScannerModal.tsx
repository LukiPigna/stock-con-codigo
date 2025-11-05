import React, { useEffect, memo } from 'react';

// Make Html5QrcodeScanner available from the script loaded in index.html
declare const Html5Qrcode: any;

interface BarcodeScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = memo(({ onScanSuccess, onClose }) => {

  useEffect(() => {
    let html5QrCode: any;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          html5QrCode = new Html5Qrcode("reader");
          const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    onScanSuccess(decodedText);
                }).catch((err: any) => console.error("Failed to stop scanner", err));
            }
          };
          const config = { fps: 10, qrbox: { width: 250, height: 150 } };
          html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined);
        } else {
            alert("No se encontraron cámaras en este dispositivo.");
            onClose();
        }
      } catch (err) {
        console.error("Error initializing camera:", err);
        alert(`Error al acceder a la cámara: ${err}`);
        onClose();
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((err: any) => {
          console.error("Error al detener el escáner:", err);
        });
      }
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50 p-4">
        <div className="relative w-full max-w-lg">
            <div id="reader" className="w-full rounded-lg overflow-hidden"></div>
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                <div className="w-[280px] h-[180px] border-4 border-dashed border-white rounded-lg opacity-75"></div>
            </div>
             <p className="text-white text-center mt-4 font-semibold">Apunta la cámara al código de barras</p>
        </div>
      <button onClick={onClose} className="mt-6 px-6 py-2 bg-white text-gray-800 rounded-full font-semibold hover:bg-gray-200">
        Cancelar
      </button>
    </div>
  );
});

export default BarcodeScannerModal;

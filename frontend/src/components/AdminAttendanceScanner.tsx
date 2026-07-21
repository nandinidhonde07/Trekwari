import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useToast } from './ui/toast';
import { Camera, CheckCircle2, ShieldAlert, UserCheck, Search, Bus, HelpCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export function AdminAttendanceScanner() {
  const { toast } = useToast();
  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'attendance-scanner-reader';

  useEffect(() => {
    // Fetch available video devices
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
        } else {
          setErrorText('No camera devices detected. Connect a webcam or run scanner from your phone.');
        }
      })
      .catch((err) => {
        console.error('Failed to get cameras:', err);
        setErrorText('Camera access permissions are required to start the scanner.');
      });

    return () => {
      // Clean up scanning processes on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.error('Failed to stop scanner on unmount:', e));
      }
    };
  }, []);

  const startScanner = async () => {
    if (!selectedCameraId) return;

    try {
      setScannerActive(true);
      setErrorText('');
      setScannedResult(null);

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Successfully decoded QR code
          handleQRDecoded(decodedText);
        },
        (errorMessage) => {
          // Scanning noise, safe to ignore
        }
      );
    } catch (err: any) {
      console.error('Start scanner error:', err);
      setErrorText(err.message || 'Failed to initialize the camera feed.');
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setScannerActive(false);
    } catch (err) {
      console.error('Stop scanner error:', err);
    }
  };

  const handleQRDecoded = async (text: string) => {
    // Temporarily pause scanner by stopping it so it doesn't double-trigger
    await stopScanner();
    
    setLoading(true);
    setErrorText('');
    setScannedResult(null);

    try {
      // 1. Verify QR payload cryptographically on backend
      const result = await api.bookings.verifyQR(text);
      setScannedResult(result);
    } catch (err: any) {
      console.error('QR verification request error:', err);
      
      // Check if duplicate check-in details are sent in response error
      if (err.data && err.data.error === 'ALREADY_CHECKED_IN') {
        setScannedResult({
          isAlreadyCheckedIn: true,
          checkedInAt: err.data.checkedInAt,
          checkedInBy: err.data.checkedInBy
        });
      } else {
        setErrorText(err.message || 'QR Verification failed. Signature is invalid or ticket is forged.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (memberId: string) => {
    setLoading(true);
    try {
      await api.bookings.checkIn(memberId, navigator.userAgent, 'Main Gate Bus Station');
      toast(`Check-In Success! ${scannedResult.name} is now checked in for the trek.`, 'success');
      // Clear result to allow next scan
      setScannedResult(null);
    } catch (err: any) {
      toast('Check-In failed: ' + (err.message || 'Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Camera Scanner box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div className="w-full max-w-[320px] aspect-square bg-gray-55/40 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden flex items-center justify-center">
            {/* The scanning camera viewport */}
            <div id={scannerId} className="w-full h-full object-cover"></div>

            {!scannerActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-50 text-center space-y-3">
                <Camera className="h-10 w-10 text-gray-400" />
                <span className="text-xs font-bold text-gray-500">Boarding Attendance Scanner</span>
                <p className="text-[10px] text-gray-400">Scan participant tickets instantly using your device camera.</p>
              </div>
            )}
          </div>

          {/* Camera controls */}
          <div className="w-full max-w-[320px] space-y-3">
            {cameras.length > 0 && (
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                disabled={scannerActive}
                className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${cameras.indexOf(c) + 1}`}
                  </option>
                ))}
              </select>
            )}

            {!scannerActive ? (
              <button
                onClick={startScanner}
                disabled={cameras.length === 0}
                className="w-full py-3 bg-primary-orange text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50 hover:bg-orange-600 transition-colors"
              >
                Start Camera Scanner
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="w-full py-3 bg-gray-800 text-white text-xs font-extrabold tracking-wider uppercase rounded-xl cursor-pointer hover:bg-gray-900 transition-colors"
              >
                Stop Scanner
              </button>
            )}
          </div>
        </div>

        {/* Right: Validation Panel */}
        <div className="lg:col-span-7 flex flex-col justify-center min-h-[300px] border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8 pt-6 lg:pt-0">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">Boarding Verification Logs</h3>
          
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-2 py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="text-xs text-gray-400 font-bold">Verifying ticket signature...</span>
            </div>
          )}

          {errorText && (
            <div className="p-5 bg-red-50 border border-red-100 rounded-xl space-y-2 text-center">
              <ShieldAlert className="h-8 w-8 text-red-500 mx-auto" />
              <h4 className="text-xs font-extrabold text-red-700 uppercase tracking-wide">Verification Denied</h4>
              <p className="text-[11px] text-red-600">{errorText}</p>
              <button
                onClick={() => {
                  setErrorText('');
                  startScanner();
                }}
                className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
              >
                Scan Next Ticket
              </button>
            </div>
          )}

          {/* Scanned Card Result */}
          {scannedResult && !loading && (
            <div className="space-y-4">
              {scannedResult.isAlreadyCheckedIn ? (
                // Duplicate Scan Warn
                <div className="p-5 bg-yellow-50 border border-yellow-100 rounded-xl space-y-2 text-center">
                  <ShieldAlert className="h-8 w-8 text-yellow-500 mx-auto" />
                  <h4 className="text-xs font-extrabold text-yellow-700 uppercase tracking-wide">Already Checked In</h4>
                  <p className="text-[11px] text-yellow-600">
                    This boarding pass has already been scanned.
                  </p>
                  <div className="text-[10px] text-yellow-500 bg-white/40 p-2.5 rounded-lg inline-block border border-yellow-100/50 mt-1">
                    Time: <span className="font-bold text-gray-700">{new Date(scannedResult.checkedInAt).toLocaleString()}</span>
                    <span className="mx-2">|</span>
                    Staff: <span className="font-bold text-gray-700">{scannedResult.checkedInBy}</span>
                  </div>
                  <button
                    onClick={() => {
                      setScannedResult(null);
                      startScanner();
                    }}
                    className="block mx-auto mt-4 px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Scan Next Ticket
                  </button>
                </div>
              ) : (
                // Valid Ticket detail card
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wide block">Validation Success</span>
                      <span className="text-xs font-extrabold text-emerald-700">✔ Ticket authentic and verified!</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3.5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Participant</span>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">{scannedResult.name} ({scannedResult.age}, {scannedResult.gender})</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Booking ID</span>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">{scannedResult.bookingId}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Bus assignment</span>
                        <p className="text-xs font-extrabold text-orange-600 mt-0.5 flex items-center gap-1">
                          <Bus className="h-3.5 w-3.5" /> {scannedResult.busNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Seat Number</span>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">{scannedResult.seatNumber || 'Auto'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Trek Coordinator</span>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">{scannedResult.coordinatorName}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Pickup Station</span>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">{scannedResult.pickupPoint}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => {
                        setScannedResult(null);
                        startScanner();
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      Clear / Skip
                    </button>
                    <button
                      onClick={() => handleCheckIn(scannedResult.bookingMemberId)}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 transition-colors"
                    >
                      <UserCheck className="h-4 w-4" /> Board Bus (Check-In)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!scannedResult && !loading && !errorText && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-55/35 rounded-xl border border-dashed border-gray-200 py-12">
              <HelpCircle className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-xs font-bold text-gray-400">Scanner Standby</span>
              <p className="text-[10px] text-gray-400 max-w-xs mt-1">Start camera scan, hold QR ticket up to the lens, and results will verify here instantly.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

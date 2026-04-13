let barcodes = [];
let scanning = false;
let lastScan = null;

// beep nhẹ, nhanh
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
  audio.play();
}

// ============================
// 📦 ADD BARCODE
// ============================
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.push(code);
    renderList();
  }
}

// ============================
// 📋 RENDER LIST
// ============================
function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  barcodes.forEach((code, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${code}`;
    list.appendChild(li);
  });
}

// ============================
// 🚀 START SCANNER (AUTO ENGINE)
// ============================
async function startScanner() {
  if (scanning) return;
  scanning = true;

  const video = document.getElementById("video");

  // ============================
  // 🥇 1. TRY: BarcodeDetector (FAST MODE)
  // ============================
  if ("BarcodeDetector" in window) {
    const detector = new BarcodeDetector({
      formats: ["code_128", "ean_13", "ean_8", "qr_code"]
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;
    await video.play();

    const scanFrame = async () => {
      if (!scanning) return;

      try {
        const barcodesDetected = await detector.detect(video);

        if (barcodesDetected.length > 0) {
          const code = barcodesDetected[0].rawValue;

          // chống spam scan
          if (code !== lastScan) {
            lastScan = code;

            addBarcode(code);
            beep();

            setTimeout(() => {
              lastScan = null;
            }, 800);
          }
        }
      } catch (e) {
        console.error(e);
      }

      requestAnimationFrame(scanFrame);
    };

    scanFrame();
    return;
  }

  // ============================
  // 🥈 2. FALLBACK: ZXing (iPhone fallback)
  // ============================
  const codeReader = new ZXing.BrowserMultiFormatReader();

  const devices = await codeReader.listVideoInputDevices();

  const selectedDeviceId = devices.find(d =>
    d.label.toLowerCase().includes("back")
  )?.deviceId || devices[0].deviceId;

  codeReader.decodeFromVideoDevice(
    selectedDeviceId,
    video,
    (result, err) => {
      if (result) {
        const code = result.text;

        if (code !== lastScan) {
          lastScan = code;

          addBarcode(code);
          beep();

          setTimeout(() => {
            lastScan = null;
          }, 800);
        }
      }
    }
  );
}

// ============================
// ⛔ STOP SCANNER
// ============================
function stopScanner() {
  scanning = false;
  lastScan = null;

  const video = document.getElementById("video");

  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  if (window.codeReader) {
    window.codeReader?.reset?.();
  }
}

// ============================
// 🧹 CLEAR
// ============================
function clearList() {
  barcodes = [];
  renderList();
}
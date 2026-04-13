
let barcodes = [];
let scanning = false;

// ========================
// ⛔ anti spam control
// ========================
let lastScan = null;
let lastScanTime = 0;
const COOLDOWN = 1200; // 1.2s chống rung + trùng

// ========================
// 🔊 beep + vibration
// ========================
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.volume = 1;
  audio.play().catch(() => {});

  if (navigator.vibrate) {
    navigator.vibrate(80);
  }
}

// ========================
// ➕ add barcode
// ========================
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.unshift(code);
    renderList();
  }
}

// ========================
// 📋 render list
// ========================
function renderList() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  barcodes.forEach((code, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${code}`;
    list.appendChild(li);
  });
}

// ========================
// 🧹 clear list
// ========================
function clearList() {
  barcodes = [];
  renderList();
}

// ========================
// 🧠 validate barcode (lọc rác)
// ========================
function isValidCode(code) {
  if (!code) return false;
  if (typeof code !== "string") return false;
  if (code.length < 4) return false;
  if (code.length > 60) return false;

  // loại số rác quá ngắn
  if (/^\d+$/.test(code) && code.length < 6) return false;

  return true;
}

// ========================
// 🚀 START SCANNER (STABLE ENGINE)
// ========================
async function startScanner() {
  if (scanning) return;
  scanning = true;

  const video = document.getElementById("video");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    video.srcObject = stream;
    await video.play();

    await new Promise(r => setTimeout(r, 500));

    // ========================
    // 🥇 BarcodeDetector mode
    // ========================
    if ("BarcodeDetector" in window) {
      const detector = new BarcodeDetector({
        formats: ["code_128", "ean_13", "ean_8"]
      });

      const loop = async () => {
        if (!scanning) return;

        try {
          const results = await detector.detect(video);

          if (results && results.length > 0) {
            const code = results[0].rawValue;

            handleScan(code);
          }
        } catch (e) {
          console.log("scan error", e);
        }

        requestAnimationFrame(loop);
      };

      loop();
      return;
    }

    // ========================
    // 🥈 fallback (nếu cần ZXing)
    // ========================
    console.warn("BarcodeDetector not supported");

  } catch (err) {
    console.error("Camera error:", err);
    alert("Không mở được camera");
  }
}

// ========================
// 🧠 HANDLE SCAN (IMPORTANT FIX)
// ========================
function handleScan(code) {
  const now = Date.now();

  if (!isValidCode(code)) return;

  // chống trùng + chống rung
  if (code === lastScan && now - lastScanTime < COOLDOWN) {
    return;
  }

  lastScan = code;
  lastScanTime = now;

  addBarcode(code);
  beep();
}

// ========================
// ⛔ STOP SCANNER
// ========================
function stopScanner() {
  scanning = false;
  lastScan = null;

  const video = document.getElementById("video");

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
}

// ========================
// 📊 EXPORT EXCEL (nếu bạn có xlsx lib)
// ========================
function exportExcel() {
  if (!window.XLSX) return;

  const data = barcodes.map(c => ({ Barcode: c }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Barcodes");
  XLSX.writeFile(wb, "barcodes.xlsx");
}

let barcodes = [];
let scanning = false;

// 🧠 state chống spam
let lastScan = null;
let lastScanTime = 0;
let codeReader = null;

const COOLDOWN = 1200; // chống rung / double scan

// ============================
// 🔊 beep (ổn định hơn)
// ============================
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
  audio.volume = 1;
  audio.play().catch(() => {});
}

// ============================
// ➕ add barcode
// ============================
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.push(code);
    renderList();
  }
}

// ============================
// 📋 render list
// ============================
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

// ============================
// 🧹 clear
// ============================
function clearList() {
  barcodes = [];
  renderList();
}

// ============================
// 🧠 VALIDATE (lọc code rác)
// ============================
function isValidCode(code) {
  if (!code) return false;
  if (typeof code !== "string") return false;
  if (code.length < 4) return false;
  if (code.length > 60) return false;

  // lọc số rác ngắn
  if (/^\d+$/.test(code) && code.length < 6) return false;

  return true;
}

// ============================
// 🧠 HANDLE SCAN (CORE FIX)
// ============================
function handleScan(code) {
  const now = Date.now();

  if (!isValidCode(code)) return;

  // chống spam + chống rung camera
  if (
    code === lastScan &&
    now - lastScanTime < COOLDOWN
  ) {
    return;
  }

  lastScan = code;
  lastScanTime = now;

  addBarcode(code);
  beep();
}

// ============================
// 🚀 START SCANNER
// ============================
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

    // ============================
    // 🥇 BarcodeDetector MODE
    // ============================
    if ("BarcodeDetector" in window) {
      const detector = new BarcodeDetector({
        formats: ["code_128", "ean_13", "ean_8"]
      });

      const scanLoop = async () => {
        if (!scanning) return;

        try {
          const results = await detector.detect(video);

          if (results && results.length > 0) {
            handleScan(results[0].rawValue);
          }
        } catch (e) {
          console.log(e);
        }

        requestAnimationFrame(scanLoop);
      };

      scanLoop();
      return;
    }

    // ============================
    // 🥈 ZXING fallback
    // ============================
    codeReader = new ZXing.BrowserMultiFormatReader();

    const devices = await codeReader.listVideoInputDevices();

    const backCam =
      devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear")
      )?.deviceId || devices[0].deviceId;

    codeReader.decodeFromVideoDevice(
      backCam,
      video,
      (result) => {
        if (result) {
          handleScan(result.text);
        }
      }
    );

  } catch (err) {
    console.error(err);
    alert("Không mở được camera");
  }
}

// ============================
// ⛔ STOP SCANNER (FIX CLEAN)
// ============================
function stopScanner() {
  scanning = false;
  lastScan = null;
  lastScanTime = 0;

  const video = document.getElementById("video");

  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }
}

let barcodes = [];
let scanning = false;

let lastScan = null;
let lastScanTime = 0;
const COOLDOWN = 1000;

let codeReader = null;

// ============================
// 🔊 beep nhẹ
// ============================
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
  audio.volume = 1;
  audio.play().catch(() => {});
}

// ============================
// ➕ ADD BARCODE
// ============================
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.unshift(code);
    renderList();
  }
}

// ============================
// 📋 RENDER LIST
// ============================
function renderList() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  barcodes.forEach((code) => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = code; // ❌ bỏ số thứ tự
    list.appendChild(div);
  });
}

// ============================
// 🧹 CLEAR
// ============================
function clearList() {
  barcodes = [];
  renderList();
}

// ============================
// 🧠 HANDLE SCAN (CHỐNG TRÙNG)
// ============================
function handleScan(code) {
  const now = Date.now();

  if (!code) return;
  if (code === lastScan && now - lastScanTime < COOLDOWN) return;

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

    // ============================
    // 🥇 BarcodeDetector (ANDROID OK)
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
    // 🥈 ZXING fallback (IPHONE)
    // ============================
    codeReader = new ZXing.BrowserMultiFormatReader();

    const devices = await codeReader.listVideoInputDevices();

    const backCamera =
      devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      )?.deviceId || devices[0].deviceId;

    codeReader.decodeFromVideoDevice(
      backCamera,
      video,
      (result, err) => {
        if (result) {
          handleScan(result.text);
        }
      }
    );

  } catch (err) {
    console.error("Camera error:", err);
    alert("Không mở được camera");
  }
}

// ============================
// ⛔ STOP SCANNER
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


// ============================
// ⛔ COPY ALL
// ============================
function copyAll() {
  if (barcodes.length === 0) return;

  const text = barcodes.join("\n");

  navigator.clipboard.writeText(text)
    .then(() => {
      alert("Đã copy toàn bộ barcode!");
    })
    .catch(() => {
      // fallback cho máy không hỗ trợ clipboard
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      alert("Đã copy toàn bộ barcode!");
    });
}
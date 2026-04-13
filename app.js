let barcodes = [];
let scanning = false;
let lastScan = null;

// 🔊 beep + vibration
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.play();

  if (navigator.vibrate) {
    navigator.vibrate(100);
  }
}

// ➕ add barcode
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.unshift(code);
    renderList();
  }
}

// 📋 render list
function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  barcodes.forEach((code, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${code}`;
    list.appendChild(li);
  });
}

// 🧹 clear
function clearList() {
  barcodes = [];
  renderList();
}

// 🚀 START SCANNER (FIX CODE128 + FAST)
async function startScanner() {
  if (scanning) return;
  scanning = true;

  const video = document.getElementById("video");

  // 🥇 BarcodeDetector (FAST MODE)
  if ("BarcodeDetector" in window) {
    const detector = new BarcodeDetector({
      formats: ["code_128", "ean_13", "ean_8"]
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    video.srcObject = stream;
    await video.play();

    const scan = async () => {
      if (!scanning) return;

      try {
        const results = await detector.detect(video);

        if (results.length > 0) {
          const code = results[0].rawValue;

          if (code !== lastScan) {
            lastScan = code;

            addBarcode(code);
            beep();

            setTimeout(() => lastScan = null, 900);
          }
        }
      } catch (e) {}

      requestAnimationFrame(scan);
    };

    scan();
    return;
  }

  // 🥈 ZXING fallback (iPhone)
  const codeReader = new ZXing.BrowserMultiFormatReader();

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
        const code = result.text;

        if (code !== lastScan) {
          lastScan = code;

          addBarcode(code);
          beep();

          setTimeout(() => lastScan = null, 900);
        }
      }
    }
  );
}

// ⛔ STOP
function stopScanner() {
  scanning = false;
  lastScan = null;

  const video = document.getElementById("video");

  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
}
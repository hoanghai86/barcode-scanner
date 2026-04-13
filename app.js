let barcodes = [];
let scanning = false;
let lastScan = null;
let audioUnlocked = false;

// 🔓 unlock audio (fix iPhone)
function unlockAudio() {
  if (audioUnlocked) return;

  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
  audio.play().then(() => {
    audio.pause();
    audioUnlocked = true;
  });
}

// 🔊 beep + vibration
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.play();

  if (navigator.vibrate) {
    navigator.vibrate(120);
  }
}

// ➕ add barcode
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.push(code);
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

// 🚀 START SCANNER (PRO MODE)
async function startScanner() {
  if (scanning) return;
  scanning = true;

  unlockAudio();

  const video = document.getElementById("video");

  // 🥇 FAST MODE (Android Chrome)
  if ("BarcodeDetector" in window) {
    const detector = new BarcodeDetector({
      formats: ["code_128", "ean_13", "ean_8"]
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;
    await video.play();

    const scan = async () => {
      if (!scanning) return;

      const results = await detector.detect(video);

      if (results.length > 0) {
        const code = results[0].rawValue;

        if (code !== lastScan) {
          lastScan = code;

          addBarcode(code);
          beep();

          setTimeout(() => lastScan = null, 800);
        }
      }

      requestAnimationFrame(scan);
    };

    scan();
    return;
  }

  // 🥈 FALLBACK ZXING (iPhone)
  const codeReader = new ZXing.BrowserMultiFormatReader();

  const devices = await codeReader.listVideoInputDevices();

  const selectedDeviceId =
    devices.find(d => d.label.toLowerCase().includes("back"))?.deviceId
    || devices[0].deviceId;

  codeReader.decodeFromVideoDevice(
    selectedDeviceId,
    video,
    (result) => {
      if (result) {
        const code = result.text;

        if (code !== lastScan) {
          lastScan = code;

          addBarcode(code);
          beep();

          setTimeout(() => lastScan = null, 800);
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

  if (window.codeReader) {
    window.codeReader?.reset?.();
  }
}

// 📊 export excel
function exportExcel() {
  const data = barcodes.map(c => ({ Barcode: c }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Barcodes");

  XLSX.writeFile(wb, "barcodes.xlsx");
}
let barcodes = [];
let scanning = false;

// ⛔ chống spam scan
let lastScan = null;
let lastScanTime = 0;
const COOLDOWN = 1500; // 1.5 giây

function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.volume = 1;
  audio.play();

  if (navigator.vibrate) {
    navigator.vibrate(80);
  }
}

function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.unshift(code);
    renderList();
  }
}

function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  barcodes.forEach((code, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${code}`;
    list.appendChild(li);
  });
}

function clearList() {
  barcodes = [];
  renderList();
}

// 🔥 VALIDATE CODE 128 (lọc rác)
function isValidCode(code) {
  if (!code) return false;
  if (code.length < 4) return false;
  if (code.length > 50) return false;
  if (/^[0-9]+$/.test(code) && code.length < 6) return false; // lọc số rác ngắn
  return true;
}

// 🚀 START SCANNER (STABLE MODE)
async function startScanner() {
  if (scanning) return;
  scanning = true;

  const video = document.getElementById("video");

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

          const now = Date.now();

          // 🧠 LOCK LOGIC (QUAN TRỌNG)
          if (
            code &&
            isValidCode(code) &&
            (code !== lastScan || now - lastScanTime > COOLDOWN)
          ) {
            lastScan = code;
            lastScanTime = now;

            addBarcode(code);
            beep();
          }
        }
      } catch (e) {}

      requestAnimationFrame(scan);
    };

    scan();
  }
}

// ⛔ STOP
function stopScanner() {
  scanning = false;

  const video = document.getElementById("video");
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
}
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

// ➕ ADD BARCODE
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.unshift(code); // mới nhất lên đầu
    renderList();
  }
}

// 📋 RENDER LIST (QUAN TRỌNG)
function renderList() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  barcodes.forEach((code, index) => {
    const li = document.createElement("li");
    li.style.padding = "8px";
    li.style.borderBottom = "1px solid #ddd";
    li.innerHTML = `
      <b>${index + 1}.</b> ${code}
    `;
    list.appendChild(li);
  });
}

// 🧹 CLEAR LIST
function clearList() {
  barcodes = [];
  renderList();
}

// 🚀 START SCANNER (GIỮ NGUYÊN ENGINE PRO)
async function startScanner() {
  if (scanning) return;
  scanning = true;

  const video = document.getElementById("video");

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
  }
}

// ⛔ STOP SCANNER
function stopScanner() {
  scanning = false;
  lastScan = null;

  const video = document.getElementById("video");
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
}

// 📊 EXPORT EXCEL
function exportExcel() {
  const data = barcodes.map(c => ({ Barcode: c }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Barcodes");
  XLSX.writeFile(wb, "barcodes.xlsx");
}
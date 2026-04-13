const codeReader = new ZXing.BrowserMultiFormatReader();
const video = document.getElementById('video');

let barcodes = [];
let selectedDeviceId = null;
let scanning = false;

// 🔊 beep khi scan
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
  audio.play();
}

// ▶️ start scan
async function startScanner() {
  if (scanning) return;

  scanning = true;

  const devices = await codeReader.listVideoInputDevices();
  selectedDeviceId = devices[0].deviceId;

  codeReader.decodeFromVideoDevice(selectedDeviceId, video, (result, err) => {
    if (result) {
      addBarcode(result.text);
      beep();
    }
  });
}

// ⏹ stop scan
function stopScanner() {
  scanning = false;
  codeReader.reset();
}

// ➕ thêm mã
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

  barcodes.forEach(code => {
    const li = document.createElement("li");
    li.textContent = code;
    list.appendChild(li);
  });
}

// 🧹 clear
function clearList() {
  barcodes = [];
  renderList();
}

// 📊 export excel
function exportExcel() {
  const data = barcodes.map(code => ({ Barcode: code }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Barcodes");

  XLSX.writeFile(wb, "barcodes.xlsx");
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"));
}
const codeReader = new ZXing.BrowserMultiFormatReader();
const video = document.getElementById('video');

let barcodes = [];
let scanning = false;

// 🔊 beep khi scan
function beep() {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
  audio.play();
}

// ▶️ START SCANNER (FIX CAMERA SAU)
async function startScanner() {
  if (scanning) return;
  scanning = true;

  try {
    const constraints = {
      video: {
        facingMode: { exact: "environment" }
      }
    };

    await codeReader.decodeFromConstraints(
      constraints,
      video,
      (result, err) => {
        if (result) {
          addBarcode(result.text);
          beep();
        }
      }
    );

  } catch (error) {
    console.error(error);

    // fallback nếu máy không support exact
    codeReader.decodeFromVideoDevice(
      null,
      video,
      (result, err) => {
        if (result) {
          addBarcode(result.text);
          beep();
        }
      }
    );
  }
}

// ⏹ STOP SCANNER
function stopScanner() {
  scanning = false;
  codeReader.reset();
}

// ➕ ADD BARCODE
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.push(code);
    renderList();
  }
}

// 📋 RENDER LIST
function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  barcodes.forEach((code, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${code}`;
    list.appendChild(li);
  });
}

// 🧹 CLEAR LIST
function clearList() {
  barcodes = [];
  renderList();
}

// 📊 EXPORT EXCEL
function exportExcel() {
  const data = barcodes.map(code => ({
    Barcode: code
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Barcodes");

  XLSX.writeFile(wb, "barcodes.xlsx");
}

// 💾 AUTO LOAD FROM LOCAL (optional)
window.onload = () => {
  const saved = localStorage.getItem("barcodes");
  if (saved) {
    barcodes = JSON.parse(saved);
    renderList();
  }
};

// 💾 AUTO SAVE
function saveData() {
  localStorage.setItem("barcodes", JSON.stringify(barcodes));
}

// cập nhật save mỗi lần add
function addBarcode(code) {
  if (!barcodes.includes(code)) {
    barcodes.push(code);
    saveData();
    renderList();
  }
}
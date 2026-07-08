// ========================================
// 픽셀아트 그리기 — 동작(JavaScript) 파일
// ========================================

// 1) 화면 요소들을 변수로 가져오기
const grid = document.getElementById("grid");
const colorPicker = document.getElementById("colorPicker");
const gridSizeSelect = document.getElementById("gridSize");
const eraserBtn = document.getElementById("eraserBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

let size = 16;            // 현재 격자 크기 (16 x 16)
let isEraser = false;     // 지우개 모드인가?
let isDrawing = false;    // 마우스를 누른 채인가? (드래그 그리기용)

// 2) 격자 만들기 — size x size 개의 칸(div)을 만들어 붙인다
function createGrid() {
  grid.innerHTML = "";  // 기존 칸 모두 제거
  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size * size; i++) {
    const pixel = document.createElement("div");
    pixel.className = "pixel";
    grid.appendChild(pixel);
  }
}

// 3) 칸 하나 색칠하기
function paint(target) {
  if (!target.classList.contains("pixel")) return;
  target.style.background = isEraser ? "#ffffff" : colorPicker.value;
}

// 4) 마우스/터치로 그리기
grid.addEventListener("pointerdown", (e) => {
  isDrawing = true;
  paint(e.target);
});

grid.addEventListener("pointerover", (e) => {
  if (isDrawing) paint(e.target);
});

// 화면 어디서든 마우스를 떼면 그리기 중단
window.addEventListener("pointerup", () => {
  isDrawing = false;
});

// 5) 도구 버튼들
eraserBtn.addEventListener("click", () => {
  isEraser = !isEraser;                        // 켜기/끄기 전환
  eraserBtn.classList.toggle("active", isEraser);
});

clearBtn.addEventListener("click", () => {
  document.querySelectorAll(".pixel").forEach((p) => {
    p.style.background = "#ffffff";
  });
});

gridSizeSelect.addEventListener("change", () => {
  size = Number(gridSizeSelect.value);
  createGrid();                                 // 크기가 바뀌면 새로 만들기
});

// 색을 고르면 지우개 모드 자동 해제
colorPicker.addEventListener("input", () => {
  isEraser = false;
  eraserBtn.classList.remove("active");
});

// 6) PNG 파일로 저장하기 ⭐
//    화면의 격자를 그대로 <canvas>에 옮겨 그린 뒤 이미지 파일로 변환한다
function downloadPNG() {
  const scale = 20;  // 픽셀 1칸 = 이미지 20x20px (크게 저장)
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");

  const pixels = document.querySelectorAll(".pixel");
  pixels.forEach((pixel, i) => {
    const x = (i % size) * scale;              // 몇 번째 칸인지 → 좌표 계산
    const y = Math.floor(i / size) * scale;
    ctx.fillStyle = pixel.style.background || "#ffffff";
    ctx.fillRect(x, y, scale, scale);
  });

  // canvas → PNG 데이터 → 다운로드 링크를 만들어 자동 클릭
  const link = document.createElement("a");
  link.download = "my-pixel-art.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

downloadBtn.addEventListener("click", downloadPNG);

// 7) 시작! 페이지가 열리면 격자를 만든다
createGrid();

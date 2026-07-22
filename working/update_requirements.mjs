import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "C:/Users/SSAFY/Desktop/first_in_wireframe/working/요구사항_정의서.xlsm";
const outputDir = "C:/Users/SSAFY/Desktop/first_in_wireframe/outputs/019f879f-d921-7ae0-81f7-ac3058045182";
const previewDir = "C:/Users/SSAFY/Desktop/first_in_wireframe/tmp/final_preview";
const outputPath = `${outputDir}/요구사항_정의서_화면설계_반영본.xlsx`;
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const sheet = workbook.worksheets.getItem("요구사항 정의서");

// Existing rows updated where the screen design changes or clarifies the requirement.
const updates = new Map([
  ["C8", "AUTH-02"],
  ["C9", "AUTH-03"],
  ["D9", "대원 인증 및 식별자 발급"],
  ["E9", "대원 선택 시 4자리 임무 코드와 이름을 입력받고, 동일 임무 내 접속 순서에 따라 내부 대원 식별자를 자동 발급한 뒤 대원 UI로 이동해야 한다."],
  ["J9", "2026-07-22 화면 설계 반영: 이름 입력 및 내부 식별자 자동 발급 추가"],
  ["E52", "관제 UI는 기본 도면, SLAM 지도, 대원 위치, 탐지 이벤트 마커와 경로 레이어를 개별적으로 켜고 끌 수 있어야 하며, SLAM 진행 레이어 선택 시 로봇 탐색 구역과 장애물을 함께 반영해야 한다."],
  ["J52", "2026-07-22 화면 설계 반영: 레이어 구성과 SLAM 진행 표시 구체화"],
  ["E61", "관제 UI는 로봇이 송신하는 열화상 영상을 WebRTC 스트림으로 열람하고, 비전 탐지 바운딩 박스와 신뢰도를 영상 위에 표시해야 한다."],
  ["J61", "2026-07-22 화면 설계 반영: 바운딩 박스 및 신뢰도 오버레이 추가"],
  ["E65", "관제 UI는 신규 탐지 이벤트 수신 시 후보 유형, 위치와 발생 시각을 알림으로 표시하고, 미확인 이벤트는 주의 마커로 지도에 표시해야 한다."],
  ["J65", "2026-07-22 화면 설계 반영: 미확인 이벤트 주의 마커 추가"],
  ["E67", "관제 UI는 탐지 이벤트 팝업에 이벤트 태그·명칭·상태, 열화상 캡처와 바운딩 박스·신뢰도, RGB 캡처, 신뢰도·감지 정보(온도·시간), 요원 경로·출입구 경로·탐지 오류 동작을 표시해야 한다."],
  ["J67", "2026-07-22 화면 설계 반영: 팝업 필드와 후속 동작 구체화"],
  ["E71", "관제 UI는 관제원 또는 현장 대원의 인명·열원 확인 결과에 따라 이벤트 상태를 CONFIRMED 또는 FALSE_POSITIVE로 변경하고, 확인 불가 결과는 UNKNOWN으로 되돌려야 한다."],
  ["J71", "2026-07-22 화면 설계 반영: 확인 불가(UNKNOWN) 상태 추가"],
  ["E197", "진입 UI는 대원이 4자리 임무 코드와 이름을 입력하면 임무에 참가시키고, 접속 순서 기반 내부 식별자를 발급받아야 한다."],
  ["J197", "2026-07-22 화면 설계 반영: 이름 입력 및 내부 식별자 수신 추가"],
  ["E225", "진입 UI는 인명 후보와 열원 후보의 위치를 유형별 아이콘으로 표시하고, 현재 마커는 선명하게 과거 마커는 연하게 표시하며 이동 이력을 점선으로 연결해야 한다."],
  ["J225", "2026-07-22 화면 설계 반영: 현재·과거 마커 표현 및 점선 이력 추가"],
  ["E227", "진입 UI는 탐지 이벤트의 DETECTED, REVIEWED, CONFIRMED, FALSE_POSITIVE, RESCUED, UNKNOWN 상태를 표시해야 한다."],
  ["J227", "2026-07-22 화면 설계 반영: UNKNOWN 상태 추가"],
]);
for (const [address, value] of updates) sheet.getRange(address).values = [[value]];

// Append only requirements newly introduced by the supplied screen design.
const newRows = [
  ["화면 설계 변경 반영", "관제 화면 구성", "C-UI-01", "임무 시간 및 종료 제어", "관제 UI는 현재 시각, 임무 경과 시간과 임무 종료 버튼을 화면 우측 상단에 표시해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "C-UI-02", "이벤트 목록 확장·축소", "관제 UI는 탐지 이벤트 목록을 선택하면 상세 목록을 확장하고 스크롤할 수 있어야 하며, 우측 스트리밍 영역은 축소하여 텍스트 중심으로 표시해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "C-UI-03", "이벤트 선택 연동", "관제 UI는 이벤트 선택 시 대응 지도 마커를 강조하고, 이벤트 팝업을 열 수 있는 말풍선 동작을 제공해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "C-UI-04", "대원 마커 이름 표시", "관제 UI는 대원 마커의 현재·과거 위치를 지도에 표시하고 각 마커 아래에 대원이 입력한 이름을 작게 표시해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, "관제 지시 전송", "C-COMM-01", "전송 대상 선택", "관제 UI는 텍스트 지시 입력 영역 좌측에 대원 목록을 제공하고, 특정 대원 복수 선택 또는 전체 전송을 지원해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "C-COMM-02", "텍스트 지시 전송", "관제 UI는 텍스트 입력 후 전송 버튼을 누르면 선택된 대원에게 지시 메시지를 전송하고 대원 UI에 표시해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "C-COMM-03", "지시 전송 결과 표시", "관제 UI는 대원별 메시지 전송 성공·실패 상태와 전송 시각을 표시하고 실패 시 재전송을 제공해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, "대원 지도 상호작용", "F-LOC-07", "본인 위치 핑 생성", "진입 UI는 대원이 지도 마커를 터치한 뒤 드래그하여 본인 위치 핑을 생성하고 관제 UI 지도와 동기화해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "F-LOC-08", "위치 핑 삭제", "진입 UI는 마커 드래그 중 지도 상단에 휴지통 형태의 삭제 영역을 표시하고, 마커를 해당 영역에 놓으면 삭제 후 관제 UI에 반영해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, "대원 탐지 판정", "F-EVT-04", "인명·열원 확인 입력", "진입 UI는 탐지 이벤트의 인명·열원 확인 결과를 O 또는 X로 입력할 수 있어야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "F-EVT-05", "확인 불가 처리", "진입 UI는 확인 불가 선택 시 탐지 이벤트를 UNKNOWN 상태로 되돌리고 관제 UI에 알림을 전송해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, "대원 지시·통화", "F-COMM-01", "관제 지시 표시", "진입 UI는 관제 UI가 전송한 텍스트 지시를 지도 하단에 표시하고, 터치 시 위로 확장되는 스크롤 영역에서 지시 내역을 확인할 수 있어야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "F-COMM-02", "무전 PTT 통화", "진입 UI는 무전 버튼을 누르는 동안 음소거를 해제하여 WebRTC 기반으로 관제 측과 통화하고, 버튼을 놓으면 다시 음소거해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
  [null, null, "F-COMM-03", "통화 상태 표시", "진입 UI는 WebRTC 연결·재연결·통화 중·송신 실패 상태를 대원에게 명확히 표시해야 한다.", "상", "필수", null, null, "2026-07-22 화면 설계 신규"],
];

for (let i = 0; i < newRows.length; i++) {
  const row = 284 + i;
  sheet.getRange(`A${row}:J${row}`).copyFrom(sheet.getRange("A283:J283"), "all");
}
sheet.getRange(`A284:J${283 + newRows.length}`).values = newRows;
sheet.mergeCells(`A284:A${283 + newRows.length}`);
sheet.mergeCells("B284:B287");
sheet.mergeCells("B288:B290");
sheet.mergeCells("B291:B292");
sheet.mergeCells("B293:B294");
sheet.mergeCells("B295:B297");
sheet.getRange(`A284:J${283 + newRows.length}`).format.wrapText = true;
sheet.getRange(`A284:J${283 + newRows.length}`).format.verticalAlignment = "center";
sheet.getRange(`A284:J${283 + newRows.length}`).format.rowHeight = 52;
sheet.getRange(`A284:I${283 + newRows.length}`).format.borders = { preset: "all", style: "thin", color: "#595959" };
sheet.getRange(`F284:F${283 + newRows.length}`).format.fill = "#FF5050";
sheet.getRange(`A284:B${283 + newRows.length}`).format.horizontalAlignment = "center";
sheet.getRange(`C284:D${283 + newRows.length}`).format.horizontalAlignment = "center";
sheet.getRange(`F284:I${283 + newRows.length}`).format.horizontalAlignment = "center";

const updatedAt = sheet.getRange("C3");
updatedAt.values = [["2026-07-22"]];

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log("ERROR_SCAN\n" + errors.ndjson);

const check = await workbook.inspect({
  kind: "table",
  sheetId: "요구사항 정의서",
  range: "A284:J297",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 12,
  maxChars: 12000,
});
console.log("NEW_ROWS\n" + check.ndjson);

for (const [label, range] of [["modified", "A1:J80"], ["modified_firefighter", "A190:J245"], ["new", "A280:J297"]]) {
  const preview = await workbook.render({ sheetName: "요구사항 정의서", range, scale: 1.2, format: "png" });
  await fs.writeFile(`${previewDir}/${label}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`OUTPUT ${outputPath}`);

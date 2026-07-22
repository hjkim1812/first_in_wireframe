# FIRSTIN UI Prototype

화재 현장에서 사용하는 탐색·구조 로봇 관제 서비스의 화면 흐름을 확인하기 위한 정적 UI 프로토타입입니다.

관제 대시보드, 임무 생성, 현장 대원용 임무 진입, 탐지 이벤트 확인 등의 화면을 제공합니다. 현재 데이터와 상호작용은 `app.js`의 mock 데이터로 동작하며 실제 API, WebSocket, WebRTC 연동은 포함하지 않습니다.

## 실행 방법

Python 3가 설치되어 있어야 합니다. 프로젝트 폴더에서 아래 명령을 실행합니다.

### PowerShell

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

### Git Bash

Miniforge의 `firstin-wireframe` 환경이 준비되어 있다면 다음 스크립트를 사용할 수 있습니다.

```bash
bash start.sh
```

서버가 시작되면 브라우저에서 [http://127.0.0.1:4173](http://127.0.0.1:4173)에 접속합니다.

## 주요 파일

- `index.html`: 애플리케이션 진입점
- `styles.css`: 화면 스타일
- `app.js`: UI 렌더링, mock 데이터 및 상호작용
- `ROUTING.md`: 화면 구조와 이동 흐름


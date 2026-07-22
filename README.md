# FIRSTIN UI Prototype

화재 현장에서 사용하는 탐색·구조 로봇 관제 서비스의 화면 흐름을 확인하기 위한 정적 UI 프로토타입입니다.

관제 대시보드, 임무 생성, 현장 대원용 임무 진입, 탐지 이벤트 확인 등의 화면을 제공합니다. 현재 데이터와 상호작용은 `app.js`의 mock 데이터로 동작하며 실제 API, WebSocket, WebRTC 연동은 포함하지 않습니다.

## 실행 환경 및 의존성

- Python 3: 정적 파일을 제공할 로컬 HTTP 서버 실행에 사용
- 최신 Chrome, Edge, Firefox 또는 Safari
- npm 패키지, Python 패키지 및 별도 빌드 과정: 없음
- 인터넷 연결: 불필요 (외부 CDN이나 원격 리소스를 사용하지 않음)

화면 자체는 HTML, CSS, Vanilla JavaScript로 구성되어 있습니다. 클립보드 복사 기능은 브라우저 보안 정책상 `localhost` 또는 HTTPS 환경에서 사용하는 것을 권장합니다.

## 실행 전 확인

터미널에서 Python 3 설치 여부를 확인합니다.

```bash
python --version
```

명령을 찾을 수 없다면 환경에 따라 `python3 --version` 또는 Windows의 `py -3 --version`을 사용합니다. Python이 없다면 [Python 공식 사이트](https://www.python.org/downloads/)에서 Python 3를 설치합니다.

별도의 가상 환경은 필요하지 않습니다. 저장소를 내려받은 뒤 프로젝트 루트(`index.html`이 있는 폴더)에서 서버를 실행하면 됩니다.

## 실행 방법

### Windows PowerShell

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

`python` 명령이 없는 Windows 환경에서는 다음 명령을 사용합니다.

```powershell
py -3 -m http.server 4173 --bind 127.0.0.1
```

### macOS / Linux

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

서버가 시작되면 브라우저에서 [http://127.0.0.1:4173](http://127.0.0.1:4173)에 접속합니다. 종료하려면 서버를 실행한 터미널에서 `Ctrl+C`를 누릅니다.

### 같은 네트워크의 다른 기기에서 접속

개발 PC 외부에서도 접속해야 한다면 서버를 모든 네트워크 인터페이스에 바인딩합니다.

```bash
python -m http.server 4173 --bind 0.0.0.0
```

macOS/Linux에서 `python` 명령이 없다면 `python3`로 바꿉니다. 접속할 기기에서는 `http://<서버-PC의-IP>:4173`을 엽니다. 운영체제 방화벽에서 TCP 4173 포트의 인바운드 연결 허용이 필요할 수 있습니다. 이 서버는 개발·시연용이므로 인터넷에 직접 공개하지 마세요.

### 저장소에 포함된 `start.sh`

`start.sh`는 `/c/Users/SSAFY/miniforge3`와 `firstin-wireframe` Conda 환경을 사용하는 기존 개발 PC 전용 스크립트입니다. 다른 환경에서는 위의 Python 명령을 사용하는 것이 가장 간단합니다.

## 문제 해결

- `Address already in use`가 표시되면 `4174`처럼 사용하지 않는 포트로 변경합니다.
- 화면이 갱신되지 않으면 브라우저에서 강력 새로고침(`Ctrl+F5` 또는 `Cmd+Shift+R`)을 실행합니다.
- 다른 기기에서 접속되지 않으면 서버가 `0.0.0.0`에 바인딩되었는지, IP 주소와 방화벽 설정이 올바른지 확인합니다.

## 주요 파일

- `index.html`: 애플리케이션 진입점
- `styles.css`: 화면 스타일
- `app.js`: UI 렌더링, mock 데이터 및 상호작용
- `ROUTING.md`: 화면 구조와 이동 흐름

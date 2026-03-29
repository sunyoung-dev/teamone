# TeamOne WB - 설계서 (Design Document)

## 1. API 엔드포인트 전체 목록

Base URL: `/api`

### 1.1 Players API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| GET | `/api/players` | 전체 선수 목록 | - | `{ players: Player[] }` |
| GET | `/api/players/:id` | 선수 상세 정보 | - | `{ player: Player }` |
| POST | `/api/players` | 선수 등록 | `Player (without id)` | `{ player: Player }` |
| PUT | `/api/players/:id` | 선수 정보 수정 | `Partial<Player>` | `{ player: Player }` |
| DELETE | `/api/players/:id` | 선수 삭제 (비활성화) | - | `{ success: true }` |
| GET | `/api/players/:id/stats` | 선수 개인 통계 | `?season=2026` | `{ stats: PlayerStats }` |

### 1.2 Games API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| GET | `/api/games` | 전체 경기 목록 | `?status=final&season=2026` | `{ games: Game[] }` |
| GET | `/api/games/:id` | 경기 상세 (기록 포함) | - | `{ game: Game }` |
| POST | `/api/games` | 새 경기 등록 | `Game (without id)` | `{ game: Game }` |
| PUT | `/api/games/:id` | 경기 정보 수정 | `Partial<Game>` | `{ game: Game }` |
| DELETE | `/api/games/:id` | 경기 삭제 | - | `{ success: true }` |

### 1.3 Lineup API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| GET | `/api/games/:id/lineup` | 경기 라인업 조회 | - | `{ lineup: LineupEntry[] }` |
| PUT | `/api/games/:id/lineup` | 라인업 저장/수정 | `{ lineup: LineupEntry[] }` | `{ lineup: LineupEntry[] }` |

### 1.4 At-Bats API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| GET | `/api/games/:id/atbats` | 경기 타석 기록 조회 | `?inning=1` | `{ atBats: AtBat[] }` |
| POST | `/api/games/:id/atbats` | 타석 기록 추가 | `AtBat (without id)` | `{ atBat: AtBat }` |
| PUT | `/api/games/:id/atbats/:atbatId` | 타석 기록 수정 | `Partial<AtBat>` | `{ atBat: AtBat }` |
| DELETE | `/api/games/:id/atbats/:atbatId` | 타석 기록 삭제 | - | `{ success: true }` |

### 1.5 Stats API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| GET | `/api/stats/team` | 팀 전체 통계 | `?season=2026` | `{ stats: TeamStats }` |
| GET | `/api/stats/leaders` | 부문별 리더 | `?category=avg&limit=5` | `{ leaders: LeaderEntry[] }` |

### 1.6 Dashboard API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| GET | `/api/dashboard` | 대시보드 종합 데이터 | - | `{ dashboard: DashboardData }` |

---

## 2. JSON 스키마 (Data Models)

### 2.1 Player

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "number", "position", "battingHand", "throwingHand", "active"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^p\\d{3}$",
      "description": "Unique player ID (e.g., p001)"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20,
      "description": "Player name in Korean"
    },
    "number": {
      "type": "integer",
      "minimum": 0,
      "maximum": 99,
      "description": "Jersey number (등번호)"
    },
    "position": {
      "type": "string",
      "enum": ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"],
      "description": "Primary position"
    },
    "battingHand": {
      "type": "string",
      "enum": ["L", "R", "S"],
      "description": "Batting hand (L=Left, R=Right, S=Switch)"
    },
    "throwingHand": {
      "type": "string",
      "enum": ["L", "R"],
      "description": "Throwing hand"
    },
    "active": {
      "type": "boolean",
      "description": "Whether the player is active on the roster"
    }
  }
}
```

### 2.2 Game

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "date", "opponent", "venue", "status"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^g\\d{3}$",
      "description": "Unique game ID (e.g., g001)"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Game date in ISO format (YYYY-MM-DD)"
    },
    "opponent": {
      "type": "string",
      "minLength": 1,
      "description": "Opponent team name"
    },
    "venue": {
      "type": "string",
      "description": "Game venue/location"
    },
    "result": {
      "type": ["string", "null"],
      "enum": ["W", "L", "D", null],
      "description": "Game result (null if not finished)"
    },
    "scoreOurs": {
      "type": "integer",
      "minimum": 0,
      "default": 0,
      "description": "Our team's score"
    },
    "scoreTheirs": {
      "type": "integer",
      "minimum": 0,
      "default": 0,
      "description": "Opponent's score"
    },
    "innings": {
      "type": "integer",
      "minimum": 1,
      "default": 7,
      "description": "Total innings played"
    },
    "status": {
      "type": "string",
      "enum": ["scheduled", "in_progress", "final"],
      "description": "Game status"
    },
    "lineup": {
      "type": "array",
      "items": { "$ref": "#/definitions/LineupEntry" },
      "description": "Batting lineup for this game"
    },
    "atBats": {
      "type": "array",
      "items": { "$ref": "#/definitions/AtBat" },
      "description": "All at-bat records for this game"
    }
  },
  "definitions": {
    "LineupEntry": {
      "type": "object",
      "required": ["playerId", "battingOrder", "position"],
      "properties": {
        "playerId": {
          "type": "string",
          "pattern": "^p\\d{3}$"
        },
        "battingOrder": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9
        },
        "position": {
          "type": "string",
          "enum": ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"]
        }
      }
    },
    "AtBat": {
      "type": "object",
      "required": ["inning", "playerId", "result", "order"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique at-bat ID within game (e.g., ab001)"
        },
        "inning": {
          "type": "integer",
          "minimum": 1
        },
        "playerId": {
          "type": "string",
          "pattern": "^p\\d{3}$"
        },
        "result": {
          "type": "string",
          "enum": ["1H", "2H", "3H", "HR", "GO", "FO", "SO", "DP", "BB", "HBP", "SF", "SH", "E"]
        },
        "order": {
          "type": "integer",
          "minimum": 1,
          "description": "At-bat order within the inning"
        }
      }
    }
  }
}
```

### 2.3 Computed Types (API Response Only)

#### PlayerStats

```json
{
  "playerId": "p001",
  "playerName": "김수영",
  "gamesPlayed": 10,
  "plateAppearances": 35,
  "atBats": 30,
  "hits": 10,
  "singles": 7,
  "doubles": 2,
  "triples": 0,
  "homeRuns": 1,
  "walks": 3,
  "hitByPitch": 1,
  "strikeouts": 5,
  "sacrificeFlies": 1,
  "sacrificeBunts": 0,
  "groundOuts": 8,
  "flyOuts": 5,
  "doublePlays": 1,
  "errors": 1,
  "avg": 0.333,
  "obp": 0.400,
  "slg": 0.500,
  "ops": 0.900
}
```

#### TeamStats

```json
{
  "season": "2026",
  "gamesPlayed": 15,
  "wins": 9,
  "losses": 5,
  "draws": 1,
  "winPct": 0.643,
  "runsScored": 72,
  "runsAllowed": 55,
  "teamAvg": 0.285,
  "teamObp": 0.350,
  "teamSlg": 0.410,
  "teamOps": 0.760
}
```

#### DashboardData

```json
{
  "teamRecord": {
    "wins": 9,
    "losses": 5,
    "draws": 1,
    "winPct": 0.643
  },
  "recentGames": [
    {
      "id": "g015",
      "date": "2026-04-20",
      "opponent": "레드삭스",
      "scoreOurs": 4,
      "scoreTheirs": 2,
      "result": "W"
    }
  ],
  "teamStats": {
    "avg": 0.285,
    "obp": 0.350,
    "slg": 0.410
  },
  "leaders": {
    "avg": [{ "playerId": "p001", "name": "김수영", "value": 0.385 }],
    "homeRuns": [{ "playerId": "p012", "name": "이지현", "value": 3 }],
    "hits": [{ "playerId": "p001", "name": "김수영", "value": 15 }]
  },
  "nextGame": {
    "id": "g016",
    "date": "2026-04-27",
    "opponent": "화이트울브스",
    "venue": "인천 야구장"
  }
}
```

---

## 3. 통계 계산 로직

서버 사이드에서 `games.json`의 atBats 데이터를 기반으로 실시간 계산한다. 별도 캐싱 없이 요청 시마다 계산 (22명 x ~20경기 규모에서 성능 이슈 없음).

### 3.1 분류 기준

```javascript
// At-bat result classification
const RESULT_TYPES = {
  // 안타 (Hit) - 타수 O, 출루 O
  hits: ['1H', '2H', '3H', 'HR'],

  // 아웃 (Out, counted as at-bat) - 타수 O
  outsWithAB: ['GO', 'FO', 'SO', 'DP', 'E'],

  // 출루 (non-hit, not an at-bat) - 타수 X, 출루 O
  onBaseNoAB: ['BB', 'HBP'],

  // 희생 (not an at-bat) - 타수 X
  sacrifices: ['SF', 'SH'],
};

// 루타 계산
const TOTAL_BASES = { '1H': 1, '2H': 2, '3H': 3, 'HR': 4 };
```

### 3.2 계산 공식

```javascript
function calculateStats(atBats) {
  const pa = atBats.length;                                     // 타석 (PA)
  const bb = count(atBats, 'BB');
  const hbp = count(atBats, 'HBP');
  const sf = count(atBats, 'SF');
  const sh = count(atBats, 'SH');
  const ab = pa - bb - hbp - sf - sh;                          // 타수 (AB)
  const h = countIn(atBats, ['1H', '2H', '3H', 'HR']);         // 안타 (H)
  const tb = sumTotalBases(atBats);                             // 루타 (TB)

  const avg = ab > 0 ? h / ab : 0;                             // 타율 (AVG)
  const obp = (ab + bb + hbp + sf) > 0
    ? (h + bb + hbp) / (ab + bb + hbp + sf) : 0;               // 출루율 (OBP)
  const slg = ab > 0 ? tb / ab : 0;                            // 장타율 (SLG)
  const ops = obp + slg;                                        // OPS

  return { pa, ab, h, tb, bb, hbp, sf, sh, avg, obp, slg, ops };
}
```

---

## 4. 컴포넌트 구조 (Frontend)

### 4.1 디렉토리 구조

```
client/src/
├── main.jsx                    # App entry point
├── App.jsx                     # Router setup, theme provider
├── theme.js                    # MUI custom theme
├── api/
│   └── index.js                # Axios instance + API helper functions
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx       # Top bar + bottom nav + main content
│   │   ├── TopBar.jsx          # App bar with back button, title
│   │   └── BottomNav.jsx       # Bottom navigation (4 tabs)
│   ├── common/
│   │   ├── LoadingSpinner.jsx  # Full-page loading indicator
│   │   ├── ErrorAlert.jsx      # Error display component
│   │   ├── EmptyState.jsx      # No-data placeholder
│   │   └── StatCard.jsx        # Reusable stat display card
│   ├── dashboard/
│   │   ├── DashboardPage.jsx   # Main dashboard page
│   │   ├── RecordCard.jsx      # Season W-L-D summary card
│   │   ├── RecentGames.jsx     # Recent 5 games list
│   │   ├── TeamStatsCard.jsx   # Team batting stats card
│   │   └── LeaderBoard.jsx     # Top players by category
│   ├── games/
│   │   ├── GameListPage.jsx    # All games list with filters
│   │   ├── GameCard.jsx        # Single game summary card
│   │   ├── NewGamePage.jsx     # Create new game form
│   │   └── GameDetailPage.jsx  # Game detail / scorebook view
│   ├── scorebook/
│   │   ├── Scorebook.jsx       # Main scorebook component
│   │   ├── InningTab.jsx       # Inning selector tabs
│   │   ├── AtBatList.jsx       # List of at-bats in current inning
│   │   ├── AtBatEntry.jsx      # Single at-bat row
│   │   ├── ResultPicker.jsx    # At-bat result selection grid
│   │   └── ScoreSummary.jsx    # Running score display
│   ├── lineup/
│   │   ├── LineupPage.jsx      # Lineup editor page
│   │   ├── PlayerSelector.jsx  # Available players list
│   │   ├── BattingOrder.jsx    # Draggable batting order list
│   │   └── PositionAssigner.jsx # Position selection per player
│   └── players/
│       ├── PlayerListPage.jsx  # All players with stats summary
│       ├── PlayerRow.jsx       # Single player row in list
│       ├── PlayerDetailPage.jsx # Individual player stats
│       ├── PlayerStatsTable.jsx # Detailed stats table
│       ├── PlayerManagePage.jsx # Add/edit/remove players
│       └── PlayerForm.jsx      # Player add/edit form
└── utils/
    ├── statsCalculator.js      # Client-side stats formatting
    └── constants.js            # Result codes, positions, etc.
```

### 4.2 핵심 컴포넌트 상세

#### AppLayout

최상위 레이아웃 컴포넌트. 모든 페이지를 감싼다.

```
┌──────────────────────────┐
│  TopBar (제목, 뒤로가기)   │
├──────────────────────────┤
│                          │
│                          │
│     Main Content         │
│     (React Router)       │
│                          │
│                          │
├──────────────────────────┤
│  BottomNav (4탭 고정)     │
└──────────────────────────┘
```

#### ResultPicker (타석 결과 선택기)

경기 기록 시 가장 자주 사용하는 핵심 컴포넌트. 큰 터치 영역의 그리드 버튼.

```
┌──────────────────────────────────┐
│           타석 결과 선택            │
├────────┬────────┬────────┬───────┤
│  단타   │  2루타  │  3루타  │  홈런  │
│  (1H)  │  (2H)  │  (3H)  │  (HR) │
├────────┼────────┼────────┼───────┤
│  땅볼   │ 플라이  │  삼진   │  병살  │
│  (GO)  │  (FO)  │  (SO)  │  (DP) │
├────────┼────────┼────────┼───────┤
│  볼넷   │  사구   │  희비   │ 희번트 │
│  (BB)  │  (HBP) │  (SF)  │  (SH) │
├────────┴────────┴────────┴───────┤
│  실책 출루 (E)                     │
└──────────────────────────────────┘
```

- 안타류: 초록 계열 색상
- 아웃류: 빨강 계열 색상
- 출루(비안타): 파랑 계열 색상
- 희생: 회색 계열 색상

#### BattingOrder (타순 편집기)

드래그앤드롭 또는 화살표 버튼으로 타순 변경.

```
┌──────────────────────────────┐
│ # │ 선수명       │ 포지션  │ ↕ │
├───┼─────────────┼────────┼───┤
│ 1 │ #7 김수영    │  SS    │ ↕ │
│ 2 │ #3 이지현    │  CF    │ ↕ │
│ 3 │ #15 박민아   │  1B    │ ↕ │
│ ...                          │
│ 9 │ #22 최하늘   │  RF    │ ↕ │
└──────────────────────────────┘
```

### 4.3 라우팅 구조

```javascript
// App.jsx routes
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/games" element={<GameListPage />} />
    <Route path="/games/new" element={<NewGamePage />} />
    <Route path="/games/:id" element={<GameDetailPage />} />
    <Route path="/games/:id/lineup" element={<LineupPage />} />
    <Route path="/players" element={<PlayerListPage />} />
    <Route path="/players/:id" element={<PlayerDetailPage />} />
    <Route path="/players/manage" element={<PlayerManagePage />} />
  </Route>
</Routes>
```

---

## 5. 모바일 UX 고려사항

### 5.1 터치 인터랙션

| 요소 | 최소 크기 | 비고 |
|------|----------|------|
| ResultPicker 버튼 | 64px x 64px | 한 손 조작 가능 |
| 리스트 항목 터치 영역 | 48px 높이 | MUI 기본 ListItem |
| 하단 네비게이션 아이콘 | 48px x 48px | MUI BottomNavigation 기본값 |
| FAB (추가 버튼) | 56px | 화면 우하단 고정 |

### 5.2 경기 기록 시 UX 최적화

**한 손 조작 패턴 (오른손 기준):**
- ResultPicker는 화면 하단에 배치 (엄지 접근 용이)
- 현재 타자 정보는 화면 상단에 표시
- 이닝 전환은 좌우 스와이프 또는 상단 탭
- 실행 취소(undo) 버튼은 항상 접근 가능한 위치

**입력 흐름 최적화:**
```
[현재 이닝/타자 표시]
         │
         ▼
[타석 결과 버튼 터치]  ←── 1탭으로 완료
         │
         ▼
[자동으로 다음 타자 이동]
         │
         ▼
[3아웃 시 이닝 자동 전환 제안]
```

### 5.3 반응형 레이아웃 전략

```
Mobile (< 600px)     Tablet (600-960px)    Desktop (> 960px)
┌──────────┐         ┌───────────────┐     ┌─────────────────────┐
│  Single   │         │  Card    Card │     │ Side   │   Main     │
│  Column   │         │  Grid    Grid │     │ Nav    │   Content  │
│  Stack    │         │  (2 cols)     │     │        │   (wider)  │
└──────────┘         └───────────────┘     └─────────────────────┘
```

- **Mobile:** 단일 칼럼, 하단 네비게이션, 카드 풀 폭
- **Tablet:** 2칼럼 그리드 (대시보드 카드), 하단 네비게이션 유지
- **Desktop:** 사이드 네비게이션으로 전환, 넓은 콘텐츠 영역

### 5.4 MUI 테마 커스터마이징

```javascript
// theme.js
const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',        // 팀 메인 컬러 (진한 파랑)
      light: '#42A5F5',
      dark: '#0D47A1',
    },
    secondary: {
      main: '#FF6F00',        // 액센트 (주황)
    },
    success: {
      main: '#2E7D32',        // 승리, 안타 표시
    },
    error: {
      main: '#C62828',        // 패배, 아웃 표시
    },
    warning: {
      main: '#F9A825',        // 무승부
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Roboto", "Noto Sans KR", sans-serif',
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    // 통계 숫자 표시용
    statNumber: {
      fontFamily: '"Roboto Mono", monospace',
      fontWeight: 700,
      fontSize: '1.25rem',
    },
  },
  components: {
    MuiBottomNavigation: {
      styleOverrides: {
        root: { height: 64 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,        // 터치 친화 최소 높이
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});
```

### 5.5 오프라인/네트워크 고려

| 상황 | 대응 |
|------|------|
| 경기 중 네트워크 끊김 | localStorage에 임시 저장, 복구 시 서버 동기화 |
| API 호출 실패 | 재시도 버튼 + 에러 메시지 (Snackbar) |
| 느린 네트워크 | 낙관적 업데이트(Optimistic UI) - 입력 즉시 반영, 백그라운드 저장 |

**localStorage 임시 저장 전략:**

```javascript
// 타석 기록 입력 시
function recordAtBat(gameId, atBat) {
  // 1. 즉시 로컬 상태 업데이트 (UI 반영)
  updateLocalState(atBat);

  // 2. localStorage에 백업
  savePendingAtBat(gameId, atBat);

  // 3. 서버 전송 시도
  try {
    await api.post(`/games/${gameId}/atbats`, atBat);
    removePendingAtBat(gameId, atBat.id);
  } catch (err) {
    // 실패 시 localStorage에 유지, 이후 재시도
    showRetrySnackbar();
  }
}
```

### 5.6 접근성

- 모든 아이콘 버튼에 `aria-label` 제공
- 결과 코드 버튼에 한글 레이블 병기 (시각적 + 스크린리더)
- 색상만으로 정보를 전달하지 않음 (텍스트 병기)
- 폰트 크기 최소 14px (MUI body2 기준)

---

## 6. 서버 구조

### 6.1 디렉토리 구조

```
server/
├── index.js                # Express app setup, middleware, listen
├── routes/
│   ├── players.js          # /api/players routes
│   ├── games.js            # /api/games routes
│   ├── atbats.js           # /api/games/:id/atbats routes
│   ├── lineup.js           # /api/games/:id/lineup routes
│   ├── stats.js            # /api/stats routes
│   └── dashboard.js        # /api/dashboard route
├── services/
│   ├── playerService.js    # Player CRUD logic
│   ├── gameService.js      # Game CRUD logic
│   ├── statsService.js     # Stats calculation engine
│   └── fileStore.js        # JSON file read/write utility
├── middleware/
│   └── errorHandler.js     # Global error handler
├── data/
│   ├── players.json        # Player data
│   └── games.json          # Game + lineup + at-bat data
└── package.json
```

### 6.2 fileStore.js - JSON 파일 유틸리티

```javascript
// Atomic write: write to temp file, then rename
async function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = filePath + '.tmp';
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

async function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}
```

### 6.3 ID 생성 전략

```javascript
// Sequential ID within each JSON file
function nextId(existingItems, prefix) {
  const maxNum = existingItems.reduce((max, item) => {
    const num = parseInt(item.id.replace(prefix, ''), 10);
    return num > max ? num : max;
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}
// nextId(players, 'p') → "p023"
// nextId(games, 'g')   → "g002"
```

---

## 7. 에러 처리

### 7.1 API 에러 응답 포맷

```json
{
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "선수를 찾을 수 없습니다",
    "details": { "id": "p999" }
  }
}
```

### 7.2 에러 코드 목록

| HTTP | Code | 설명 |
|------|------|------|
| 400 | INVALID_REQUEST | 요청 데이터 유효성 검사 실패 |
| 400 | DUPLICATE_NUMBER | 등번호 중복 |
| 400 | INVALID_LINEUP | 라인업 유효성 실패 (중복 포지션 등) |
| 400 | INVALID_RESULT_CODE | 지원하지 않는 타석 결과 코드 |
| 404 | PLAYER_NOT_FOUND | 선수 ID 없음 |
| 404 | GAME_NOT_FOUND | 경기 ID 없음 |
| 404 | ATBAT_NOT_FOUND | 타석 기록 ID 없음 |
| 409 | GAME_ALREADY_FINAL | 종료된 경기 수정 시도 |
| 500 | FILE_WRITE_ERROR | JSON 파일 저장 실패 |

---

## 8. 초기 데이터

### 8.1 players.json 초기 상태

```json
{
  "players": []
}
```

### 8.2 games.json 초기 상태

```json
{
  "games": []
}
```

앱 최초 실행 시 data 디렉토리에 파일이 없으면 서버가 자동으로 빈 초기 파일을 생성한다.

# Plan: TeamOne WB Planning & Design Documentation

**Status:** COMPLETED
**Created:** 2026-03-29

## Context

Create planning and design documentation for a 22-member women's baseball team web app with mobile-first design, file-based JSON storage, and Material UI frontend.

## Work Objectives

1. Create `docs/planning.md` - comprehensive product planning document
2. Create `docs/design.md` - technical design specification

## Deliverables

### 1. planning.md (DONE)
- 서비스 개요 (service overview, user roles, tech stack)
- 사용자 시나리오 (game-day flow from lineup to post-game stats)
- 핵심 기능 정의 (5 features: scorebook, player stats, team results, lineup, dashboard)
- 데이터 모델 (players.json, games.json with at-bat result codes)
- 페이지 목록 및 내비게이션 구조 (8 pages, bottom nav, flow diagram)
- 범위 및 우선순위 (v1 MVP scope, future exclusions)
- 비기능 요구사항

### 2. design.md (DONE)
- API 엔드포인트 전체 목록 (6 groups: players, games, lineup, atbats, stats, dashboard)
- JSON 스키마 (Player, Game, LineupEntry, AtBat with JSON Schema draft-07)
- Computed types (PlayerStats, TeamStats, DashboardData)
- 통계 계산 로직 (AVG, OBP, SLG, OPS formulas with code)
- 컴포넌트 구조 (full directory tree, key component details)
- 모바일 UX 고려사항 (touch targets, one-hand operation, responsive layout)
- MUI 테마 커스터마이징
- 서버 구조 (routes, services, fileStore, error handling)
- 오프라인/네트워크 전략

## Success Criteria
- [x] planning.md covers all 5 required sections
- [x] design.md covers all 4 required sections
- [x] Data models define players.json and games.json with all specified fields
- [x] All 13 at-bat result codes documented with classification
- [x] API endpoints are RESTful and complete
- [x] Mobile UX considerations are specific and actionable

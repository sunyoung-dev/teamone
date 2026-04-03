import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const DashboardPage    = lazy(() => import('./pages/DashboardPage.jsx'));
const GamesPage        = lazy(() => import('./pages/GamesPage.jsx'));
const GameDetailPage   = lazy(() => import('./pages/GameDetailPage.jsx'));
const GameFormPage     = lazy(() => import('./pages/GameFormPage.jsx'));
const PlayersPage      = lazy(() => import('./pages/PlayersPage.jsx'));
const PlayerDetailPage = lazy(() => import('./pages/PlayerDetailPage.jsx'));
const PlayerFormPage   = lazy(() => import('./pages/PlayerFormPage.jsx'));
const StatsPage        = lazy(() => import('./pages/StatsPage.jsx'));
const LeaguesPage      = lazy(() => import('./pages/LeaguesPage.jsx'));

const NAV_TABS = [
  { label: '홈', icon: <HomeIcon />, path: '/' },
  { label: '경기', icon: <SportsBaseballIcon />, path: '/games' },
  { label: '선수', icon: <PeopleIcon />, path: '/players' },
  { label: '통계', icon: <BarChartIcon />, path: '/stats' },
  { label: '대회', icon: <EmojiEventsIcon />, path: '/leagues' },
];

const PAGE_TITLES = {
  '/': '팀원 야구단',
  '/games': '경기 목록',
  '/games/new': '새 경기 등록',
  '/players': '선수 목록',
  '/players/new': '선수 등록',
  '/stats': '팀 통계',
  '/leagues': '대회 관리',
};

function getNavValue(pathname) {
  if (pathname === '/') return 0;
  if (pathname.startsWith('/games')) return 1;
  if (pathname.startsWith('/players')) return 2;
  if (pathname.startsWith('/stats')) return 3;
  if (pathname.startsWith('/leagues')) return 4;
  return 0;
}

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.match(/^\/games\/[^/]+\/edit$/)) return '경기 수정';
  if (pathname.match(/^\/games\/[^/]+$/)) return '경기 상세';
  if (pathname.match(/^\/players\/[^/]+\/edit$/)) return '선수 수정';
  if (pathname.match(/^\/players\/[^/]+$/)) return '선수 상세';
  return '팀원 야구단';
}

function isRootPage(pathname) {
  return ['/', '/games', '/players', '/stats', '/leagues'].includes(pathname);
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navValue = getNavValue(location.pathname);
  const title = getTitle(location.pathname);
  const showBack = !isRootPage(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', bgcolor: 'background.default' }}>
      {/* Top AppBar */}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ minHeight: 56 }}>
          {showBack && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          {!showBack && (
            <Box
              component="img"
              src="/logo.jpeg"
              alt="팀원 야구단 로고"
              sx={{ width: 32, height: 32, borderRadius: 1, mr: 1, objectFit: 'cover' }}
            />
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.05rem' }}
          >
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/new" element={<GameFormPage />} />
          <Route path="/games/:id" element={<GameDetailPage />} />
          <Route path="/games/:id/edit" element={<GameFormPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/new" element={<PlayerFormPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/players/:id/edit" element={<PlayerFormPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
        </Routes>
        </Suspense>
      </Box>

      {/* Bottom Navigation */}
      <Paper elevation={8} sx={{ position: 'static', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <BottomNavigation
          value={navValue}
          onChange={(_, newValue) => navigate(NAV_TABS[newValue].path)}
        >
          {NAV_TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.label}
              label={tab.label}
              icon={tab.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

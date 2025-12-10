import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketProvider';
import { MainLayout } from './layouts/MainLayout';
import {
  HomePage,
  ReservedDogsPage,
  WalkingDogsPage,
  CompletedDogsPage,
  AdminPage,
  ExcelMapPage,
  MemberXlsPage,
  MemberListPage,
  LocationListPage,
  SchedulePage,
} from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="reserve" element={<HomePage autoScrollToList />} />
            <Route path="reserved" element={<ReservedDogsPage />} />
            <Route path="walking" element={<WalkingDogsPage />} />
            <Route path="completed" element={<CompletedDogsPage />} />
            <Route path="rooms/admin" element={<AdminPage />} />
            <Route path="map-excel" element={<ExcelMapPage />} />
            <Route path="member-excel" element={<MemberXlsPage />} />
            <Route path="member-list" element={<MemberListPage />} />
            <Route path="location-list" element={<LocationListPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="hello" element={<div style={{ padding: '20px' }}>Hello 페이지 (준비중)</div>} />
          </Route>
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;

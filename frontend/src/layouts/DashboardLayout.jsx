import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto ml-64">
        <Outlet />  {/* ← child routes render here */}
      </main>
    </div>
  );
}
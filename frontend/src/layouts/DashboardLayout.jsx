import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#F2FAFD]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scroll-thin md:ml-64 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

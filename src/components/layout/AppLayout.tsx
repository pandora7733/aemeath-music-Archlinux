import { useRightPanel } from "../../hooks/useRightPanel";
import LeftSidebar from "./left-sidebar/LeftSidebar";
import TopPlayerBar from "./top-player-bar/TopPlayerBar";
import RightPanel from "./right-panel/RightPanel";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
    const { mode } = useRightPanel();
  
    return (
      <div className="flex h-screen bg-bg-base">
        <LeftSidebar />
  
        <div className="flex min-w-0 flex-1 flex-col">
          <TopPlayerBar />
  
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
  
            {mode !== "closed" && <RightPanel />}
          </div>
        </div>
      </div>
    );
  }
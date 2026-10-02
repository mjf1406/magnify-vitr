import { Navbar } from "@/components/navigation/NavBar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app")({
  component: function AppLayout() {
    return (
      <div className="flex min-h-svh flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    );
  },
});

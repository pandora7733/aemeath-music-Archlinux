import { type FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  libraryNav,
  mainNav,
  playlistNav,
  type NavItem,
} from "../../../config/navigation";
import SidebarFooter from "./SidebarFooter";

function SidebarSection({ title }: { title: string }) {
  return (
    <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
      {title}
    </p>
  );
}

function SidebarNavItem({ item, end = false }: { item: NavItem; end?: boolean }) {
  return (
    <NavLink
      to={item.path}
      end={end}
      className={({ isActive }) =>
        [
          "block rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-bg-hover font-medium text-primary"
            : "text-secondary hover:bg-bg-hover hover:text-primary",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function LeftSidebar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <aside className="flex h-full w-sidebar shrink-0 flex-col bg-bg-sidebar">
      <div className="p-4 pb-2">
        <p className="mb-4 text-lg font-bold text-primary">aemeath</p>

        <form onSubmit={handleSearch}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색"
            className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:ring-1 focus:ring-accent"
          />
        </form>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {mainNav.map((item) => (
            <li key={item.path}>
              <SidebarNavItem item={item} end={item.path === "/"} />
            </li>
          ))}
        </ul>

        <SidebarSection title="보관함" />
        <ul className="space-y-0.5">
          {libraryNav.map((item) => (
            <li key={item.path}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>

        <SidebarSection title="플레이리스트" />
        <ul className="space-y-0.5">
          {playlistNav.map((item) => (
            <li key={item.path}>
              <SidebarNavItem item={item} end={item.path === "/playlists"} />
            </li>
          ))}
        </ul>
      </nav>

      <SidebarFooter />
    </aside>
  );
}

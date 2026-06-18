import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./context/PlayerContext";
import { RightPanelProvider } from "./context/RightPanelContext";
import AppLayout from "./components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import NewPage from "./pages/NewPage";
import SearchPage from "./pages/SearchPage";
import RecentlyAddedPage from "./pages/library/RecentlyAddedPage";
import ArtistsPage from "./pages/library/ArtistsPage";
import AlbumsPage from "./pages/library/AlbumsPage";
import SongsPage from "./pages/library/SongsPage";
import AllPlaylistsPage from "./pages/playlists/AllPlaylistsPage";
import FavoritesPage from "./pages/playlists/FavoritesPage";
import PlaylistDetailPage from "./pages/playlists/PlaylistDetailPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <RightPanelProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/new" element={<NewPage />} />
              <Route path="/search" element={<SearchPage />} />

              <Route path="/library/recent" element={<RecentlyAddedPage />} />
              <Route path="/library/artists" element={<ArtistsPage />} />
              <Route path="/library/albums" element={<AlbumsPage />} />
              <Route path="/library/songs" element={<SongsPage />} />

              <Route path="/playlists" element={<AllPlaylistsPage />} />
              <Route path="/playlists/favorites" element={<FavoritesPage />} />
              <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
            </Route>

            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </RightPanelProvider>
      </PlayerProvider>
    </BrowserRouter>
  );
}

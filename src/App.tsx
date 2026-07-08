import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./context/PlayerContext";
import { MediaActionsProvider } from "./context/MediaActionsContext";
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
import ExternalDownloadPage from "./pages/downloads/ExternalDownloadPage";
import SettingsPage from "./pages/SettingsPage";
import { primePluginStatusCache } from "./hooks/usePlugin";
import { primeDiscoveryCache } from "./hooks/useDiscovery";

export default function App() {
  useEffect(() => {
    primePluginStatusCache();
    primeDiscoveryCache();
  }, []);

  return (
    <BrowserRouter>
      <PlayerProvider>
        <MediaActionsProvider>
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
              <Route path="/downloads/external" element={<ExternalDownloadPage />} />
            </Route>

            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </RightPanelProvider>
        </MediaActionsProvider>
      </PlayerProvider>
    </BrowserRouter>
  );
}

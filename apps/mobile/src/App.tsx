import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { StatusBar } from "~/components/layout/StatusBar";
import { TabBar } from "~/components/layout/TabBar";
import { ContentProvider } from "~/content/ContentProvider";
import { PlayerProvider, usePlayer } from "~/content/PlayerProvider";
import { ExploreScreen } from "~/screens/ExploreScreen";
import { EventDetailScreen } from "~/screens/EventDetailScreen";
import { HomeScreen } from "~/screens/HomeScreen";
import { LiveScreen } from "~/screens/LiveScreen";
import { OnboardingScreen } from "~/screens/OnboardingScreen";
import { ProfileScreen } from "~/screens/ProfileScreen";
import {
  FavoriteStationsScreen,
  HelpScreen,
  MyEventsScreen,
  NotificationsScreen,
  SettingsScreen,
} from "~/screens/ProfileSubScreens";
import { SearchScreen } from "~/screens/SearchScreen";
import { TicketsScreen } from "~/screens/TicketsScreen";
import { isNativeShell } from "~/lib/platform";

/**
 * Routes that keep the tab bar. The onboarding flow, the event detail page and
 * the account sub-pages are full-screen pushes — exactly what the mock shows
 * (no tab bar on the event page).
 */
const TAB_ROUTES = ["/", "/live", "/explore", "/tickets", "/profile", "/search"];
const FULLSCREEN_ROUTES = ["/events/"];

function Shell() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // One global live region: the player can be started from Home, Live or
  // Explore, so playback state has to be announced wherever the listener is.
  const { status } = usePlayer();

  const path = location.pathname;
  const isOnboarding = path === "/welcome";
  const showTabs =
    TAB_ROUTES.includes(path) || (!isOnboarding && !FULLSCREEN_ROUTES.some((p) => path.startsWith(p)));

  // Native-style route change: new screen starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);

  return (
    <div className="device-stage flex flex-col">
      {isOnboarding ? (
        <Routes>
          <Route path="/welcome" element={<OnboardingScreen />} />
        </Routes>
      ) : (
        <>
          {isNativeShell() ? (
            <div className="safe-top shrink-0" />
          ) : (
            <StatusBar className="shrink-0" />
          )}
          <main
            ref={scrollRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain pt-1.5"
          >
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/live" element={<LiveScreen />} />
              <Route path="/explore" element={<ExploreScreen />} />
              <Route path="/tickets" element={<TicketsScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/profile/events" element={<MyEventsScreen />} />
              <Route path="/profile/stations" element={<FavoriteStationsScreen />} />
              <Route path="/profile/notifications" element={<NotificationsScreen />} />
              <Route path="/profile/settings" element={<SettingsScreen />} />
              <Route path="/profile/help" element={<HelpScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/events/:slug" element={<EventDetailScreen />} />
              <Route path="*" element={<HomeScreen />} />
            </Routes>
          </main>
          <p aria-live="polite" role="status" className="sr-only">
            {status}
          </p>
          {showTabs ? <TabBar /> : null}
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <ContentProvider>
      <PlayerProvider>
        <Shell />
      </PlayerProvider>
    </ContentProvider>
  );
}

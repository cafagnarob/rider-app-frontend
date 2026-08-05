import { Route, Routes } from "react-router-dom"
import Layout from "../components/layout/Layout"
import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"
import EventsPage from "../pages/EventsPage"
import ForgotPasswordPage from "../pages/ForgotPasswordPage"
import ResetPasswordPage from "../pages/ResetPasswordPage"
import VerifyEmailPage from "../pages/VerifyEmailPage"
import RegisterPage from "../pages/RegisterPage"
import ProtectedRoute from "./ProtectedRoute"
import BrandsPage from "../pages/BrandsPage"
import ModelsPage from "../pages/ModelsPage"
import GaragePage from "../pages/GaragePages"
import ProfilePage from "../pages/ProfilePage"
import FeedPage from "../pages/FeedPage"
import PostDetailPage from "../pages/PostDetailPage"
import NotificationsPage from "../pages/NotificationsPage"
import PublicProfilePage from "../pages/PublicProfilePage"
import FollowListPage from "../pages/FollowListPage"
import RidesHistoryPage from "../pages/RidesHistoryPage"
import RideTrackerPage from "../pages/RideTrackerPage"
import RideDetailPage from "../pages/RideDetailPage"
import RouteEditorPage from "../pages/RouteEditorPage"

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/catalog" element={<BrandsPage />} />
          <Route path="/catalog/:brandId" element={<ModelsPage />} />
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<PublicProfilePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/users/:username/followers"
            element={<FollowListPage type="followers" />}
          />
          <Route
            path="/users/:username/following"
            element={<FollowListPage type="following" />}
          />
          <Route path="/rides" element={<RidesHistoryPage />} />
          <Route path="/rides/new" element={<RideTrackerPage />} />
          <Route path="/rides/:rideId" element={<RideDetailPage />} />
          <Route path="/routes/new" element={<RouteEditorPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}
export default AppRoutes

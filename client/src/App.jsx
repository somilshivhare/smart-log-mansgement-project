import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import ProfilePage from "./citizen/pages/Profile";
import DocumentDetailsPage from "./citizen/pages/DocumentDetails";
import Dashboard from "./citizen/pages/dashboard";
import SettingsPage from "./citizen/pages/Settings";
import AdminDashboard from "./Admin/pages/Dashboard";
import VerificationQueue from "./Admin/pages/VerificationQueue";
import DocumentReview from "./Admin/pages/DocumentReview";
import LogsAudit from "./Admin/pages/LogsAudit";
import UserManagement from "./Admin/pages/UserManagement";
import Settings from "./Admin/pages/Settings";
import Navbar from "./Admin/components/Navbar";
import Sidebar from "./Admin/components/Sidebar";
import Page from "./Prelogin/pages/Landing";
import AboutPage from "./Prelogin/pages/About";
import ContactPage from "./Prelogin/pages/Contact";
import LoginPage from "./Prelogin/pages/Login";
import SignUpPage from "./Prelogin/pages/Signup";
import PrivacyPage from "./Prelogin/pages/Privacy";
import TermsPage from "./Prelogin/pages/Terms";
import DocumentationPage from "./Prelogin/pages/Documentation";
import HelpCenterPage from "./Prelogin/pages/HelpCenter";
import PlatformInfoPage from "./Prelogin/pages/PlatformInfo";
import ScrollToTop from "./components/ScrollToTop";
import GoogleCallback from "./GoogleCallback";
import PrivateAuth from "./Middlewares/CitizenAuthMiddleware";
import PrivateAdminAuth from "./Middlewares/AdminAuthMiddleware";
import { UserProvider } from "./Context/UserContext";
function App() {
  return (
    <UserProvider>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/how-it-works" element={<PlatformInfoPage title="How It Works" />} />
        <Route path="/features" element={<PlatformInfoPage title="Features" />} />
        <Route path="/security" element={<PlatformInfoPage title="Security" />} />
        <Route path="/compliance" element={<PlatformInfoPage title="Compliance" />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route
          path="/citizen/*"
          element={
            <PrivateAuth>
              <Routes>
                <Route path="" element={<Dashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="document/:id" element={<DocumentDetailsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </PrivateAuth>
          }
        />
        <Route
          path="/admin/*"
          element={
            <PrivateAdminAuth>
              <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto p-6">
                    <Routes>
                      <Route path="" element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route
                        path="verification"
                        element={<VerificationQueue />}
                      />
                      <Route path="review/:id" element={<DocumentReview />} />
                      <Route path="logs" element={<LogsAudit />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="settings" element={<Settings />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </PrivateAdminAuth>
          }
        />
      </Routes>
    </BrowserRouter>
    </UserProvider>
  );
}

export default App;

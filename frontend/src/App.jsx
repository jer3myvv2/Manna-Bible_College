import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import ScrollToTop from './components/ScrollToTop';
import { Loader } from './components/Status';
import About from './pages/About';
import Apply from './pages/Apply';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProgrammeDetail from './pages/ProgrammeDetail';
import Programmes from './pages/Programmes';
import ShortCourses from './pages/ShortCourses';

// Admin pages are loaded on demand so public visitors (mostly on phones) download less.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminProgrammes = lazy(() => import('./pages/admin/AdminProgrammes'));
const AdminProgrammeEdit = lazy(() => import('./pages/admin/AdminProgrammeEdit'));
const AdminElectives = lazy(() => import('./pages/admin/AdminElectives'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminLevels = lazy(() => import('./pages/admin/AdminLevels'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader label="Loading…" />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="programmes" element={<Programmes />} />
            <Route path="programmes/:slug" element={<ProgrammeDetail />} />
            <Route path="short-courses" element={<ShortCourses />} />
            <Route path="apply" element={<Apply />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="programmes" element={<AdminProgrammes />} />
            <Route path="programmes/:id" element={<AdminProgrammeEdit />} />
            <Route path="electives" element={<AdminElectives />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="levels" element={<AdminLevels />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

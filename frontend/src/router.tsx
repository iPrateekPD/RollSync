import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Landing } from './pages/Landing';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

// Helper to wrap lazy components
const Loadable = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

const Login = Loadable(lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login }))));
const AdminDashboard = Loadable(lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard }))));
const StudentsList = Loadable(lazy(() => import('./pages/admin/StudentsList').then(module => ({ default: module.StudentsList }))));
const TeachersList = Loadable(lazy(() => import('./pages/admin/TeachersList').then(module => ({ default: module.TeachersList }))));
const TimetableList = Loadable(lazy(() => import('./pages/admin/TimetableList').then(module => ({ default: module.TimetableList }))));
const TeacherDashboard = Loadable(lazy(() => import('./pages/teacher/TeacherDashboard').then(module => ({ default: module.TeacherDashboard }))));
const TeacherClasses = Loadable(lazy(() => import('./pages/teacher/TeacherClasses').then(module => ({ default: module.TeacherClasses }))));
const TeacherAttendance = Loadable(lazy(() => import('./pages/teacher/TeacherAttendance').then(module => ({ default: module.TeacherAttendance }))));
const LiveMonitor = Loadable(lazy(() => import('./pages/dashboard/LiveMonitor').then(module => ({ default: module.LiveMonitor }))));
const Timetable = Loadable(lazy(() => import('./pages/dashboard/Timetable').then(module => ({ default: module.Timetable }))));
const StudentDashboard = Loadable(lazy(() => import('./pages/student/StudentDashboard').then(module => ({ default: module.StudentDashboard }))));
const StudentAttendance = Loadable(lazy(() => import('./pages/student/StudentAttendance').then(module => ({ default: module.StudentAttendance }))));
const StudentLeaves = Loadable(lazy(() => import('./pages/student/StudentLeaves').then(module => ({ default: module.StudentLeaves }))));
const Reports = Loadable(lazy(() => import('./pages/dashboard/Reports').then(module => ({ default: module.Reports }))));
const Settings = Loadable(lazy(() => import('./pages/dashboard/Settings').then(module => ({ default: module.Settings }))));
const LeaveRequests = Loadable(lazy(() => import('./pages/dashboard/LeaveRequests').then(module => ({ default: module.LeaveRequests }))));
const DevicesList = Loadable(lazy(() => import('./pages/admin/DevicesList').then(module => ({ default: module.DevicesList }))));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <Login />
      }
    ]
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/students', element: <StudentsList /> },
          { path: '/admin/teachers', element: <TeachersList /> },
          { path: '/admin/timetable', element: <TimetableList /> },
          { path: '/admin/reports', element: <Reports /> },
          { path: '/admin/devices', element: <DevicesList /> },
          { path: '/settings', element: <Settings /> },
          // etc
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['TEACHER']} />,
        children: [
          { path: '/teacher', element: <TeacherDashboard /> },
          { path: '/teacher/classes', element: <TeacherClasses /> },
          { path: '/teacher/attendance', element: <TeacherAttendance /> },
          { path: '/teacher/live', element: <LiveMonitor /> },
          { path: '/teacher/timetable', element: <Timetable /> },
          { path: '/teacher/reports', element: <Reports /> },
          { path: '/teacher/students', element: <StudentsList /> },
          { path: '/teacher/leaves', element: <LeaveRequests /> },
          { path: '/settings', element: <Settings /> },
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['STUDENT']} />,
        children: [
          { path: '/student', element: <StudentDashboard /> },
          { path: '/student/attendance', element: <StudentAttendance /> },
          { path: '/student/leaves', element: <StudentLeaves /> },
        ]
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

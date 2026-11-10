import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { NotFound } from './pages/NotFound';

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
);

const Loadable = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

const Login = Loadable(lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login }))));
const TeacherDashboard = Loadable(lazy(() => import('./pages/teacher/TeacherDashboard').then(module => ({ default: module.TeacherDashboard }))));
const TeacherClasses = Loadable(lazy(() => import('./pages/teacher/TeacherClasses').then(module => ({ default: module.TeacherClasses }))));
const TeacherAttendance = Loadable(lazy(() => import('./pages/teacher/TeacherAttendance').then(module => ({ default: module.TeacherAttendance }))));
const LiveMonitor = Loadable(lazy(() => import('./pages/dashboard/LiveMonitor').then(module => ({ default: module.LiveMonitor }))));
const Timetable = Loadable(lazy(() => import('./pages/dashboard/Timetable').then(module => ({ default: module.Timetable }))));
const Reports = Loadable(lazy(() => import('./pages/dashboard/Reports').then(module => ({ default: module.Reports }))));
const Settings = Loadable(lazy(() => import('./pages/dashboard/Settings').then(module => ({ default: module.Settings }))));
const LeaveRequests = Loadable(lazy(() => import('./pages/dashboard/LeaveRequests').then(module => ({ default: module.LeaveRequests }))));
const StudentsList = Loadable(lazy(() => import('./pages/admin/StudentsList').then(module => ({ default: module.StudentsList }))));
const CameraCapture = Loadable(lazy(() => import('./pages/camera/CameraCapture').then(module => ({ default: module.CameraCapture }))));
const DemoCamera = Loadable(lazy(() => import('./pages/camera/DemoCamera').then(module => ({ default: module.DemoCamera }))));

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/teacher" replace /> },
  { path: '/camera/:token', element: <CameraCapture /> },
  { path: '/camera/demo/:token', element: <DemoCamera /> },
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <Login /> }]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/teacher', element: <TeacherDashboard /> },
          { path: '/teacher/classes', element: <TeacherClasses /> },
          { path: '/teacher/attendance', element: <TeacherAttendance /> },
          { path: '/teacher/live', element: <LiveMonitor /> },
          { path: '/teacher/timetable', element: <Timetable /> },
          { path: '/teacher/reports', element: <Reports /> },
          { path: '/teacher/students', element: <StudentsList /> },
          { path: '/teacher/leaves', element: <LeaveRequests /> },
          { path: '/teacher/settings', element: <Settings /> }
        ]
      }
    ]
  },
  { path: '*', element: <NotFound /> }
]);

import React, { useEffect, useState } from 'react';
import { useApp } from './lib/store';
import { Loading, Toast, useToast } from './components/UI';
import Login from './pages/Login';
import { Layout } from './components/Layout';
import { StudentDashboard, Roadmap, SessionPage, QuizPage, LevelExamPage, DictionaryPage, TasksPage, NotificationsPage, LeaderboardPage, ProfilePage, MaterialsPage } from './pages/Student';
import { AdminDashboard, StudentsPage, CurriculumPage, ContentPage, GrammarStudioPage, QuizzesPage, ReviewsPage, OperationsPage, AdminSettingsPage, CertificatesPage } from './pages/Admin';

class ErrorBoundary extends React.Component<any, { error: any }> {
  state = { error: null as any };
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) return <div className="card"><h2>An error occurred on this page</h2><pre dir="ltr" style={{ whiteSpace: 'pre-wrap', fontSize: '.8rem' }}>{String(this.state.error?.stack || this.state.error)}</pre></div>;
    return this.props.children;
  }
}

export function go(path: string) { window.location.hash = path.startsWith('#') ? path : '#' + path; }
export function useRoute() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  useEffect(() => {
    const h = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return route.replace(/^#/, '').split('?')[0];
}

export default function App() {
  const { user, ready } = useApp();
  const route = useRoute();
  const toast = useToast();

  if (!ready) return <Loading label="Preparing Speakozy..." />;
  if (!user) return <><Login />{toast.node}</>;

  const parts = route.split('/').filter(Boolean);
  const isAdminArea = parts[0] === 'admin';

  let page: React.ReactNode;
  if (isAdminArea) {
    if (user.role !== 'admin') page = <StudentDashboard />;
    else {
      switch (parts[1]) {
        case 'students': page = <StudentsPage />; break;
        case 'curriculum': page = <CurriculumPage />; break;
        case 'content': page = <ContentPage />; break;
        case 'grammar': page = <GrammarStudioPage />; break;
        case 'quizzes': page = <QuizzesPage />; break;
        case 'reviews': page = <ReviewsPage />; break;
        case 'operations': page = <OperationsPage />; break;
        case 'settings': page = <AdminSettingsPage />; break;
        case 'certificates': page = <CertificatesPage />; break;
        default: page = <AdminDashboard />;
      }
    }
  } else {
    switch (parts[0]) {
      case 'roadmap': page = <Roadmap />; break;
      case 'materials': page = <MaterialsPage />; break;
      case 'session': page = <SessionPage sessionId={parts[1]} />; break;
      case 'quiz': page = <QuizPage sessionId={parts[1]} />; break;
      case 'exam': page = <LevelExamPage levelId={parts[1]} />; break;
      case 'dictionary': page = <DictionaryPage />; break;
      case 'tasks': page = <TasksPage />; break;
      case 'notifications': page = <NotificationsPage />; break;
      case 'leaderboard': page = <LeaderboardPage />; break;
      case 'profile': page = <ProfilePage />; break;
      default: page = <StudentDashboard />;
    }
  }
  return <><Layout current={route}><ErrorBoundary key={route}>{page}</ErrorBoundary></Layout>{toast.node}</>;
}

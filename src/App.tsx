import { ConsentBanner } from './components/ConsentBanner';
import React, { useEffect, useState } from 'react';
import { useApp } from './lib/store';
import { Loading, Toast, useToast } from './components/UI';
import Login from './pages/Login';
import { Layout } from './components/Layout';
import { StudentDashboard, Roadmap, SessionPage, QuizPage, LevelExamPage, DictionaryPage, WordsPage, YallaNetkellemPage, TasksPage, NotificationsPage, LeaderboardPage, ProfilePage, MaterialsPage } from './pages/Student';
import TrialPage from './pages/Trial';
import ResetPassword from './pages/ResetPassword';
import { installScreenGuard } from './lib/screenGuard';
import { openedFromRecoveryLink, sbOnPasswordRecovery } from './lib/supabase';
import { ListenAdminPage } from './pages/ListenClips';
import { PdfAdminPage } from './pages/PdfAdmin';
import ShadowingPage from './pages/Shadowing';
import PlayPage from './pages/Play';
import ResourcesPage from './pages/Resources';
import LessonEditor from './pages/LessonEditor';
import TestimonialsPage from './pages/Testimonials';
import { AdminDashboard, StudentsPage, CurriculumPage, ContentPage, GrammarStudioPage, QuizzesPage, ReviewsPage, OperationsPage, AdminSettingsPage, CertificatesPage, AdminWordsPage, TaskReviewsPage } from './pages/Admin';

class ErrorBoundary extends React.Component<any, { error: any }> {
  state = { error: null as any };
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) return <div className="card"><h2>حصلت مشكلة في الصفحة دي — اعمل تحديث للصفحة وبياناتك في أمان</h2><pre dir="ltr" style={{ whiteSpace: 'pre-wrap', fontSize: '.8rem' }}>{String(this.state.error?.stack || this.state.error)}</pre></div>;
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
  useEffect(() => {
    const main = document.getElementById('app-main');
    if (main) main.scrollTo(0, 0);
  }, [route]);
  return route.replace(/^#/, '').split('?')[0];
}

export default function App() {
  const { user, ready } = useApp();
  useEffect(() => { if (user && user.role !== 'admin') return installScreenGuard(); }, [user?.id, user?.role]);
  const route = useRoute();
  const toast = useToast();
  const [recovering, setRecovering] = useState(openedFromRecoveryLink);
  useEffect(() => sbOnPasswordRecovery(() => setRecovering(true)), []);

  if (recovering) return <ResetPassword onDone={() => { setRecovering(false); window.location.hash = '#/'; window.location.reload(); }} />;
  if (!ready) return <Loading label="بنجهز Speakozy..." />;
  if (!user) {
    if (route === '/trial') return <><TrialPage />{toast.node}<ConsentBanner /></>;
    return <><Login />{toast.node}<ConsentBanner /></>;
  }

  const parts = route.split('/').filter(Boolean);
  const isAdminArea = parts[0] === 'admin';

  let page: React.ReactNode;
  if (isAdminArea) {
    if (user.role !== 'admin') page = <StudentDashboard />;
    else {
      switch (parts[1]) {
        case 'students': page = <StudentsPage />; break;
        case 'lesson': page = <LessonEditor />; break;
        case 'curriculum': page = <CurriculumPage />; break;
        case 'content': page = <ContentPage />; break;
        case 'grammar': page = <GrammarStudioPage />; break;
        case 'words': page = <AdminWordsPage />; break;
        case 'quizzes': page = <QuizzesPage />; break;
        case 'reviews': page = <ReviewsPage />; break;
        case 'task-reviews': page = <TaskReviewsPage />; break;
        case 'operations': page = <OperationsPage />; break;
        case 'settings': page = <AdminSettingsPage />; break;
        case 'listen': page = <ListenAdminPage />; break;
        case 'pdfs': page = <PdfAdminPage />; break;
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
      case 'words': page = <WordsPage />; break;
      case 'yalla-netkellem': page = <YallaNetkellemPage />; break;
      case 'tasks': page = <TasksPage />; break;
      case 'notifications': page = <NotificationsPage />; break;
      case 'leaderboard': page = <LeaderboardPage />; break;
      case 'profile': page = <ProfilePage />; break;
      case 'trial': page = <TrialPage />; break;
      case 'listen': page = <ShadowingPage />; break;
      case 'shadowing': page = <ShadowingPage />; break;
      case 'play': page = <PlayPage />; break;
      case 'resources': page = <ResourcesPage />; break;
      case 'testimonials': page = <TestimonialsPage />; break;
      default: page = <StudentDashboard />;
    }
  }
  return <><Layout current={route}><ErrorBoundary key={route}>{page}</ErrorBoundary></Layout>{toast.node}<ConsentBanner /></>;
}

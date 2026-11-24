// Sends the daily Web Push notifications: SRS words due + subscription ending (last 7 days).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (SUPABASE_URL / SERVICE_ROLE_KEY are provided).
// Test one student: POST {"test":true,"email":"student@mail.com"} with the x-cron-secret header.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails('mailto:info@speakozy.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);

const cairoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const daysLeft = (end?: string) => (end && /^\d{4}-\d{2}-\d{2}$/.test(end))
  ? Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(cairoToday() + 'T00:00:00Z')) / 86400000) : null;
const arDate = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });
  const body = await req.json().catch(() => ({}));

  const { data: row } = await sb.from('academy_state').select('data').eq('id', 'academy/main').single();
  const doc: any = row?.data || {};
  const users: any[] = doc.users || [];
  const { data: roles } = await sb.from('user_roles').select('user_id, student_id').eq('active', true);
  const { data: subs } = await sb.from('push_subscriptions').select('*');
  const studentOf = new Map((roles || []).map((r: any) => [r.user_id, r.student_id]));
  const nowIso = new Date().toISOString();

  const messages = new Map<string, { title: string; body: string; href: string; tag: string }[]>();
  const add = (sid: string, m: any) => messages.set(sid, [...(messages.get(sid) || []), m]);
  for (const u of users) {
    if (u.role !== 'student' || u.active === false) continue;
    if (body.test) { if ((u.email || '').toLowerCase() === String(body.email || '').toLowerCase()) add(u.id, { title: 'Speakozy', body: 'الإشعارات شغّالة ✅', href: './', tag: 'test' }); continue; }
    const due = (doc.savedWords || []).filter((w: any) => w.studentId === u.id && (!w.nextReview || w.nextReview <= nowIso)).length;
    if (due > 0) add(u.id, { title: 'مراجعة الكلمات', body: `عندك ${due} كلمة مستحقة للمراجعة دلوقتي — راجعها قبل ما تنساها.`, href: './#/words', tag: 'srs' });
    const left = daysLeft(u.subscriptionEnd);
    if (left !== null && left >= 0 && left <= 7) {
      const when = left === 0 ? 'النهارده' : left === 1 ? 'بكرة' : `بعد ${left} أيام`;
      add(u.id, { title: 'اشتراكك قرب ينتهي', body: `اشتراكك هينتهي ${when} (آخر يوم ${arDate(u.subscriptionEnd)}). جدّد علشان تكمّل من غير توقف.`, href: './#/profile', tag: 'subend' });
    }
  }

  let sent = 0, removed = 0;
  for (const s of subs || []) {
    const list = messages.get(studentOf.get(s.user_id) as string) || [];
    for (const m of list) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m), { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) { await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint); removed++; break; }
        console.error('push failed', e?.statusCode, e?.body);
      }
    }
  }
  return new Response(JSON.stringify({ sent, removed, subscriptions: (subs || []).length }), { headers: { 'Content-Type': 'application/json' } });
});

import { redirect } from 'next/navigation';
import { isAdmin, signIn, signOut } from '../lib/auth';
import { hasDatabase, listBooks } from '../lib/db';
import AdminClient from './AdminClient';

async function loginAction(formData) {
  'use server';
  const password = String(formData.get('password') || '');
  const ok = await signIn(password);
  if (ok) redirect('/admin');
  redirect('/admin?error=1');
}

async function logoutAction() {
  'use server';
  await signOut();
  redirect('/admin');
}

export default async function AdminPage({ searchParams }) {
  const authed = await isAdmin();
  const query = await searchParams;

  if (!process.env.ADMIN_PASSWORD) {
    return <main className="admin-page"><div className="admin-login"><div className="admin-card"><h1>Ghost Stories Society Admin</h1><p className="error">ADMIN_PASSWORD is not configured for this deployment.</p></div></div></main>;
  }

  if (!authed) {
    return <main className="admin-page"><div className="admin-login"><div className="admin-card">
      <div className="wordmark ghost-wordmark">GHOST STORIES SOCIETY</div>
      <h1 style={{marginTop:28}}>Doctor's Writing Room</h1>
      <p className="muted">Private publishing dashboard.</p>
      <form action={loginAction}>
        <div className="field"><label>Admin password</label><input type="password" name="password" placeholder="Admin password" autoComplete="current-password" required /></div>
        {query?.error ? <p className="error">Incorrect password.</p> : null}
        <button className="button primary" type="submit">Enter</button>
      </form>
    </div></div></main>;
  }

  const databaseReady=hasDatabase();
  const books=await listBooks({admin:true});
  return <AdminClient initialBooks={books} databaseReady={databaseReady} logoutAction={logoutAction} />;
}

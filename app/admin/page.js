import { redirect } from 'next/navigation';
import { books } from '../data';
import { isAdmin, signIn, signOut } from '../lib/auth';
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
    return <main className="admin-page"><div className="admin-login"><div className="admin-card"><h1>David Writes Admin</h1><p className="error">ADMIN_PASSWORD is not configured for this deployment.</p></div></div></main>;
  }

  if (!authed) {
    return <main className="admin-page"><div className="admin-login"><div className="admin-card">
      <div className="wordmark">DAVID//WRITES</div>
      <h1 style={{marginTop:28}}>David Writes Admin</h1>
      <p className="muted">Private publishing dashboard.</p>
      <form action={loginAction}>
        <div className="field"><label>Admin password</label><input type="password" name="password" placeholder="Admin password" autoComplete="current-password" required /></div>
        {query?.error ? <p className="error">Incorrect password.</p> : null}
        <button className="button primary" type="submit">Sign in</button>
      </form>
      <p className="muted" style={{fontSize:'.78rem',marginTop:18}}>Authentication is verified on the server and stored in an HTTP-only session cookie.</p>
    </div></div></main>;
  }

  return <AdminClient books={books} logoutAction={logoutAction} />;
}

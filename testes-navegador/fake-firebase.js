/* Firebase falso para testes: auth e Firestore em memória, compartilhados pelo Node entre vários "aparelhos". */
const B = () => window;
export function initializeApp() { return { fake: true }; }
export function getApps() { return []; }
export function getApp() { return { fake: true }; }
export function getFirestore() { return { fake: 'db' }; }
export function initializeFirestore() { return { fake: 'db' }; }
export function persistentLocalCache() { return {}; }
export function persistentMultipleTabManager() { return {}; }
export function doc(db, ...segs) { return { path: segs.join('/'), id: segs[segs.length - 1] }; }
export function collection(db, ...segs) { return { coll: segs.join('/') }; }
export function where(f, op, v) { return { f, op, v }; }
export function query(c, ...filtros) { return { coll: c.coll, filtros }; }
export function orderBy() { return {}; }
export function limit() { return {}; }
export function serverTimestamp() { return { __ts: true }; }
export function writeBatch() { return { set() {}, delete() {}, commit: async () => {} }; }
const lidos = (arr) => arr.map(x => ({ id: x.id, data: () => x.data, exists: () => true }));
export async function setDoc(ref, data) {
  const limpo = JSON.parse(JSON.stringify(data, (k, v) => (v && v.__ts ? Date.now() : v)));
  if (B().__fakeOffline) throw Object.assign(new Error('offline'), { code: 'unavailable' });
  await B().__fbSet(ref.path, JSON.stringify(limpo));
}
export async function updateDoc(ref, data) { return setDoc(ref, data); }
export async function deleteDoc(ref) { await B().__fbDel(ref.path); }
export async function getDoc(ref) { const r = JSON.parse(await B().__fbGet(ref.path) || 'null'); return { exists: () => !!r, data: () => r, id: ref.id }; }
export async function getDocFromServer(ref) { return getDoc(ref); }
export async function getDocs(q) { const arr = JSON.parse(await B().__fbList(q.coll)); return { docs: lidos(arr), empty: !arr.length, forEach: f => lidos(arr).forEach(f) }; }
const escutas = new Set();
B().__fbNotify = async () => { for (const e of Array.from(escutas)) await e.rodar(); };
export function onSnapshot(q, next, erro) {
  const e = { async rodar() {
    if (B().__fakeOffline) return;
    try { const arr = JSON.parse(await B().__fbList(q.coll)).filter(x => (q.filtros || []).every(f => x.data[f.f] === f.v)); next({ docs: lidos(arr) }); } catch (x) { if (erro) erro(x); } } };
  escutas.add(e); setTimeout(() => e.rodar(), 0);
  return () => escutas.delete(e);
}
/* ---- auth ---- */
const ouvintes = new Set();
const auth = { get currentUser() { try { return JSON.parse(localStorage.getItem('fake_user') || 'null'); } catch (e) { return null; } } };
function emitir() { const u = auth.currentUser; ouvintes.forEach(f => setTimeout(() => f(u), 0)); }
export function getAuth() { return auth; }
export function onAuthStateChanged(a, cb) { ouvintes.add(cb); setTimeout(() => cb(auth.currentUser), 20); return () => ouvintes.delete(cb); }
async function acao(op, email, senha) {
  const r = JSON.parse(await B().__fbAuth(op, email, senha));
  if (r.erro) throw Object.assign(new Error(r.erro), { code: r.erro });
  localStorage.setItem('fake_user', JSON.stringify(r.user)); emitir(); return { user: r.user };
}
export const signInWithEmailAndPassword = (a, e, s) => acao('entrar', e, s);
export const createUserWithEmailAndPassword = (a, e, s) => acao('criar', e, s);
export async function signOut() { localStorage.removeItem('fake_user'); emitir(); }
export class GoogleAuthProvider { setCustomParameters() {} }
export const signInWithPopup = () => acao('google', 'google@teste.com', '');
export async function signInWithRedirect() { return null; }
export async function getRedirectResult() { return null; }
export async function sendPasswordResetEmail(a, e) { const r = JSON.parse(await B().__fbAuth('redefinir', e, '')); if (r.erro) throw Object.assign(new Error(r.erro), { code: r.erro }); }
export class EmailAuthProvider { static credential() { return {}; } }
export async function reauthenticateWithCredential() {}
export async function deleteUser() {}

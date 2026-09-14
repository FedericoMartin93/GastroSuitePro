import { writable } from 'svelte/store';
import { auth, googleProvider } from '$lib/firebase/client';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { gmailStore } from './gmailStore';
import { tenantStore } from './tenantStore';

export type UserRole = 'super_admin' | 'owner' | 'visitor' | null;

export interface AuthState {
    user: User | null;
    role: UserRole;
    loading: boolean;
    error: string | null;
}

const SUPER_ADMIN_EMAIL = 'fefomartin00@gmail.com';

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        user: null,
        role: null,
        loading: true,
        error: null
    });

    if (typeof window !== 'undefined') {
        onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const email = (firebaseUser.email || '').toLowerCase().trim();
                const isSuperAdmin = (email === SUPER_ADMIN_EMAIL);
                const role: UserRole = isSuperAdmin ? 'super_admin' : 'owner';

                update(s => ({ ...s, user: firebaseUser, role, loading: false }));

                // Sincronizar tenant según rol
                if (isSuperAdmin) {
                    // Super admin retiene el tenant activo o default
                } else if (email === 'lino.brasserie@gmail.com') {
                    tenantStore.lockToTenant('Calculadora-de-platos-Lino');
                } else {
                    const matched = tenantStore.findTenantByEmail(email);
                    tenantStore.lockToTenant(matched ? matched.id : 'Calculadora-de-platos-Lino');
                }
            } else {
                update(s => ({ ...s, user: null, role: null, loading: false }));
            }
        });
    }

    return {
        subscribe,

        async loginWithGoogle() {
            update(s => ({ ...s, loading: true, error: null }));
            try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                const email = (user.email || '').toLowerCase().trim();
                const isSuperAdmin = (email === SUPER_ADMIN_EMAIL);
                const role: UserRole = isSuperAdmin ? 'super_admin' : 'owner';

                // Capturar y guardar token OAuth si está disponible
                // @ts-ignore - credential is typed on UserCredential
                const credential = result.credential;
                if (credential && credential.accessToken) {
                    gmailStore.setAccessToken(credential.accessToken, email);
                }

                update(s => ({ ...s, user, role, loading: false }));
                return user;
            } catch (err: any) {
                console.error('[AuthStore] Error en inicio de sesión con Google:', err);
                update(s => ({ ...s, loading: false, error: err.message || 'Error al conectar con Google' }));
                throw err;
            }
        },

        async logout() {
            await signOut(auth);
            gmailStore.clear();
            update(s => ({ ...s, user: null, role: null, loading: false }));
        }
    };
}

export const authStore = createAuthStore();

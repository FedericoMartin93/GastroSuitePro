import { writable } from 'svelte/store';

export interface GmailSyncError {
    type: 'API_DISABLED' | 'TOKEN_EXPIRED' | 'NETWORK' | 'UNKNOWN';
    code?: number;
    title: string;
    message: string;
    helpUrl?: string;
}

export interface GmailState {
    accessToken: string | null;
    connectedEmail: string | null;
    isLoading: boolean;
    syncError: GmailSyncError | null;
}

function createGmailStore() {
    const isBrowser = typeof window !== 'undefined';
    const savedToken = isBrowser 
        ? (sessionStorage.getItem('gsp_google_access_token') || localStorage.getItem('gsp_google_access_token'))
        : null;
    const savedEmail = isBrowser 
        ? (localStorage.getItem('gsp_active_gmail_account') || sessionStorage.getItem('gsp_active_gmail_account'))
        : null;

    const { subscribe, set, update } = writable<GmailState>({
        accessToken: savedToken,
        connectedEmail: savedEmail,
        isLoading: false,
        syncError: null
    });

    return {
        subscribe,

        setAccessToken(token: string, email: string) {
            if (isBrowser) {
                sessionStorage.setItem('gsp_google_access_token', token);
                localStorage.setItem('gsp_google_access_token', token);
                sessionStorage.setItem('gsp_active_gmail_account', email);
                localStorage.setItem('gsp_active_gmail_account', email);
            }
            update(s => ({
                ...s,
                accessToken: token,
                connectedEmail: email,
                syncError: null
            }));
        },

        setLoading(isLoading: boolean) {
            update(s => ({ ...s, isLoading }));
        },

        setError(error: GmailSyncError | null) {
            update(s => ({ ...s, syncError: error, isLoading: false }));
        },

        /**
         * Inicializa y solicita el Token OAuth mediante Google Identity Services (GIS) initTokenClient
         */
        requestGoogleAccessToken(clientId?: string, hintEmail?: string) {
            if (!isBrowser) return;

            // Verificar si el script de Google Identity Services está cargado en app.html
            const googleObj = (window as any).google;
            if (!googleObj || !googleObj.accounts || !googleObj.accounts.oauth2) {
                console.warn('[gmailStore] GIS SDK (google.accounts.oauth2) no detectado aún en window.');
                return;
            }

            const activeClientId = clientId 
                || localStorage.getItem('gsp_google_client_id') 
                || '999617852679-0.apps.googleusercontent.com';

            try {
                const tokenClient = googleObj.accounts.oauth2.initTokenClient({
                    client_id: activeClientId,
                    scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
                    hint: hintEmail || localStorage.getItem('gsp_active_gmail_account') || '',
                    callback: (tokenResponse: any) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            const email = hintEmail || localStorage.getItem('gsp_active_gmail_account') || 'lino.brasserie@gmail.com';
                            this.setAccessToken(tokenResponse.access_token, email);
                        }
                    },
                    error_callback: (err: any) => {
                        console.error('[GIS initTokenClient Error]:', err);
                        update(s => ({
                            ...s,
                            syncError: {
                                type: 'TOKEN_EXPIRED',
                                title: 'Error de Autorización Google (GIS)',
                                message: err.message || 'No se pudo obtener el token OAuth.'
                            }
                        }));
                    }
                });

                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (err: any) {
                console.error('[gmailStore] Error instanciando initTokenClient:', err);
            }
        },

        clear() {
            if (isBrowser) {
                sessionStorage.removeItem('gsp_google_access_token');
                localStorage.removeItem('gsp_google_access_token');
                sessionStorage.removeItem('gsp_active_gmail_account');
                localStorage.removeItem('gsp_active_gmail_account');
            }
            set({
                accessToken: null,
                connectedEmail: null,
                isLoading: false,
                syncError: null
            });
        }
    };
}

export const gmailStore = createGmailStore();

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

import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase/client';
import { doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

export interface Tenant {
    id: string;
    name: string;
    companyName: string;
    clientEmail: string;
    createdAt: string;
    isDefault?: boolean;
}

export interface TenantState {
    activeTenantId: string;
    tenants: Tenant[];
    loading: boolean;
    error: string | null;
}

const DEFAULT_TENANT_ID = 'Calculadora-de-platos-Lino';

const INITIAL_TENANTS: Tenant[] = [
    {
        id: DEFAULT_TENANT_ID,
        name: 'Calculadora-de-platos-Lino',
        companyName: 'Lino Brasserie',
        clientEmail: 'lino.brasserie@gmail.com',
        createdAt: '2026-06-01T00:00:00.000Z',
        isDefault: true
    }
];

function createTenantStore() {
    const isBrowser = typeof window !== 'undefined';
    const savedTenant = isBrowser ? localStorage.getItem('gsp_active_tenant_id') : null;
    const savedRegistry = isBrowser ? localStorage.getItem('gsp_tenants_registry') : null;

    let parsedTenants = INITIAL_TENANTS;
    if (savedRegistry) {
        try {
            parsedTenants = JSON.parse(savedRegistry);
        } catch (e) {
            console.warn('[TenantStore] Error parseando registro local:', e);
        }
    }

    const { subscribe, set, update } = writable<TenantState>({
        activeTenantId: savedTenant || DEFAULT_TENANT_ID,
        tenants: parsedTenants,
        loading: false,
        error: null
    });

    let firestoreUnsubscribe: Unsubscribe | null = null;

    return {
        subscribe,

        findTenantByEmail(email: string): Tenant | null {
            if (!email) return null;
            const current = get({ subscribe });
            const target = email.toLowerCase().trim();
            return current.tenants.find(t => (t.clientEmail || '').toLowerCase().trim() === target) || null;
        },

        async selectTenant(tenantId: string) {
            const current = get({ subscribe });
            const target = current.tenants.find(t => t.id === tenantId);
            if (!target) {
                console.error(`[TenantStore] Tenant ${tenantId} no existe.`);
                return;
            }

            if (isBrowser) {
                localStorage.setItem('gsp_active_tenant_id', tenantId);
            }

            update(s => ({ ...s, activeTenantId: tenantId }));
            this.listenToTenantData(tenantId);
        },

        async createTenant(tenantId: string, companyName: string, clientEmail: string = '') {
            const cleanId = tenantId.trim().startsWith('Calculadora-de-platos-') 
                ? tenantId.trim() 
                : `Calculadora-de-platos-${tenantId.trim()}`;

            const newTenant: Tenant = {
                id: cleanId,
                name: cleanId,
                companyName: companyName.trim() || cleanId,
                clientEmail: clientEmail.trim().toLowerCase(),
                createdAt: new Date().toISOString()
            };

            update(s => {
                const updatedTenants = [...s.tenants, newTenant];
                if (isBrowser) {
                    localStorage.setItem('gsp_tenants_registry', JSON.stringify(updatedTenants));
                }
                return { ...s, tenants: updatedTenants };
            });

            // Inicializar documento limpio con 0 datos en Firestore
            try {
                const tenantDocRef = doc(db, 'tenants', cleanId);
                await setDoc(tenantDocRef, {
                    tenantId: cleanId,
                    companyName: newTenant.companyName,
                    clientEmail: newTenant.clientEmail,
                    createdAt: newTenant.createdAt,
                    chef: {
                        pantry: [],
                        recipes: [],
                        expenses: [],
                        salesZ: [],
                        categories: ['Carnes', 'Pescados', 'Verduras', 'Lácteos', 'Bebidas', 'Secos']
                    },
                    schedule: {
                        staff: [],
                        shiftsList: []
                    }
                });
            } catch (err) {
                console.warn('[TenantStore] Aviso guardando en Firestore:', err);
            }

            await this.selectTenant(cleanId);
            return newTenant;
        },

        listenToTenantData(tenantId: string, onDataChanged?: (data: any) => void) {
            if (firestoreUnsubscribe) {
                firestoreUnsubscribe();
                firestoreUnsubscribe = null;
            }

            try {
                const docRef = doc(db, 'tenants', tenantId);
                firestoreUnsubscribe = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        if (onDataChanged) onDataChanged(data);
                    }
                }, (err) => {
                    console.warn(`[TenantStore] Error en suscripción a tenants/${tenantId}:`, err);
                });
            } catch (err) {
                console.warn('[TenantStore] Error configurando listener de Firestore:', err);
            }
        },

        lockToTenant(tenantId: string) {
            update(s => ({ ...s, activeTenantId: tenantId }));
            if (isBrowser) {
                localStorage.setItem('gsp_active_tenant_id', tenantId);
            }
            this.listenToTenantData(tenantId);
        }
    };
}

export const tenantStore = createTenantStore();

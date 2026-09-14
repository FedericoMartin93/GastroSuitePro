<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { gmailStore } from '$lib/stores/gmailStore';
    import { authStore } from '$lib/stores/authStore';
    import { GmailClient, type GmailMessage, type GmailApiError } from '$lib/services/gmailClient';

    const dispatch = createEventDispatcher<{
        selectAttachment: { file: File };
    }>();

    let emails: GmailMessage[] = [];
    let activeEmailId: string | null = null;
    let isFetching = false;
    let activeClient: GmailClient | null = null;

    // Reactivo: si hay accessToken en gmailStore, inicializar cliente y cargar correos
    $: if ($gmailStore.accessToken) {
        activeClient = new GmailClient($gmailStore.accessToken);
        if (emails.length === 0 && !isFetching) {
            fetchLiveEmails();
        }
    } else {
        activeClient = null;
        emails = [];
    }

    async function fetchLiveEmails() {
        if (!activeClient) return;

        isFetching = true;
        gmailStore.setLoading(true);

        try {
            const list = await activeClient.getInbox('', 20);
            emails = list;
            gmailStore.setError(null);
        } catch (err: any) {
            console.error('[Mailbox] Error obteniendo correos:', err);
            if (err && err.type) {
                gmailStore.setError(err as GmailApiError);
            } else {
                gmailStore.setError({
                    type: 'UNKNOWN',
                    code: 500,
                    title: 'Error de Conexión',
                    message: err.message || 'No se pudo conectar con Gmail API'
                });
            }
        } finally {
            isFetching = false;
            gmailStore.setLoading(false);
        }
    }

    async function handleScanAttachment(msg: GmailMessage, attId: string, filename: string, mimeType: string) {
        if (!activeClient) return;

        try {
            const file = await activeClient.getAttachment(msg.id, attId, filename, mimeType);
            dispatch('selectAttachment', { file });
        } catch (err: any) {
            alert('Error descargando el adjunto: ' + err.message);
        }
    }
</script>

<div class="mailbox-panel">
    <div class="mailbox-header">
        <div class="title-group">
            <h3>📬 Bandeja de Entrada Gmail</h3>
            {#if $gmailStore.connectedEmail}
                <span class="account-pill">🟢 {$gmailStore.connectedEmail}</span>
            {/if}
        </div>

        <div class="actions-group">
            {#if !$gmailStore.accessToken}
                <button class="btn-connect" on:click={() => authStore.loginWithGoogle()}>
                    <span>🟢</span> Conectar con Google
                </button>
            {:else}
                <button class="btn-refresh" on:click={fetchLiveEmails} disabled={isFetching}>
                    <span>🔄</span> {isFetching ? 'Cargando...' : 'Refrescar'}
                </button>
                <button class="btn-disconnect" on:click={() => gmailStore.clear()}>
                    Desconectar
                </button>
            {/if}
        </div>
    </div>

    <!-- DIAGNOSTIC ERROR BANNER (403 GMAIL API DISABLED) -->
    {#if $gmailStore.syncError}
        <div class="diagnostic-card">
            <div class="diag-icon">⚠️</div>
            <div class="diag-content">
                <h4>{$gmailStore.syncError.title}</h4>
                <p>{$gmailStore.syncError.message}</p>
                {#if $gmailStore.syncError.type === 'API_DISABLED'}
                    <div class="diag-actions">
                        <a 
                            href={$gmailStore.syncError.helpUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            class="btn-cloud"
                        >
                            ⚡ Activar Gmail API en Google Cloud (1 Clic)
                        </a>
                        <button class="btn-retry" on:click={fetchLiveEmails}>
                            🔄 Ya la activé, reintentar ahora
                        </button>
                    </div>
                {:else if $gmailStore.syncError.type === 'TOKEN_EXPIRED'}
                    <button class="btn-connect" on:click={() => authStore.loginWithGoogle()}>
                        🔑 Reconectar Cuenta de Google
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    <!-- EMAIL LIST -->
    <div class="mailbox-body">
        {#if isFetching}
            <div class="empty-state">
                <div class="spinner">🔄</div>
                <p>Sincronizando correos reales de Google...</p>
            </div>
        {:else if !$gmailStore.accessToken}
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <h4>Conexión con Gmail requerida</h4>
                <p>Inicia sesión con tu cuenta de Google para leer albaranes, adjuntos y facturas automáticamente.</p>
                <button class="btn-connect" on:click={() => authStore.loginWithGoogle()}>
                    🟢 Conectar con Google / Gmail
                </button>
            </div>
        {:else if emails.length === 0}
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h4>Bandeja al día</h4>
                <p>No se encontraron correos recientes en la cuenta seleccionada.</p>
            </div>
        {:else}
            <div class="emails-list">
                {#each emails as email (email.id)}
                    <div 
                        class="email-card" 
                        class:active={activeEmailId === email.id}
                        on:click={() => activeEmailId = email.id}
                    >
                        <div class="email-card-header">
                            <strong class="sender">{email.from}</strong>
                            <span class="date">{email.date ? email.date.slice(0, 16) : ''}</span>
                        </div>
                        <div class="email-subject">{email.subject}</div>
                        <div class="email-snippet">{email.snippet}</div>

                        {#if email.hasAttachment}
                            <div class="attachments-row">
                                <span class="badge-att">📎 {email.attachments.length} adjunto(s)</span>
                                {#each email.attachments as att}
                                    <button 
                                        type="button"
                                        class="btn-scan-att"
                                        on:click|stopPropagation={() => handleScanAttachment(email, att.id, att.name, att.mimeType)}
                                    >
                                        ⚡ Escanear Albarán: {att.name}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .mailbox-panel {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 600px;
    }

    .mailbox-header {
        padding: 16px 20px;
        background: #0f172a;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }

    .title-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .title-group h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .account-pill {
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid #10b981;
        color: #a7f3d0;
        font-size: 0.78rem;
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;
    }

    .actions-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn-connect {
        background: #10b981;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .btn-refresh {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .btn-disconnect {
        background: transparent;
        color: #94a3b8;
        border: none;
        font-size: 0.78rem;
        cursor: pointer;
        text-decoration: underline;
    }

    .diagnostic-card {
        margin: 14px 20px;
        padding: 16px;
        background: #fef2f2;
        border: 1.5px solid #f87171;
        border-radius: 10px;
        display: flex;
        gap: 14px;
        align-items: flex-start;
    }

    .diag-icon {
        font-size: 1.8rem;
    }

    .diag-content h4 {
        margin: 0 0 4px 0;
        color: #dc2626;
        font-size: 0.95rem;
        font-weight: 700;
    }

    .diag-content p {
        margin: 0 0 10px 0;
        color: #475569;
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .diag-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .btn-cloud {
        background: #ea4335;
        color: #fff;
        padding: 8px 14px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.82rem;
    }

    .btn-retry {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        padding: 7px 12px;
        border-radius: 6px;
        font-size: 0.82rem;
        cursor: pointer;
        font-weight: 600;
    }

    .mailbox-body {
        flex: 1;
        overflow-y: auto;
        padding: 10px 14px;
    }

    .emails-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .email-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        background: #f8fafc;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .email-card:hover {
        border-color: #cbd5e1;
        background: #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }

    .email-card.active {
        border-color: #6366f1;
        background: #ffffff;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }

    .email-card-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 4px;
    }

    .sender {
        font-size: 0.88rem;
        color: #0f172a;
    }

    .date {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .email-subject {
        font-size: 0.88rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
    }

    .email-snippet {
        font-size: 0.8rem;
        color: #64748b;
        line-height: 1.35;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .attachments-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
    }

    .badge-att {
        font-size: 0.75rem;
        background: #e2e8f0;
        color: #334155;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
    }

    .btn-scan-att {
        background: #4f46e5;
        color: #fff;
        border: none;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 10px;
    }

    .spinner {
        font-size: 2.5rem;
        animation: spin 1.2s infinite linear;
        margin-bottom: 12px;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>

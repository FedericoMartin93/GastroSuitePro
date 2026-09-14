<script lang="ts">
    import { authStore } from '$lib/stores/authStore';
    import { tenantStore } from '$lib/stores/tenantStore';

    let showNewTenantModal = false;
    let newTenantId = '';
    let newTenantName = '';
    let newTenantEmail = '';

    function handleTenantChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        tenantStore.selectTenant(target.value);
    }

    async function handleCreateTenant() {
        if (!newTenantId.trim()) {
            alert('Introduce un ID para la nueva empresa');
            return;
        }
        await tenantStore.createTenant(newTenantId, newTenantName, newTenantEmail);
        showNewTenantModal = false;
        newTenantId = '';
        newTenantName = '';
        newTenantEmail = '';
    }
</script>

<!-- SUPER ADMIN MULTI-TENANT BAR (Visible solo para fefomartin00@gmail.com) -->
{#if $authStore.role === 'super_admin'}
    <div class="super-admin-bar">
        <div class="bar-left">
            <span class="badge-super">👑 SUPER ADMIN</span>
            <span class="user-email">{$authStore.user?.email || 'fefomartin00@gmail.com'}</span>
            <span class="divider">|</span>
            <label for="tenantSelect" class="tenant-label">🏢 Base de Datos / Empresa:</label>
            <select 
                id="tenantSelect" 
                value={$tenantStore.activeTenantId} 
                on:change={handleTenantChange}
                class="tenant-select"
            >
                {#each $tenantStore.tenants as t (t.id)}
                    <option value={t.id}>{t.name || t.id} ({t.companyName || 'Empresa'})</option>
                {/each}
            </select>
        </div>

        <div class="bar-right">
            <button class="btn-new-tenant" on:click={() => showNewTenantModal = true}>
                <span>➕</span> <strong>Nueva Empresa (0 Datos)</strong>
            </button>
        </div>
    </div>
{/if}

<!-- MASTER APPLICATION HEADER -->
<header class="master-header">
    <div class="brand">
        <span class="logo">🍳</span>
        <div class="brand-text">
            <h1>Gastro<span>Suite</span>Pro <span class="badge">SvelteKit v2.0</span></h1>
            <p class="subtitle">Gestión Gastronómica Multi-Tenant con Gmail API y OCR</p>
        </div>
    </div>

    <div class="header-user">
        {#if $authStore.user}
            <div class="user-pill">
                <span class="role-tag">
                    {$authStore.role === 'super_admin' ? '👑 SUPER ADMIN' : '🏢 ' + $tenantStore.activeTenantId}
                </span>
                <span class="user-name">{$authStore.user.displayName || $authStore.user.email}</span>
                <button class="btn-logout" on:click={() => authStore.logout()}>Salir</button>
            </div>
        {:else}
            <button class="btn-login" on:click={() => authStore.loginWithGoogle()}>
                <span>🟢</span> Iniciar con Google
            </button>
        {/if}
    </div>
</header>

<!-- MAIN APP BODY -->
<main class="main-content">
    <slot />
</main>

<!-- MODAL CREACIÓN NUEVA EMPRESA -->
{#if showNewTenantModal}
    <div class="modal-backdrop" on:click={() => showNewTenantModal = false}>
        <div class="modal-dialog" on:click|stopPropagation>
            <div class="modal-header">
                <h3>🏢 Replicar Sistema: Nueva Empresa (0 Datos)</h3>
                <button class="btn-close" on:click={() => showNewTenantModal = false}>✕</button>
            </div>
            <div class="modal-body">
                <p class="modal-intro">
                    Crea una nueva base de datos totalmente independiente con <strong>CERO datos</strong> (limpia para un nuevo restaurante cliente).
                </p>

                <div class="form-group">
                    <label for="tenantIdIn">ID de la Empresa (único):</label>
                    <input 
                        id="tenantIdIn"
                        type="text" 
                        bind:value={newTenantId} 
                        placeholder="ej: Calculadora-de-platos-Bistro"
                    />
                </div>

                <div class="form-group">
                    <label for="tenantNameIn">Nombre Comercial del Restaurante:</label>
                    <input 
                        id="tenantNameIn"
                        type="text" 
                        bind:value={newTenantName} 
                        placeholder="ej: Bistro Central Madrid"
                    />
                </div>

                <div class="form-group">
                    <label for="tenantEmailIn">Correo Exclusivo del Cliente (Opcional):</label>
                    <input 
                        id="tenantEmailIn"
                        type="email" 
                        bind:value={newTenantEmail} 
                        placeholder="ej: contacto@bistrocentral.com"
                    />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" on:click={() => showNewTenantModal = false}>Cancelar</button>
                <button class="btn-confirm" on:click={handleCreateTenant}>
                    🚀 Crear y Conmutar a Empresa
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background: #f8fafc;
        color: #0f172a;
    }

    :global(*, *::before, *::after) {
        box-sizing: border-box;
    }

    .super-admin-bar {
        background: linear-gradient(90deg, #1e1b4b 0%, #312e81 100%);
        color: #fff;
        padding: 8px 24px;
        border-bottom: 2px solid #6366f1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        flex-wrap: wrap;
        gap: 10px;
    }

    .bar-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .badge-super {
        background: rgba(99, 102, 241, 0.3);
        border: 1px solid #818cf8;
        color: #e0e7ff;
        padding: 3px 8px;
        border-radius: 20px;
        font-weight: 800;
        font-size: 0.72rem;
    }

    .user-email {
        color: #c7d2fe;
    }

    .divider {
        color: #6366f1;
        opacity: 0.6;
    }

    .tenant-label {
        font-weight: 700;
        color: #e0e7ff;
    }

    .tenant-select {
        background: #0f172a;
        color: #fff;
        border: 1.5px solid #818cf8;
        border-radius: 6px;
        padding: 4px 10px;
        font-weight: 700;
        cursor: pointer;
    }

    .btn-new-tenant {
        background: #4f46e5;
        border: 1px solid #818cf8;
        color: #fff;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .master-header {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 14px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .logo {
        font-size: 2.2rem;
    }

    .brand-text h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f172a;
    }

    .brand-text h1 span {
        color: #4f46e5;
    }

    .badge {
        font-size: 0.65rem;
        background: #e0e7ff;
        color: #4338ca;
        padding: 2px 6px;
        border-radius: 4px;
        vertical-align: middle;
    }

    .subtitle {
        margin: 2px 0 0 0;
        font-size: 0.78rem;
        color: #64748b;
    }

    .user-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f1f5f9;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.85rem;
    }

    .role-tag {
        background: #065f46;
        color: #a7f3d0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.72rem;
        font-weight: 700;
    }

    .btn-logout {
        background: transparent;
        border: none;
        color: #ef4444;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .btn-login {
        background: #10b981;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .main-content {
        max-width: 1300px;
        margin: 24px auto;
        padding: 0 20px;
    }

    /* MODAL */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
    }

    .modal-dialog {
        background: #ffffff;
        border-radius: 14px;
        width: 100%;
        max-width: 520px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }

    .modal-header {
        background: #1e1b4b;
        color: #fff;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
    }

    .btn-close {
        background: none;
        border: none;
        color: #cbd5e1;
        font-size: 1.3rem;
        cursor: pointer;
    }

    .modal-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .modal-intro {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0;
    }

    .form-group label {
        display: block;
        font-size: 0.82rem;
        font-weight: 700;
        margin-bottom: 5px;
    }

    .form-group input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .modal-footer {
        padding: 14px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .btn-cancel {
        background: none;
        border: 1px solid #cbd5e1;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
    }

    .btn-confirm {
        background: #4f46e5;
        color: #fff;
        border: none;
        padding: 8px 18px;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
    }
</style>

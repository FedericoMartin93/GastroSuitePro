<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { tenantStore } from '$lib/stores/tenantStore';
    import { documentParser, type ParsedDocumentResult } from '$lib/legacy/documentParser';
    import { db } from '$lib/firebase/client';
    import { doc, setDoc, arrayUnion } from 'firebase/firestore';

    const dispatch = createEventDispatcher<{
        processing: { file: File };
        success: { result: ParsedDocumentResult; tenantId: string };
        error: { message: string };
    }>();

    export let acceptedFormats: string = '.pdf,image/png,image/jpeg,image/webp,text/plain';

    let isDragging = false;
    let isProcessing = false;
    let currentFileName = '';
    let statusMessage = '';
    let errorMessage: string | null = null;
    let fileInputElement: HTMLInputElement;

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        errorMessage = null;

        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            await processIncomingFile(file);
        }
    }

    function handleManualSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            processIncomingFile(target.files[0]);
        }
    }

    /**
     * FUNCIÓN PRINCIPAL EXPORTADA:
     * Puede invocarse tanto desde el Drop del usuario como programáticamente
     * al pulsar "Escanear Factura" desde el visor de Gmail Mailbox.
     */
    export async function processIncomingFile(file: File) {
        if (!file) return;

        isProcessing = true;
        currentFileName = file.name;
        statusMessage = `Analizando documento con OCR y PDF.js: ${file.name}...`;
        errorMessage = null;

        dispatch('processing', { file });

        try {
            // 1. LLAMADA AL MOTOR HEREDADO DE OCR / PDF.JS
            const parsedData = await documentParser.processRealFile(file);

            statusMessage = 'Reconciliando con inventario y guardando en Firestore...';

            // 2. ESCRITURA AISLADA EN EL TENANT ACTIVO EN FIRESTORE
            const activeTenantId = $tenantStore.activeTenantId;
            try {
                const tenantRef = doc(db, 'tenants', activeTenantId);
                await setDoc(tenantRef, {
                    chef: {
                        expenses: arrayUnion({
                            id: Date.now(),
                            invoiceNumber: parsedData.invoiceNumber,
                            supplierName: parsedData.supplierName,
                            totalAmount: parsedData.totalAmount,
                            itemsCount: parsedData.items.length,
                            createdAt: new Date().toISOString()
                        })
                    }
                }, { merge: true });
            } catch (fsErr) {
                console.warn('[Dropzone] Aviso al guardar en Firestore (continuando localmente):', fsErr);
            }

            statusMessage = `✅ Albarán ${parsedData.invoiceNumber} procesado en ${activeTenantId}`;
            dispatch('success', { result: parsedData, tenantId: activeTenantId });

        } catch (err: any) {
            console.error('[Dropzone OCR Error]:', err);
            errorMessage = err.message || 'Error al procesar el documento.';
            dispatch('error', { message: errorMessage });
        } finally {
            isProcessing = false;
        }
    }
</script>

<div 
    class="dropzone-container"
    class:dragging={isDragging}
    class:processing={isProcessing}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="region"
    aria-label="Zona de arrastre de facturas y albaranes"
>
    <input 
        type="file" 
        bind:this={fileInputElement} 
        on:change={handleManualSelect} 
        accept={acceptedFormats}
        style="display: none;" 
    />

    {#if isProcessing}
        <div class="state-box">
            <div class="spinner">🔄</div>
            <h4>Procesando Documento</h4>
            <p class="filename">{currentFileName}</p>
            <p class="status">{statusMessage}</p>
            <div class="progress-bar-indeterminate"></div>
        </div>
    {:else}
        <div 
            class="state-box" 
            on:click={() => fileInputElement.click()} 
            role="button" 
            tabindex="0" 
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputElement.click()}
        >
            <div class="icon-circle">
                <span>📄</span>
            </div>
            <h3>Arrastra aquí facturas o albaranes</h3>
            <p class="desc">
                Suelta archivos <strong>PDF o imágenes</strong> desde tu ordenador, o pulsa "Escanear Albarán" en los correos de Gmail.
            </p>
            <button type="button" class="btn-browse">
                Explorar Archivos Locales
            </button>
            <span class="tenant-badge">
                🏢 Destino: <strong>{$tenantStore.activeTenantId}</strong>
            </span>
        </div>
    {/if}

    {#if errorMessage}
        <div class="error-banner">
            <span>⚠️ {errorMessage}</span>
        </div>
    {/if}
</div>

<style>
    .dropzone-container {
        border: 2px dashed #cbd5e1;
        border-radius: 14px;
        background: #f8fafc;
        padding: 32px 20px;
        text-align: center;
        transition: all 0.2s ease-in-out;
        position: relative;
        cursor: pointer;
    }

    .dropzone-container.dragging {
        border-color: #4f46e5;
        background: rgba(79, 70, 229, 0.05);
        transform: scale(1.01);
    }

    .dropzone-container.processing {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.03);
        cursor: wait;
    }

    .state-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .icon-circle {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(79, 70, 229, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
    }

    h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #0f172a;
        font-weight: 700;
    }

    .desc {
        margin: 0;
        font-size: 0.83rem;
        color: #64748b;
        max-width: 440px;
        line-height: 1.4;
    }

    .filename {
        font-weight: 700;
        color: #0f172a;
        margin: 2px 0 0 0;
        font-size: 0.9rem;
    }

    .status {
        color: #4338ca;
        font-size: 0.82rem;
        margin: 0;
    }

    .btn-browse {
        background: #4f46e5;
        color: #fff;
        border: none;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.82rem;
        margin-top: 4px;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }

    .tenant-badge {
        font-size: 0.75rem;
        color: #4338ca;
        background: #e0e7ff;
        padding: 4px 10px;
        border-radius: 20px;
        margin-top: 6px;
    }

    .spinner {
        font-size: 2.2rem;
        animation: spin 1.2s infinite linear;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .progress-bar-indeterminate {
        width: 180px;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
        position: relative;
        margin-top: 8px;
    }

    .progress-bar-indeterminate::after {
        content: '';
        position: absolute;
        width: 40%;
        height: 100%;
        background: #10b981;
        animation: move 1.5s infinite ease-in-out;
    }

    @keyframes move {
        0% { left: -40%; }
        100% { left: 100%; }
    }

    .error-banner {
        margin-top: 14px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.82rem;
    }
</style>

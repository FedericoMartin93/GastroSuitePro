<script lang="ts">
    import Dropzone from '$components/Dropzone.svelte';
    import Mailbox from '$components/Mailbox.svelte';
    import { tenantStore } from '$lib/stores/tenantStore';
    import type { ParsedDocumentResult } from '$lib/legacy/documentParser';

    let dropzoneRef: Dropzone;
    let lastScanResult: ParsedDocumentResult | null = null;
    let scannedTenant = '';

    function handleAttachmentFromMailbox(e: CustomEvent<{ file: File }>) {
        const file = e.detail.file;
        if (dropzoneRef) {
            dropzoneRef.processIncomingFile(file);
        }
    }

    function handleOcrSuccess(e: CustomEvent<{ result: ParsedDocumentResult; tenantId: string }>) {
        lastScanResult = e.detail.result;
        scannedTenant = e.detail.tenantId;
    }
</script>

<div class="page-container">
    <div class="intro-card">
        <h2>⚡ Centro de Recepción: Gmail API + OCR Inteligente</h2>
        <p>
            Arrastra facturas o albaranes desde tu ordenador, o selecciona adjuntos directamente desde el buzón de Gmail.
            Los documentos se procesan en el cliente mediante PDF.js y se guardan automáticamente en la base de datos de 
            <strong>{$tenantStore.activeTenantId}</strong>.
        </p>
    </div>

    <!-- MAIN TWO-COLUMN WORKSPACE -->
    <div class="workspace-grid">
        <!-- COL 1: MAILBOX GMAIL API -->
        <div class="col-mailbox">
            <Mailbox on:selectAttachment={handleAttachmentFromMailbox} />
        </div>

        <!-- COL 2: DROPZONE & REALTIME OCR RECONCILIATION -->
        <div class="col-scanner">
            <Dropzone 
                bind:this={dropzoneRef} 
                on:success={handleOcrSuccess} 
            />

            {#if lastScanResult}
                <div class="scan-result-card">
                    <div class="result-header">
                        <h4>✅ Documento Reconciliado con Éxito</h4>
                        <span class="tenant-tag">🏢 Guardado en: {scannedTenant}</span>
                    </div>

                    <div class="result-details">
                        <div class="detail-item">
                            <span class="label">Proveedor:</span>
                            <strong>{lastScanResult.supplierName}</strong>
                        </div>
                        <div class="detail-item">
                            <span class="label">Nº Albarán/Factura:</span>
                            <strong>{lastScanResult.invoiceNumber}</strong>
                        </div>
                        <div class="detail-item">
                            <span class="label">Fecha:</span>
                            <strong>{lastScanResult.date}</strong>
                        </div>
                        <div class="detail-item total">
                            <span class="label">Importe Total:</span>
                            <strong>{lastScanResult.totalAmount.toFixed(2)} €</strong>
                        </div>
                    </div>

                    {#if lastScanResult.items && lastScanResult.items.length > 0}
                        <h5 style="margin: 14px 0 6px 0;">Artículos Detectados ({lastScanResult.items.length}):</h5>
                        <div class="items-table-wrapper">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Artículo</th>
                                        <th>Cantidad</th>
                                        <th>Precio Ud.</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each lastScanResult.items as item}
                                        <tr>
                                            <td>{item.rawName}</td>
                                            <td>{item.quantity} {item.unit}</td>
                                            <td>{item.unitPrice.toFixed(2)} €</td>
                                            <td>{item.totalPrice.toFixed(2)} €</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .page-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .intro-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 18px 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .intro-card h2 {
        margin: 0 0 6px 0;
        font-size: 1.25rem;
        color: #0f172a;
    }

    .intro-card p {
        margin: 0;
        font-size: 0.88rem;
        color: #64748b;
        line-height: 1.5;
    }

    .workspace-grid {
        display: grid;
        grid-template-columns: 1fr 1.15fr;
        gap: 24px;
        align-items: start;
    }

    @media (max-width: 900px) {
        .workspace-grid {
            grid-template-columns: 1fr;
        }
    }

    .col-scanner {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .scan-result-card {
        background: #ffffff;
        border: 1.5px solid #10b981;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    }

    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 10px;
        flex-wrap: wrap;
        gap: 8px;
    }

    .result-header h4 {
        margin: 0;
        color: #065f46;
        font-size: 1.05rem;
    }

    .tenant-tag {
        background: #ecfdf5;
        border: 1px solid #10b981;
        color: #065f46;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
    }

    .result-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.85rem;
    }

    .detail-item .label {
        font-size: 0.75rem;
        color: #64748b;
    }

    .detail-item.total strong {
        color: #059669;
        font-size: 1.05rem;
    }

    .items-table-wrapper {
        max-height: 220px;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
    }

    .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
    }

    .items-table th {
        background: #f1f5f9;
        padding: 8px 12px;
        text-align: left;
        font-weight: 700;
        color: #334155;
        position: sticky;
        top: 0;
    }

    .items-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #f1f5f9;
    }

    .items-table tr:hover {
        background: #f8fafc;
    }
</style>

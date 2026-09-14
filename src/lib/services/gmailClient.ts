export interface GmailAttachmentMeta {
    id: string;
    name: string;
    mimeType: string;
    size: number;
}

export interface GmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    internalDate: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    hasAttachment: boolean;
    attachments: GmailAttachmentMeta[];
    bodyText?: string;
    bodyHtml?: string;
}

export interface GmailThread {
    id: string;
    historyId: string;
    messages: GmailMessage[];
}

export interface GmailApiError {
    type: 'API_DISABLED' | 'TOKEN_EXPIRED' | 'NETWORK' | 'UNKNOWN';
    code: number;
    message: string;
    helpUrl?: string;
}

export class GmailClient {
    private readonly baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me';

    constructor(private accessToken: string) {
        if (!accessToken) {
            throw new Error('[GmailClient] Se requiere un accessToken válido.');
        }
    }

    private get headers(): HeadersInit {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
        };
    }

    /**
     * Decodifica cadenas Base64URL devueltas por la API de Gmail a binario Uint8Array
     */
    private base64UrlToUint8Array(base64UrlData: string): Uint8Array {
        let base64 = base64UrlData.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) {
            base64 += '='.repeat(4 - pad);
        }
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    private extractHeader(headers: Array<{ name: string; value: string }>, name: string): string {
        const found = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
        return found ? found.value : '';
    }

    /**
     * Consulta la bandeja de entrada (inbox)
     */
    async getInbox(query: string = '', maxResults: number = 20): Promise<GmailMessage[]> {
        const params = new URLSearchParams({
            maxResults: maxResults.toString(),
            ...(query ? { q: query } : {})
        });

        const res = await fetch(`${this.baseUrl}/messages?${params.toString()}`, {
            headers: this.headers
        });

        if (!res.ok) {
            await this.handleError(res);
        }

        const data = await res.json();
        const refs: Array<{ id: string }> = data.messages || [];

        if (refs.length === 0) return [];

        const promises = refs.slice(0, 15).map(m => this.getMessage(m.id).catch(() => null));
        const messages = (await Promise.all(promises)).filter(Boolean) as GmailMessage[];

        return messages;
    }

    /**
     * Obtiene el mensaje completo con detalles y partes MIME
     */
    async getMessage(id: string): Promise<GmailMessage> {
        const res = await fetch(`${this.baseUrl}/messages/${id}?format=full`, {
            headers: this.headers
        });

        if (!res.ok) {
            await this.handleError(res);
        }

        const msg = await res.json();
        const payload = msg.payload || {};
        const headers = payload.headers || [];

        const subject = this.extractHeader(headers, 'Subject') || '(Sin Asunto)';
        const from = this.extractHeader(headers, 'From') || 'Desconocido';
        const to = this.extractHeader(headers, 'To') || '';
        const date = this.extractHeader(headers, 'Date') || '';

        const attachments: GmailAttachmentMeta[] = [];

        const scanParts = (parts: any[]) => {
            if (!parts || !Array.isArray(parts)) return;
            for (const part of parts) {
                if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
                    attachments.push({
                        id: part.body.attachmentId,
                        name: part.filename,
                        mimeType: part.mimeType || 'application/octet-stream',
                        size: part.body.size || 0
                    });
                }
                if (part.parts) scanParts(part.parts);
            }
        };

        if (payload.parts) {
            scanParts(payload.parts);
        } else if (payload.filename && payload.body?.attachmentId) {
            attachments.push({
                id: payload.body.attachmentId,
                name: payload.filename,
                mimeType: payload.mimeType,
                size: payload.body.size || 0
            });
        }

        return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: msg.snippet || '',
            internalDate: msg.internalDate,
            from,
            to,
            subject,
            date,
            hasAttachment: attachments.length > 0,
            attachments
        };
    }

    /**
     * Descarga el adjunto real y lo convierte a una instancia de File lista para OCR
     */
    async getAttachment(
        messageId: string, 
        attachmentId: string, 
        filename: string, 
        mimeType: string = 'application/pdf'
    ): Promise<File> {
        const url = `${this.baseUrl}/messages/${messageId}/attachments/${attachmentId}`;
        const res = await fetch(url, { headers: this.headers });

        if (!res.ok) {
            await this.handleError(res);
        }

        const data = await res.json();
        if (!data.data) {
            throw new Error('[GmailClient] Adjunto sin datos binarios recibidos.');
        }

        const bytes = this.base64UrlToUint8Array(data.data);
        return new File([bytes], filename, { type: mimeType });
    }

    /**
     * Gestión centralizada de errores (HTTP 403 API disabled / 401 token expired)
     */
    private async handleError(res: Response): Promise<never> {
        let errData: any = {};
        try {
            errData = await res.json();
        } catch (_) {}

        const msg = errData?.error?.message || `HTTP ${res.status} ${res.statusText}`;

        if (res.status === 403 || msg.includes('has not been used') || msg.includes('disabled')) {
            const apiError: GmailApiError = {
                type: 'API_DISABLED',
                code: 403,
                message: 'La API de Gmail está deshabilitada en tu proyecto de Google Cloud (calculadora-de-platos).',
                helpUrl: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=calculadora-de-platos'
            };
            throw apiError;
        }

        if (res.status === 401) {
            const apiError: GmailApiError = {
                type: 'TOKEN_EXPIRED',
                code: 401,
                message: 'El token de acceso de Google ha expirado o no es válido.'
            };
            throw apiError;
        }

        throw new Error(`[GmailClient] Error: ${msg}`);
    }
}

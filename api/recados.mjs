import { BlobPreconditionFailedError, get, head, put } from '@vercel/blob';

const path = 'recados.json';
const maxRequestBytes = 4096;
const pageSize = 5;
const legacyPageSize = 100;
const postsPerMinute = 12;
const minute = 60_000;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function json(body, status = 200, headers = {}) {
    return Response.json(body, {
        status,
        headers: { 'Cache-Control': 'no-store', ...headers },
    });
}

async function readBook() {
    const saved = await get(path, { access: 'private', useCache: false });
    if (!saved) return { entries: [], etag: null };

    const entries = await new Response(saved.stream).json();
    if (!Array.isArray(entries) || !saved.blob.etag) {
        throw new Error('Formato de armazenamento inválido.');
    }
    return { entries, etag: saved.blob.etag };
}

function showEntries(entries, requestedPage, status) {
    if (requestedPage === null) return json({ entries: entries.slice(0, legacyPageSize) }, status);

    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * pageSize;
    return json({ entries: entries.slice(start, start + pageSize), page, totalPages }, status);
}

async function readEntry(request) {
    if (Number(request.headers.get('content-length')) > maxRequestBytes) return 413;
    const body = await request.arrayBuffer();
    if (body.byteLength > maxRequestBytes) return 413;

    try {
        const data = JSON.parse(new TextDecoder().decode(body));
        const nick = typeof data?.nick === 'string' ? data.nick.trim() : '';
        const message = typeof data?.message === 'string' ? data.message.trim() : '';
        if (!nick || nick.length > 30 || !message || message.length > 300 ||
            typeof data?.id !== 'string' || !uuid.test(data.id)) return 400;

        return { id: data.id.toLowerCase(), nick, message, createdAt: new Date().toISOString() };
    } catch {
        return 400;
    }
}

async function publish(entry, page) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const { entries, etag } = await readBook();
        const previous = entries.find(({ id }) => id === entry.id);
        if (previous) {
            if (previous.nick === entry.nick && previous.message === entry.message) return showEntries(entries, page);
            return json({ error: 'esse envio já foi usado. recarregue a página e tente de novo.' }, 409);
        }

        const cutoff = Date.now() - minute;
        if (entries.filter(({ createdAt }) => Date.parse(createdAt) > cutoff).length >= postsPerMinute) {
            return json({ error: 'muitos recados agora. tenta de novo daqui a um minuto.' }, 429, { 'Retry-After': '60' });
        }

        let writeEtag = etag;
        if (etag?.startsWith('W/')) {
            // The CDN can return a weak ETag for the compressed response.
            const { etag: currentEtag } = await head(path);
            if (currentEtag !== etag.slice(2)) continue;
            writeEtag = currentEtag;
        }

        const updated = [entry, ...entries];
        try {
            await put(path, JSON.stringify(updated), {
                access: 'private',
                contentType: 'application/json',
                ...(etag ? { allowOverwrite: true, ifMatch: writeEtag } : { allowOverwrite: false }),
            });
            return showEntries(updated, page, 201);
        } catch (error) {
            // The first write can also race while no ETag exists yet.
            if (error instanceof BlobPreconditionFailedError || (!etag && /already exists/i.test(error.message))) continue;
            throw error;
        }
    }

    return json({ error: 'o livro está ocupado. tenta de novo em instantes.' }, 503);
}

export default {
    async fetch(request) {
        if (request.method !== 'GET' && request.method !== 'POST') {
            return json({ error: 'método inválido.' }, 405, { Allow: 'GET, POST' });
        }

        const url = new URL(request.url);
        const rawPage = url.searchParams.get('pagina');
        const page = rawPage === null ? null : Number(rawPage);
        if (rawPage !== null && (!/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(page))) {
            return json({ error: 'página inválida.' }, 400);
        }

        try {
            if (request.method === 'GET') return showEntries((await readBook()).entries, page);

            const origin = request.headers.get('origin');
            if (request.headers.get('sec-fetch-site') === 'cross-site' ||
                (origin && origin !== url.origin)) {
                return json({ error: 'envie o recado pelo site.' }, 403);
            }
            if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
                return json({ error: 'formato de envio inválido.' }, 415);
            }
            const entry = await readEntry(request);
            if (entry === 413) return json({ error: 'o recado é grande demais.' }, 413);
            if (entry === 400) return json({ error: 'preenche o nick e um recado de até 300 caracteres.' }, 400);
            return await publish(entry, page === null ? null : 1);
        } catch (error) {
            console.error('Falha no livro de visitas:', error.name);
            return json({ error: 'o livro de visitas está indisponível agora. tenta de novo em instantes.' }, 503);
        }
    },
};

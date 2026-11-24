/* New pronunciation logic is compiled inline by sync-pronunciation.mjs. */
(() => {
    'use strict';
    const KEY = 'spansk123_pronunciation_v1';
    const emptyProgress = () => ({ schemaVersion: 1, catalogVersion: 1, practiced: [] });
    const fail = message => { throw new Error(message); };
    const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
        && Object.keys(object).length === keys.length && Object.keys(object).every(key => keys.includes(key));
    const version = value => Number.isInteger(value) && value >= 1 && value <= 1000000;
    function validateProgress(value) {
        if (!exactKeys(value, ['schemaVersion', 'catalogVersion', 'practiced']) || value.schemaVersion !== 1) fail('Ukjent format for uttaleøving. Behold originalfilen.');
        if (new TextEncoder().encode(JSON.stringify(value)).length > 65536 || !version(value.catalogVersion)
            || !Array.isArray(value.practiced) || value.practiced.length > 155) fail('Uttalefilen er for stor eller har ugyldige felt. Behold originalfilen.');
        const versions = new Map();
        const practiced = value.practiced.map(item => {
            if (!exactKeys(item, ['itemId', 'contentVersion', 'practicedOn']) || typeof item.itemId !== 'string' || !/^refold-es-(0[1-9]|[12]\d|3[01])$/.test(item.itemId)
                || !version(item.contentVersion) || typeof item.practicedOn !== 'string'
                || !/^(20\d\d|2100)-\d{2}-\d{2}$/.test(item.practicedOn)) fail('Ugyldig uttaleøving. Behold originalfilen.');
            const date = new Date(item.practicedOn + 'T12:00:00Z');
            if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== item.practicedOn) fail('Ugyldig dato for uttaleøving.');
            const seen = versions.get(item.itemId) || new Set(); seen.add(item.contentVersion); versions.set(item.itemId, seen);
            if (seen.size > 5) fail('For mange innholdsversjoner. Eksporter før du rydder uttaleøving.');
            return { itemId: item.itemId, contentVersion: item.contentVersion, practicedOn: item.practicedOn };
        });
        return { schemaVersion: 1, catalogVersion: value.catalogVersion, practiced };
    }
    function mergeProgress(current, incoming) {
        const first = validateProgress(current), second = validateProgress(incoming), merged = new Map();
        for (const item of [...first.practiced, ...second.practiced]) {
            const id = item.itemId + ':' + item.contentVersion;
            if (!merged.has(id) || merged.get(id).practicedOn < item.practicedOn) merged.set(id, item);
        }
        return validateProgress({ schemaVersion: 1, catalogVersion: Math.max(first.catalogVersion, second.catalogVersion), practiced: [...merged.values()].sort((a, b) => a.itemId.localeCompare(b.itemId) || a.contentVersion - b.contentVersion) });
    }
    function selectSession(group, items, progress) {
        const selected = group.itemIds.map(id => items.find(item => item.id === id)).filter(Boolean);
        const date = item => progress.practiced.find(p => p.itemId === item.id && p.contentVersion === item.contentVersion)?.practicedOn;
        const fresh = selected.filter(item => !date(item));
        const review = selected.filter(item => date(item)).sort((a, b) => date(a).localeCompare(date(b)));
        return review.length && fresh.length ? [...fresh.slice(0, 2), ...review.slice(0, 3 - Math.min(2, fresh.length))] : [...fresh, ...review].slice(0, 3);
    }
    globalThis.PronunciationCore = { KEY, emptyProgress, validateProgress, mergeProgress, selectSession };
})();

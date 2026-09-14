'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { importStudents } from '../../lib/adminActions';
import { userKey } from '../../lib/constants';
import type { Season } from '../../lib/types';
import { downloadCsv, isGsuEmail } from '../../lib/utils';
import { Notice, Spinner } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AdminSection } from './AdminSection';

interface ParsedRow {
  line: number;
  name: string;
  email: string;
  problem: string | null;
  skip: boolean; // already on the rolls
}

/** CSV import: `name, email`. Students arrive unsorted — the ceremony assigns houses. */
export function StudentImport({ activeSeason, existingIds }: { activeSeason: Season | null; existingIds: Set<string> }) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<{ created: number; skipped: number; invalid: number } | null>(null);

  const clear = () => {
    setRows([]);
    setFileName(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const parseFile = (file: File) => {
    setFileName(file.name);
    setParseError(null);
    setLastResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => {
        const fields = result.meta.fields ?? [];
        const missing = ['name', 'email'].filter((f) => !fields.includes(f));
        if (missing.length) {
          setRows([]);
          setParseError(`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. The first row must be the headers: name, email.`);
          return;
        }
        const seen = new Set<string>();
        setRows(
          result.data.map((r, i) => {
            const name = (r.name ?? '').trim();
            const email = userKey(r.email ?? '');
            let problem: string | null = null;
            if (!name) problem = 'Missing name';
            else if (!email) problem = 'Missing email';
            else if (!isGsuEmail(email)) problem = 'Not a GSU email';
            else if (seen.has(email)) problem = 'Duplicate in file';
            seen.add(email);
            return { line: i + 2, name, email, problem, skip: !problem && existingIds.has(email) };
          }),
        );
      },
      error: (err) => setParseError(err.message),
    });
  };

  const ready = rows.filter((r) => !r.problem && !r.skip);
  const invalid = rows.filter((r) => r.problem);
  const skipped = rows.filter((r) => r.skip);

  const runImport = async () => {
    if (!activeSeason || ready.length === 0) return;
    setImporting(true);
    try {
      const result = await importStudents(ready, activeSeason.id, existingIds);
      setLastResult({ created: result.created, skipped: result.skipped + skipped.length, invalid: invalid.length });
      toast(`Imported ${result.created} student${result.created === 1 ? '' : 's'}. They’re ready for the sorting ceremony.`, 'success');
      clear();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminSection
      title="Import from CSV"
      description="Two columns: name, email. Everyone arrives unsorted and gets a house at the sorting ceremony."
      actions={
        <button
          type="button"
          className="btn-text"
          onClick={() => downloadCsv('leaderquest-students-template.csv', [['name', 'email'], ['Jordan Rivers', 'jrivers1@student.gsu.edu'], ['Ada Obi', 'aobi2@student.gsu.edu']])}
        >
          Download template
        </button>
      }
    >
      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-gold/30 bg-royal/40 px-4 py-7 text-center transition hover:border-gold/60"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) parseFile(file);
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16 V4 M7 9 L12 4 L17 9" />
          <path d="M4 15 V19 A1 1 0 0 0 5 20 H19 A1 1 0 0 0 20 19 V15" />
        </svg>
        <span className="mt-2 font-heading text-sm font-bold text-gold-light">{fileName ?? 'Choose a CSV file'}</span>
        <span className="mt-0.5 text-xs text-white/45">or drop it here</span>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseFile(file);
          }}
        />
      </label>

      {parseError && <Notice tone="error" className="mt-3">{parseError}</Notice>}
      {lastResult && (
        <Notice tone="success" className="mt-3">
          {lastResult.created} imported
          {lastResult.skipped > 0 && ` · ${lastResult.skipped} already on the rolls`}
          {lastResult.invalid > 0 && ` · ${lastResult.invalid} rows had errors and were skipped`}
        </Notice>
      )}

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap gap-3 text-xs">
            <span className="text-emerald-300">{ready.length} ready</span>
            {skipped.length > 0 && <span className="text-white/50">{skipped.length} already on the rolls</span>}
            {invalid.length > 0 && <span className="text-red-300">{invalid.length} with errors</span>}
          </div>
          <div className="max-h-72 overflow-auto rounded-lg border border-white/10 scroll-thin">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="sticky top-0 bg-royal-panel font-heading text-[10px] uppercase tracking-[0.14em] text-white/50">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((r) => (
                  <tr key={r.line} className={r.problem ? 'bg-red-500/[0.06]' : undefined}>
                    <td className="px-3 py-2 text-white/40">{r.line}</td>
                    <td className="px-3 py-2">{r.name || '—'}</td>
                    <td className="px-3 py-2 text-white/70">{r.email || '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.problem ? <span className="text-red-300">{r.problem}</span> : r.skip ? <span className="text-white/45">Skip — exists</span> : <span className="text-emerald-300">Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className="btn btn-gold" disabled={!activeSeason || ready.length === 0 || importing} onClick={runImport}>
              {importing && <Spinner size={14} />}
              Import {ready.length} student{ready.length === 1 ? '' : 's'}
            </button>
            <button type="button" className="btn-text" onClick={clear}>
              Clear
            </button>
          </div>
        </div>
      )}
    </AdminSection>
  );
}

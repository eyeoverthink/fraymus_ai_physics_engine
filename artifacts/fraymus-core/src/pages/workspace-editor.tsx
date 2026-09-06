import { useState, useRef, useEffect } from 'react';
import { 
  useGetFiles, 
  useGetFileContent, 
  useUpdateFileContent,
  getGetFileContentQueryKey,
  getGetWorkingFilesQueryKey,
  useCompleteWorkingFileUpload,
  downloadWorkingFile,
  useGetWorkingFiles,
  useRequestWorkingFileUploadUrl,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { FileCode, Save, FileText, Download, FolderTree, Upload, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function WorkspaceEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: files, isLoading: filesLoading } = useGetFiles();
  const { data: workingFiles } = useGetWorkingFiles();
  const requestUpload = useRequestWorkingFileUploadUrl();
  const completeUpload = useCompleteWorkingFileUpload();
  const uploadInput = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<string>('');
  
  // Guard the init effect to not overwrite user changes on refetch
  const initializedForPath = useRef<string | null>(null);

  const { data: fileData, isLoading: fileLoading } = useGetFileContent(
    { path: selectedPath || '' },
    { 
      query: { 
        enabled: !!selectedPath,
        queryKey: getGetFileContentQueryKey({ path: selectedPath || '' })
      } 
    }
  );

  const updateFile = useUpdateFileContent();
  const selectedUpload = workingFiles?.find((file) => file.id === selectedUploadId);

  useEffect(() => {
    if (fileData && selectedPath && initializedForPath.current !== selectedPath) {
      initializedForPath.current = selectedPath;
      setLocalContent(fileData.content);
    }
  }, [fileData, selectedPath]);

  const handleSelectFile = (path: string) => {
    if (selectedPath !== path) {
      setSelectedUploadId(null);
      setSelectedPath(path);
      initializedForPath.current = null;
      setLocalContent('');
    }
  };

  const mimeForFile = (file: File) => {
    if (file.type) return file.type;
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ({
      txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json',
      yaml: 'application/yaml', yml: 'application/yaml', xml: 'application/xml',
      pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      zip: 'application/zip',
    } as Record<string, string>)[extension || ''] || 'application/octet-stream';
  };

  const handleSave = () => {
    if (!selectedPath) return;
    
    updateFile.mutate(
      { data: { path: selectedPath, content: localContent } },
      {
        onSuccess: (updated) => {
          toast({
            title: 'File Saved',
            description: `Successfully updated ${selectedPath}`,
          });
          queryClient.setQueryData(getGetFileContentQueryKey({ path: selectedPath }), updated);
        },
        onError: (err) => {
          toast({
            title: 'Failed to Save',
            description: err.message,
            variant: 'destructive'
          });
        }
      }
    );
  };

  const handleExport = () => {
    if (!selectedPath || !localContent) return;
    const blob = new Blob([localContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = selectedPath.split('/').pop() || 'export.txt';
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploadingName(file.name);
    try {
      const contentType = mimeForFile(file);
      const prepared = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType },
      });
      const uploaded = await fetch(prepared.uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
      if (!uploaded.ok) throw new Error('App Storage rejected the upload');
      const completed = await completeUpload.mutateAsync({
        data: {
          objectPath: prepared.objectPath,
          name: file.name,
          size: file.size,
          contentType,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetWorkingFilesQueryKey() });
      setSelectedUploadId(completed.id);
      toast({ title: 'File stored safely', description: `${file.name} is private to your account.` });
    } catch (err) {
      toast({
        title: 'Upload rejected',
        description: err instanceof Error ? err.message : 'The file did not pass server validation.',
        variant: 'destructive',
      });
    } finally {
      setUploadingName(null);
      if (uploadInput.current) uploadInput.current.value = '';
    }
  };

  const handleStoredDownload = async (id: string, name: string) => {
    try {
      const blob = await downloadWorkingFile(id, { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'The original file could not be downloaded.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-full w-full max-w-7xl mx-auto min-h-0 bg-[#0B0B0F] gap-4">
      {/* File List */}
      <div className="w-[280px] hidden md:flex flex-col rounded-[12px] bg-[#151318] border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden shrink-0">
        <div className="h-10 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <span className="mono text-[11px] tracking-[0.08em] uppercase text-zinc-400 flex items-center gap-2">
            <FolderTree className="h-3.5 w-3.5" /> Workspace IO
          </span>
          <input
            ref={uploadInput}
            type="file"
            className="hidden"
            accept=".txt,.md,.csv,.json,.yaml,.yml,.xml,.pdf,.docx,.zip"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
            data-testid="input-working-file"
          />
          <button
            onClick={() => uploadInput.current?.click()}
            disabled={!!uploadingName}
            className="h-7 px-2 rounded-full bg-[#C2185B]/15 border border-[#C2185B]/30 text-[#F48FB1] mono text-[10px] flex items-center gap-1 disabled:opacity-50"
            data-testid="button-upload-working-file"
          >
            <Upload className="h-3 w-3" /> {uploadingName ? 'Uploading' : 'Upload'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filesLoading ? (
            <div className="space-y-2 p-2">
              <div className="h-8 w-full bg-white/[0.02] rounded animate-pulse" />
              <div className="h-8 w-full bg-white/[0.02] rounded animate-pulse" />
            </div>
          ) : files?.length === 0 ? (
            <div className="text-center py-4 mono text-[11px] text-zinc-600">Empty workspace</div>
          ) : (
            files?.map(f => (
              <button
                key={f.path}
                onClick={() => handleSelectFile(f.path)}
                className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg mono text-[11px] transition ${
                  selectedPath === f.path 
                    ? "bg-[#1C1B20] text-zinc-200 border border-white/[0.08]" 
                    : "text-zinc-400 border border-transparent hover:bg-white/[0.03]"
                }`}
                data-testid={`file-item-${f.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </div>
                <span className="text-zinc-600 shrink-0 ml-2">{(f.size / 1024).toFixed(1)}k</span>
              </button>
            ))
          )}
          {!!workingFiles?.length && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="px-2.5 pb-2 mono text-[9px] uppercase tracking-widest text-zinc-600">Private App Storage</div>
              {workingFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => { setSelectedUploadId(file.id); setSelectedPath(null); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg mono text-[11px] border ${selectedUploadId === file.id ? 'bg-[#1A2238] border-white/[0.08] text-zinc-200' : 'border-transparent text-zinc-400 hover:bg-white/[0.03]'}`}
                >
                  <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /><span className="truncate">{file.name}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col rounded-[12px] bg-[#151318] border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden min-w-0">
        <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="mono text-[12px] text-zinc-200 truncate">
              {selectedPath || selectedUpload?.name || 'No file selected'}
            </span>
            {selectedPath && localContent !== fileData?.content && (
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="mono text-[10px] text-zinc-500 hidden md:inline mr-2">
              /workspace shared
            </span>
            <button 
              onClick={handleSave}
              disabled={!selectedPath || updateFile.isPending}
              className="h-7 px-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] mono text-[11px] text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition"
              data-testid="button-save-file"
            >
              {updateFile.isPending ? <div className="h-3 w-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
            {selectedUpload && (
              <button
                onClick={() => void handleStoredDownload(selectedUpload.id, selectedUpload.name)}
                className="h-7 px-2.5 rounded-full bg-[#1A2238] border border-white/[0.08] mono text-[11px] text-zinc-300 flex items-center gap-1"
                data-testid="button-download-working-file"
              >
                <Download className="h-3 w-3" /> Original bytes
              </button>
            )}
            <button 
              onClick={handleExport}
              disabled={!selectedPath}
              className="h-7 px-2.5 rounded-full bg-[#1A2238] border border-white/[0.08] mono text-[11px] text-zinc-300 hover:bg-[#1A2238]/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition"
              data-testid="button-export-file"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>

        <div className="flex-1 flex bg-[#0B0B0F] min-h-0 overflow-hidden relative">
          {selectedUpload ? (
            <div className="absolute inset-0 overflow-y-auto p-5">
              <div className="max-w-3xl space-y-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3 mono text-[11px] text-emerald-200">
                  Original: {selectedUpload.name} · {(selectedUpload.size / 1024).toFixed(1)} KB · {selectedUpload.contentType}
                </div>
                <div>
                  <div className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                    Derived parsed content — not the original file bytes
                  </div>
                  {selectedUpload.parseStatus === 'parsed' ? (
                    <pre className="whitespace-pre-wrap break-words rounded-lg border border-white/[0.06] bg-[#151318] p-4 mono text-[11px] leading-relaxed text-zinc-300">{selectedUpload.parsedContent}</pre>
                  ) : (
                    <div className="rounded-lg border border-white/[0.06] p-4 mono text-[11px] text-zinc-500">
                      No parsed preview is available for this file type. Download the original bytes to inspect it.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : !selectedPath ? (
            <div className="absolute inset-0 flex items-center justify-center mono text-[12px] text-zinc-600">
              Select a file to view and edit its content
            </div>
          ) : fileLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-zinc-700 border-t-[#C2185B] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Line Numbers */}
              <div className="w-12 shrink-0 bg-[#151318] border-r border-white/[0.04] py-3 mono text-[11px] text-zinc-600 text-right pr-3 leading-[1.7] select-none overflow-y-hidden">
                {localContent.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea 
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent p-3 mono text-[12px] leading-[1.7] text-zinc-200 outline-none resize-none overflow-y-auto"
                data-testid="textarea-file-editor"
              />
            </>
          )}
        </div>
        
        {/* Editor Status Bar */}
        <div className="h-8 shrink-0 px-3 flex items-center justify-between border-t border-white/[0.06] bg-[#151318] mono text-[10px] text-zinc-500">
           <span>{selectedUpload ? 'PRIVATE OBJECT' : selectedPath ? selectedPath.split('.').pop()?.toUpperCase() || 'TXT' : 'IDLE'}</span>
          <span className="flex items-center gap-2">
            {selectedPath && <span className="h-1.5 w-1.5 rounded-full bg-[#C2185B] animate-pulse" />}
            {selectedPath ? 'Editing mode' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}


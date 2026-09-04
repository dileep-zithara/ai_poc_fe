import { useEffect, useState } from "react";
import { FileCheck2, FileText, UploadCloud } from "lucide-react";
import { uploadDocument, listDocuments } from "../api.js";
import PageHeader from "./PageHeader.jsx";

export default function DocumentsTab() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { refresh(); }, []);
  function refresh() { listDocuments().then(setDocs); }

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    await uploadDocument(file);
    setUploading(false);
    refresh();
  }

  async function handleUpload(e) {
    await upload(e.target.files[0]);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  }

  return (
    <div className="page documents-page">
      <PageHeader
        icon={FileText}
        title="Documents"
      />

      <label
        className={`document-dropzone${dragging ? " dragging" : ""}`}
        onDragEnter={() => setDragging(true)}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="document-upload-icon"><UploadCloud size={22} strokeWidth={1.8} /></span>
        <div className="document-dropzone-title">{uploading ? "Adding document…" : "Drop a document here"}</div>
        <div className="field-hint">or choose a .docx file from your computer</div>
        <span className="btn btn-primary btn-sm document-upload-button">Choose file</span>
        <input className="visually-hidden" type="file" accept=".docx" onChange={handleUpload} />
      </label>

      <div className="documents-list-heading">
        <div className="section-title">Knowledge base documents</div>
        {docs.length > 0 && <span className="badge badge-muted">{docs.length} document{docs.length === 1 ? "" : "s"}</span>}
      </div>
      {docs.length === 0 && (
        <div className="documents-empty-state">
          <FileText size={26} strokeWidth={1.6} />
          <strong>No documents added</strong>
          <span>Drop a .docx file here.</span>
        </div>
      )}
      {docs.map((d) => (
        <div key={d.sourceDoc} className="document-row">
          <span className="document-file-icon"><FileText size={18} strokeWidth={1.8} /></span>
          <div className="document-row-content">
            <div className="document-row-title">{d.sourceDoc}</div>
            <div className="field-hint">{d.chunkCount} chunks indexed · {d.sections.length} sections covered</div>
          </div>
          <span className="badge badge-ok"><FileCheck2 size={12} /> Ready</span>
        </div>
      ))}
    </div>
  );
}

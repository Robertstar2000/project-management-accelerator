import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { DownloadModal } from '../components/DownloadModal';
import { Document } from '../types';

const getStatusChipClass = (status) => {
    switch (status) {
        case 'Approved': return 'chip-green';
        case 'Working': return 'chip-amber';
        case 'Rejected': return 'chip-red';
        case 'Failed': return 'chip-red';
        default: return '';
    }
};

export const DocumentsView = ({ project, documents, onUpdateDocument, phasesData }) => {
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [viewingDocument, setViewingDocument] = useState<{title: string, content: string, type?: 'text' | 'image'} | null>(null);
    const [downloadingDocument, setDownloadingDocument] = useState<Document | null>(null);

    const handleViewDocument = (doc: Document) => {
        const content = phasesData[doc.id]?.content || 'This document has no content yet.';
        setViewingDocument({ title: doc.title, content, type: doc.type });
    };

    const handleUploadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        uploadInputRef.current?.click();
    };
    
    const handleDownloadSingle = (format: 'md' | 'pdf' | 'png') => {
        if (!downloadingDocument) return;
        const content = phasesData[downloadingDocument.id]?.content;
        if (!content) {
            alert("This document has no content to download.");
            return;
        }

        const sanitizedTitle = downloadingDocument.title.replace(/[\\/:"*?<>|]/g, '');
        const blob = downloadingDocument.type === 'image' 
            ? (() => {
                const base64Data = content.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: 'image/png' });
            })()
            : new Blob([content], { type: 'text/markdown' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${sanitizedTitle}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadingDocument(null);
    };

    const handleDownloadAll = async () => {
        if (!documents || documents.length === 0) {
            alert("No documents to download.");
            return;
        }

        const zip = new JSZip();

        documents.forEach(doc => {
            const content = phasesData[doc.id]?.content;
            if (content) {
                const folderName = `Phase ${doc.phase}`;
                const sanitizedTitle = doc.title.replace(/[\\/:"*?<>|]/g, '');
                
                if (doc.type === 'image') {
                    // content is base64 data URL
                    const base64Data = content.split(',')[1];
                    zip.folder(folderName).file(`${sanitizedTitle}.png`, base64Data, { base64: true });
                } else {
                    zip.folder(folderName).file(`${sanitizedTitle}.md`, content);
                }
            }
        });

        try {
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-documents.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Failed to create zip file:", error);
            alert("An error occurred while creating the zip file.");
        }
    };

    return (
        <>
            <div className="tool-card">
                <h2 className="subsection-title">Documents Center</h2>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap'}}>
                    <button className="button" onClick={handleDownloadAll} disabled={!!isGenerating}>Download All as .zip</button>
                </div>
                <table className="document-table">
                    <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Owner</th><th>Phase</th><th>Actions</th></tr></thead>
                    <tbody>
                        {documents && documents.map(doc => (
                            <tr key={doc.id}>
                                <td>{doc.title}</td>
                                <td><span className={`chip-${doc.type === 'image' ? 'purple' : 'blue'}`}>{doc.type === 'image' ? 'Artifact' : 'Document'}</span></td>
                                <td>
                                    <select 
                                        value={doc.status} 
                                        onChange={(e) => onUpdateDocument(doc.id, e.target.value)}
                                        className={`document-status-select ${getStatusChipClass(doc.status)}`}
                                        aria-label={`Status for ${doc.title}`}
                                    >
                                        <option value="Working">Working</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </td>
                                <td>{doc.owner}</td>
                                <td>{doc.phase}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="button button-small" onClick={() => handleViewDocument(doc)}>View</button>
                                        <button className="button button-small" onClick={() => setDownloadingDocument(doc)}>Download</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!documents || documents.length === 0) && (
                            <tr><td colSpan={6} style={{textAlign: 'center'}}>No documents found for this project.</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="upload-dropzone" onClick={() => uploadInputRef.current?.click()}>
                    <p>Drag & drop files to upload</p>
                    <a href="#" onClick={handleUploadClick} style={{textDecoration: 'underline', color: 'var(--accent-color)'}}>
                        Open Upload Dialogue
                    </a>
                </div>
                <input type="file" ref={uploadInputRef} style={{ display: 'none' }} multiple />
            </div>

            <DocumentViewerModal 
                isOpen={!!viewingDocument}
                onClose={() => setViewingDocument(null)}
                title={viewingDocument?.title || ''}
                content={viewingDocument?.content || ''}
                type={viewingDocument?.type}
            />

            <DownloadModal 
                isOpen={!!downloadingDocument}
                onClose={() => setDownloadingDocument(null)}
                onConfirm={handleDownloadSingle}
                title={downloadingDocument?.title || ''}
                type={downloadingDocument?.type}
            />
        </>
    );
};
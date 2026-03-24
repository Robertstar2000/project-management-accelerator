
import React, { useState, useRef, useEffect } from 'react';
import { Task, Project, User, Comment, Attachment } from '../types';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
    task: Task;
    project: Project;
    currentUser: User;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, onSave, task, currentUser }) => {
    const [currentTask, setCurrentTask] = useState<Task>(task);
    const [newComment, setNewComment] = useState('');
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentTask(task);
    }, [task]);

    if (!isOpen) return null;

    const handleFieldChange = <K extends keyof Task>(field: K, value: Task[K]) => {
        setCurrentTask(prev => ({ ...prev, [field]: value }));
    };

    const handleAddComment = () => {
        if (newComment.trim()) {
            const comment: Comment = {
                id: `comment-${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.username,
                timestamp: new Date().toISOString(),
                text: newComment,
            };
            handleFieldChange('comments', [...(currentTask.comments || []), comment]);
            setNewComment('');
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const fileData = await fileToBase64(file);
                const attachment: Attachment = {
                    id: `attachment-${Date.now()}`,
                    uploaderId: currentUser.id,
                    uploaderName: currentUser.username,
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                    fileData,
                    fileType: file.type,
                };
                handleFieldChange('attachments', [...(currentTask.attachments || []), attachment]);
            } catch (err: unknown) {
                console.error(err);
                alert("Failed to attach.");
            }
        }
    };
    
    return (
        <div className="modal-overlay" onClick={() => { onSave(currentTask); onClose(); }}>
            <div className="modal-content task-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="task-detail-header">
                    <h2>{currentTask.name}</h2>
                    <button onClick={() => { onSave(currentTask); onClose(); }} className="button-close">&times;</button>
                </div>

                <div className="task-detail-body">
                    <div className="task-detail-main">
                        <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 242, 255, 0.05)', padding: '1rem', borderRadius: '4px'}}>
                            <input type="checkbox" id="use-agent" checked={currentTask.useAgent || false} onChange={e => handleFieldChange('useAgent', e.target.checked)} />
                            <label htmlFor="use-agent" style={{margin: 0}}>Enable AI Agent for this Task (Planner/Doer/QA Workflow)</label>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={currentTask.description || ''} onChange={e => handleFieldChange('description', e.target.value)} rows={4} />
                        </div>
                        
                         <div className="form-group">
                            <label>Recurrence</label>
                            <select value={currentTask.recurrence?.interval || 'none'} onChange={e => handleFieldChange('recurrence', { interval: e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' })}>
                                <option value="none">None</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div className="comments-section">
                            <h3>Updates & Progress</h3>
                            <div className="comment-list">
                                {(currentTask.comments || []).map(comment => (
                                    <div key={comment.id} className="comment">
                                        <div className="comment-author">{comment.authorName}</div>
                                        <div className="comment-text">{comment.text}</div>
                                        <div className="comment-timestamp">{new Date(comment.timestamp).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="comment-form">
                                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share progress or tag team members..." rows={3} />
                                <button onClick={handleAddComment} className="button button-primary">Post Update</button>
                            </div>
                        </div>
                    </div>

                    <div className="task-detail-sidebar">
                        <h4>Task Metadata</h4>
                        <div className="detail-item"><span>Status</span><span>{currentTask.status}</span></div>
                        <div className="detail-item"><span>Role</span><span>{currentTask.role || 'Unassigned'}</span></div>
                        <div className="detail-item"><span>Due Date</span><span>{currentTask.endDate}</span></div>
                        <div className="detail-item"><span>Subcontracted</span><span>{currentTask.isSubcontracted ? 'Yes' : 'No'}</span></div>
                        
                        <div className="attachments-section" style={{marginTop: '2rem'}}>
                            <h4>Attachments</h4>
                            <ul className="attachment-list">
                                {(currentTask.attachments || []).map(att => (
                                    <li key={att.id}><a href={att.fileData} download={att.fileName}>{att.fileName}</a></li>
                                ))}
                            </ul>
                             <button onClick={() => attachmentInputRef.current?.click()} className="button button-small">Upload</button>
                             <input type="file" ref={attachmentInputRef} onChange={handleFileChange} style={{display: 'none'}} />
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={() => { onSave(currentTask); onClose(); }} className="button button-primary">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

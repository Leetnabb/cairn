import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { Button } from '../ui/Button';
import { getDateLocale } from '../../lib/labels';

interface Props {
  itemId: string;
}

export function CommentsSection({ itemId }: Props) {
  const { t } = useTranslation();
  const allComments = useStore(s => s.comments);
  const comments = useMemo(
    () => allComments.filter(c => c.itemId === itemId),
    [allComments, itemId]
  );
  const addComment = useStore(s => s.addComment);
  const deleteComment = useStore(s => s.deleteComment);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    addComment({
      id: `comment_${Date.now()}`,
      itemId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    });
    setText('');
  };

  const showInput = comments.length > 0 || expanded;

  return (
    <div className="pt-2 border-t border-border">
      {comments.length > 0 && (
        <>
          <div className="text-[10px] text-text-tertiary mb-1">{t('comments.title')}</div>
          <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className="px-2 py-1 bg-[var(--bg-lane)] rounded text-[10px] group">
                <div className="flex justify-between items-start">
                  <p className="text-text-primary">{c.text}</p>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-[9px] text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-red-500 ml-1 shrink-0"
                  >
                    &times;
                  </button>
                </div>
                <div className="text-[8px] text-text-tertiary mt-0.5">
                  {new Date(c.timestamp).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {showInput ? (
        <div className="flex gap-1">
          <input
            autoFocus={expanded && comments.length === 0}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('comments.placeholder')}
            className="flex-1 px-2 py-1 text-[10px] border border-border rounded focus:outline-none focus:border-primary"
          />
          <Button variant="primary" onClick={handleAdd} disabled={!text.trim()}>{t('common.add')}</Button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] text-text-tertiary hover:text-primary"
        >
          {t('comments.addCta')}
        </button>
      )}
    </div>
  );
}

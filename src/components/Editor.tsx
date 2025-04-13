
import React, { useState, useEffect } from 'react';
import { Save, FileDown, FileUp, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Scene, Chapter } from '@/types';
import { toast } from 'sonner';

interface EditorProps {
  activeChapter?: Chapter;
  activeScene?: Scene;
  onSave: (content: string, title?: string) => void;
}

const Editor: React.FC<EditorProps> = ({ activeChapter, activeScene, onSave }) => {
  const [title, setTitle] = useState(activeScene?.title || 'Untitled Scene');
  const [content, setContent] = useState(activeScene?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (activeScene) {
      setTitle(activeScene.title);
      setContent(activeScene.content);
    }
  }, [activeScene]);

  useEffect(() => {
    if (content) {
      setWordCount(content.split(/\s+/).filter(Boolean).length);
      setCharCount(content.length);
    } else {
      setWordCount(0);
      setCharCount(0);
    }
  }, [content]);

  const handleSave = () => {
    onSave(content, title);
    toast.success('Saved successfully');
  };

  const exportText = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-serif text-lg font-semibold bg-transparent border-0 hover:bg-secondary focus-visible:ring-0 w-auto"
        />
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save size={16} className="mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={exportText}>
            <FileDown size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto editor-container">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full min-h-[500px] p-4 border-0 focus-visible:ring-0 editor-content resize-none"
          placeholder="Start writing your masterpiece..."
        />
      </div>

      <div className="flex items-center justify-between p-2 text-sm text-muted-foreground bg-card">
        <div>
          {wordCount} words | {charCount} characters
        </div>
        {activeChapter && activeScene && (
          <div>
            {activeChapter.title} &gt; {activeScene.title}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;

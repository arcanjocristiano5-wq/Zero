import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { Project, FileNode } from '../types';
import { IconTerminal, IconWand } from './Icons';
import * as geminiService from '../services/geminiService';
import SuggestionPopover, { Suggestion } from './SuggestionPopover';

interface CodeEditorProps {
  project: Project;
  activeFile: FileNode | null;
  onCodeChange: (fileId: string, newContent: string) => void;
  onSelectionChange: (selection: string) => void;
  jumpToLocation?: { path: string; line: number; column: number } | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ project, activeFile, onCodeChange, onSelectionChange, jumpToLocation }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // Fix: Add a ref to store the monaco instance, which is passed in onMount.
  const monacoRef = useRef<any>(null);
  const [inlineSuggestions, setInlineSuggestions] = useState<Suggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<{ suggestion: Suggestion; top: number; left: number } | null>(null);
  const decorationIds = useRef<string[]>([]);
  
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Fix: Store the monaco instance in the ref.
    monacoRef.current = monaco;

    // Configure TypeScript/JavaScript language service
    const setupLangugeService = () => {
        const ts = monaco.languages.typescript;
        const compilerOptions = {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.ReactJSX,
            allowNonTsExtensions: true,
            strict: true,
        };
        ts.typescriptDefaults.setCompilerOptions(compilerOptions);
        ts.javascriptDefaults.setCompilerOptions(compilerOptions);

        const allFiles: { path: string, content: string }[] = [];
        const traverse = (nodes: FileNode[], path: string) => {
            nodes.forEach(node => {
                const currentPath = path ? `${path}/${node.name}` : node.name;
                if (node.type === 'file' && node.content) {
                    allFiles.push({ path: `file:///${currentPath}`, content: node.content });
                }
                if (node.children) {
                    traverse(node.children, currentPath);
                }
            });
        };
        traverse(project.structure, '');
        
        ts.typescriptDefaults.setExtraLibs(allFiles.map(f => ({ filePath: f.path, content: f.content })));
        ts.javascriptDefaults.setExtraLibs(allFiles.map(f => ({ filePath: f.path, content: f.content })));
    };

    setupLangugeService();

    editor.onDidChangeCursorSelection(() => {
        const selection = editor.getModel()?.getValueInRange(editor.getSelection()!);
        onSelectionChange(selection || '');
    });

    editor.onMouseDown(e => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
            const lineNumber = e.target.position!.lineNumber;
            const suggestion = inlineSuggestions.find(s => s.lineNumber === lineNumber);
            if (suggestion) {
                const glyphMarginDomNode = editor.getDomNode()?.querySelector(`.glyph-margin.line-numbers${lineNumber}`);
                if (glyphMarginDomNode) {
                    const rect = glyphMarginDomNode.getBoundingClientRect();
                    setActiveSuggestion({ suggestion, top: rect.top, left: rect.left + rect.width });
                }
            }
        } else if (activeSuggestion) {
            // Clicked outside the popover, so close it
            setActiveSuggestion(null);
        }
    });
  };

  useEffect(() => {
    if (jumpToLocation && editorRef.current && activeFile?.name === jumpToLocation.path.split('/').pop()) {
        editorRef.current.revealPositionInCenter({
            lineNumber: jumpToLocation.line,
            column: jumpToLocation.column
        });
        editorRef.current.setPosition({
            lineNumber: jumpToLocation.line,
            column: jumpToLocation.column
        });
        editorRef.current.focus();
    }
  }, [jumpToLocation, activeFile]);

  // Proactive AI Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (activeFile?.content) {
        const suggestions = await geminiService.getInlineSuggestions(activeFile.content, activeFile.name, project);
        setInlineSuggestions(suggestions);
      }
    };
  
    const debounce = setTimeout(() => {
        fetchSuggestions();
    }, 1500);
  
    return () => {
        clearTimeout(debounce);
        setInlineSuggestions([]); // Clear suggestions on file change
    };
  }, [activeFile?.content, activeFile?.id, project]);

  // Render suggestions as editor decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    // Fix: Get monaco instance from ref.
    const monaco = monacoRef.current;
    
    const newDecorations = inlineSuggestions.map(s => ({
        // Fix: Use monaco instance from ref to access Range, which fixes "Cannot find name 'monaco'".
        range: new monaco.Range(s.lineNumber, 1, s.lineNumber, 1),
        options: {
            isWholeLine: true,
            glyphMarginClassName: 'suggestion-glyph',
            glyphMarginHoverMessage: { value: `AI Suggestion: ${s.suggestion}` },
        }
    }));

    decorationIds.current = editor.deltaDecorations(decorationIds.current, newDecorations);

    return () => {
        if(editorRef.current) {
            decorationIds.current = editorRef.current.deltaDecorations(decorationIds.current, []);
        }
    };
  }, [inlineSuggestions]);

  const handleApplySuggestion = useCallback((suggestion: Suggestion) => {
    if (!editorRef.current || !activeFile || !monacoRef.current) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    // Fix: Get monaco instance from ref.
    const monaco = monacoRef.current;

    // Fix: Use monaco instance from ref to access Range, which fixes "Cannot find name 'monaco'".
    const range = new monaco.Range(suggestion.lineNumber, 1, suggestion.lineNumber, model.getLineMaxColumn(suggestion.lineNumber));
    
    editor.executeEdits('ai-suggestion', [{
        range: range,
        text: suggestion.replacementCode,
    }]);

    onCodeChange(activeFile.id, editor.getValue());
    setActiveSuggestion(null);
  }, [activeFile, onCodeChange]);

  const handleEditorChange: OnChange = (value) => {
    if (activeFile && value !== undefined) {
      onCodeChange(activeFile.id, value);
    }
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] relative">
      <style>{`
        .suggestion-glyph {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M5 13l-1.2 1.2"/><path d="M19 5l1.2-1.2"/><path d="M5 5l-1.2-1.2"/><path d="M12 22l-2-2 2-2 2 2 2-2-2-2-2 2-2-2 2-2 2 2-2 2-2-2-2 2 2 2 2-2 2 2z"/></svg>');
          background-repeat: no-repeat;
          background-position: center;
          cursor: pointer;
        }
      `}</style>
      
      {activeFile ? (
        <Editor
          height="100%"
          path={`file:///${activeFile.name}`}
          defaultValue={activeFile.content}
          value={activeFile.content}
          language={activeFile.language}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            glyphMargin: true, // Enable glyph margin for suggestions
          }}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 text-center p-8">
          <IconTerminal />
          <p>Selecione um arquivo para começar a editar ou descreva seu projeto ao assistente.</p>
        </div>
      )}

      {activeSuggestion && (
          <SuggestionPopover
            suggestion={activeSuggestion.suggestion}
            top={activeSuggestion.top}
            left={activeSuggestion.left}
            onApply={handleApplySuggestion}
            onDismiss={() => setActiveSuggestion(null)}
          />
      )}
    </div>
  );
};

export default CodeEditor;
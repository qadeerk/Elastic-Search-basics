import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Zap } from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

const QueryEditor = ({ value, onChange, placeholder = 'Enter your Elasticsearch query...', height = 400 }) => {
  const editorRef = useRef(null);
  const { getFieldNames } = useDataset();

  useEffect(() => {
    if (editorRef.current) {
      setupElasticsearchCompletion();
    }
  }, [editorRef.current]);

  const setupElasticsearchCompletion = async () => {
    try {
      const monaco = await import('monaco-editor');
      const fieldNames = getFieldNames();

      // Create completion items for Elasticsearch fields
      const fieldCompletions = fieldNames.map(field => ({
        label: field,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: `"${field}"`,
        detail: 'Field',
        documentation: `Elasticsearch field: ${field}`,
      }));

      // Enhanced Elasticsearch query completions
      const queryCompletions = [
        {
          label: 'match',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"match": {\n  "${1:field}": {\n    "query": "${2:value}"\n  }\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Match query',
          documentation: 'Full-text search on a specific field',
        },
        {
          label: 'match_all',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"match_all": {}',
          detail: 'Match all query',
          documentation: 'Matches all documents',
        },
        {
          label: 'term',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"term": {\n  "${1:field}": "${2:value}"\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Term query',
          documentation: 'Exact match for a single term',
        },
        {
          label: 'terms',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"terms": {\n  "${1:field}": [${2:"value1", "value2"}]\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Terms query',
          documentation: 'Match any of the provided terms',
        },
        {
          label: 'range',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"range": {\n  "${1:field}": {\n    "gte": ${2:value},\n    "lte": ${3:value}\n  }\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Range query',
          documentation: 'Match documents within a range',
        },
        {
          label: 'bool',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"bool": {\n  "must": [\n    ${1}\n  ]\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Bool query',
          documentation: 'Combine multiple queries with boolean logic',
        },
        {
          label: 'multi_match',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"multi_match": {\n  "query": "${1:search_text}",\n  "fields": [${2:"field1", "field2"}]\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Multi-match query',
          documentation: 'Search across multiple fields',
        },
        {
          label: 'more_like_this',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"more_like_this": {\n  "fields": [${1:"*"}],\n  "like": "${2:sample text}",\n  "min_term_freq": ${3:1},\n  "min_doc_freq": ${4:1}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'More like this query',
          documentation: 'Find documents similar to provided text or documents',
        },
        {
          label: 'aggs',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"aggs": {\n  "${1:aggregation_name}": {\n    "${2:terms}": {\n      "field": "${3:field_name}"\n    }\n  }\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Aggregations',
          documentation: 'Data aggregation and analytics',
        },
        {
          label: 'highlight',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '"highlight": {\n  "fields": {\n    "${1:field}": {}\n  }\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Highlight',
          documentation: 'Highlight matching terms in results',
        },
      ];

      // Register completion provider
      monaco.languages.registerCompletionItemProvider('json', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = [...queryCompletions, ...fieldCompletions].map(item => ({
            ...item,
            range,
          }));

          return { suggestions };
        },
      });

      // Set up hover provider for documentation
      monaco.languages.registerHoverProvider('json', {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position);
          if (!word) return;

          const completion = [...queryCompletions, ...fieldCompletions].find(
            c => c.label === word.word
          );

          if (completion) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${completion.label}**` },
                { value: completion.documentation || completion.detail },
              ],
            };
          }
        },
      });
    } catch (error) {
      console.error('Failed to setup Monaco Editor completions:', error);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Enhanced editor options
    editor.updateOptions({
      minimap: { enabled: false },
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      bracketMatching: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      suggest: {
        insertMode: 'replace',
        showSnippets: true,
        showKeywords: true,
        showText: true,
        showFunctions: true,
        showFields: true,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
    });

    // Enhanced JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [
        {
          uri: 'http://elasticsearch.org/query-dsl-schema.json',
          fileMatch: ['*'],
          schema: {
            type: 'object',
            properties: {
              query: {
                type: 'object',
                description: 'The query part of the request'
              },
              aggs: {
                type: 'object',
                description: 'Aggregations to compute over the dataset'
              },
              size: {
                type: 'number',
                description: 'Number of hits to return'
              },
              from: {
                type: 'number',
                description: 'Starting offset'
              },
              sort: {
                type: 'array',
                description: 'Sort order'
              },
              highlight: {
                type: 'object',
                description: 'Highlighting configuration'
              }
            }
          }
        }
      ],
    });

    // Trigger suggest on Ctrl+Space
    editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Space && e.ctrlKey) {
        editor.trigger('', 'editor.action.triggerSuggest', {});
      }
    });
  };

  const formatQuery = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-slate-500" />
          <span className="editor-label">JSON Query Editor</span>
        </div>
        <div className="editor-actions">
          <button
            onClick={formatQuery}
            className="editor-action-btn flex items-center space-x-1"
            title="Format JSON (Ctrl+Shift+F)"
          >
            <Zap className="w-3 h-3" />
            <span>Format</span>
          </button>
          <span className="text-xs text-slate-400">Ctrl+Space for suggestions</span>
        </div>
      </div>
      
      <div className="relative">
        <Editor
          height={height}
          defaultLanguage="json"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="vs"
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace',
            tabSize: 2,
            insertSpaces: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorSmoothCaretAnimation: true,
            cursorBlinking: 'smooth',
          }}
        />
        
        {placeholder && !value && (
          <div className="absolute top-4 left-16 text-slate-400 text-sm pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryEditor; 
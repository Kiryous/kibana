import React, { useState, useEffect, useRef } from 'react';
import { EuiButtonIcon, EuiButton } from '@elastic/eui';
import { css } from '@emotion/react';

export interface WorkflowYAMLEditorToolbarProps {
  onCopy: () => Promise<void>;
  onDownload: () => void;
  onSave?: () => void;
  isEditorMounted: boolean;
  readOnly?: boolean;
  className?: string;
}

export function WorkflowYAMLEditorToolbar({
  onCopy,
  onDownload,
  onSave,
  isEditorMounted,
  readOnly = false,
  className,
}: WorkflowYAMLEditorToolbarProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await onCopy();
      setIsCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // console.error('Failed to copy text:', err);
    }
  };

  return (
    <div
      css={css`
        position: absolute;
        top: 0.5rem;
        right: 1.5rem;
        z-index: 10;
        display: flex;
        gap: 0.5rem;
        ${className}
      `}
    >
      <EuiButtonIcon
        color="warning"
        size="s"
        css={css`
          height: 2rem;
          padding: 0 0.5rem;
          background-color: white;
        `}
        onClick={handleCopy}
        iconType={isCopied ? 'check' : 'copy'}
        aria-label={isCopied ? 'Copied' : 'Copy YAML'}
        data-testid="copy-yaml-button"
        isDisabled={!isEditorMounted}
      />
      <EuiButtonIcon
        color="warning"
        size="s"
        css={css`
          height: 2rem;
          padding: 0 0.5rem;
          background-color: white;
        `}
        onClick={onDownload}
        iconType="importAction"
        aria-label="Download YAML"
        data-testid="download-yaml-button"
        isDisabled={!isEditorMounted}
      />
      {!readOnly && onSave && (
        <EuiButton
          color="warning"
          size="s"
          css={css`
            height: 2rem;
            padding: 0 0.5rem;
          `}
          onClick={onSave}
          data-testid="save-yaml-button"
        >
          Save
        </EuiButton>
      )}
    </div>
  );
}

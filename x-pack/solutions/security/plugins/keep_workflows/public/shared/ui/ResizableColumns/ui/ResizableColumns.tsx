import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { css } from '@emotion/react';
import { useEuiTheme } from '@elastic/eui';

interface ResizableColumnsProps {
  initialLeftWidth?: number;
  children: React.ReactNode;
  leftChildClassName?: string;
  rightChildClassName?: string;
}

const ResizableColumns = memo(
  ({
    initialLeftWidth = 50,
    leftChildClassName,
    rightChildClassName,
    children,
  }: ResizableColumnsProps) => {
    const { euiTheme } = useEuiTheme();

    if (React.Children.count(children) !== 2) {
      throw new Error('ResizableColumns must have exactly two children');
    }
    const [leftChild, rightChild] = React.Children.toArray(children);
    const [isDragging, setIsDragging] = useState(false);
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);

    const containerStyles = css`
      display: flex;
      height: 100%;
      width: 100%;
    `;

    const resizerStyles = css`
      width: 4px;
      background-color: ${euiTheme.colors.lightShade};
      cursor: col-resize;
      transition: background-color ${euiTheme.animation.fast};
      flex-shrink: 0;

      &:hover {
        background-color: ${euiTheme.colors.primary};
      }
    `;

    // Memoize the left child
    const MemoizedLeftChild = useMemo(() => {
      const leftChildStyles = css`
        min-width: 0;
        padding: 1px;
        width: ${leftWidth}%;
        ${leftChildClassName || ''}
      `;

      return <div css={leftChildStyles}>{leftChild}</div>;
    }, [leftChild, leftWidth, leftChildClassName]);

    // Memoize the right child
    const MemoizedRightChild = useMemo(() => {
      const rightChildStyles = css`
        flex: 1;
        min-width: 0;
        padding: 1px;
        ${rightChildClassName || ''}
      `;

      return <div css={rightChildStyles}>{rightChild}</div>;
    }, [rightChild, rightChildClassName]);

    const startDragging = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
    }, []);

    const stopDragging = useCallback(() => {
      setIsDragging(false);
    }, []);

    const onMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
          const containerRect = e.currentTarget.getBoundingClientRect();
          const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
          setLeftWidth(Math.min(Math.max(newWidth, 20), 80));
        }
      },
      [isDragging]
    );

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('mouseleave', stopDragging);
      }
      return () => {
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('mouseleave', stopDragging);
      };
    }, [isDragging, stopDragging]);

    return (
      <div css={containerStyles} onMouseMove={onMouseMove}>
        {MemoizedLeftChild}

        <div css={resizerStyles} onMouseDown={startDragging} />

        {MemoizedRightChild}
      </div>
    );
  }
);

ResizableColumns.displayName = 'ResizableColumns';

export { ResizableColumns };

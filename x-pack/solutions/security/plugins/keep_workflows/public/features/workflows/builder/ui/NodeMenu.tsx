import React, { Fragment, useState } from 'react';
import { EuiPopover, EuiContextMenu, EuiButtonIcon, EuiIcon } from '@elastic/eui';
import { css } from '@emotion/react';
import { FlowNode, useWorkflowStore } from '../../../../entities/workflows';

export function NodeMenu({ data, id }: { data: FlowNode['data']; id: string }) {
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const stopPropagation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const hideMenu = data?.type?.includes('empty') || id?.includes('end') || id?.includes('start');

  const { deleteNodes, setSelectedNode } = useWorkflowStore();

  const closePopover = () => setPopoverOpen(false);

  const panels = [
    {
      id: 0,
      items: [
        {
          name: 'Delete',
          icon: <EuiIcon type="trash" size="m" />,
          onClick: () => {
            deleteNodes(id);
            closePopover();
          },
        },
        {
          name: 'Properties',
          icon: <EuiIcon type="gear" size="m" />,
          onClick: () => {
            setSelectedNode(id);
            closePopover();
          },
        },
      ],
    },
  ];

  return (
    <>
      {data && !hideMenu && (
        <EuiPopover
          button={
            <EuiButtonIcon
              iconType="boxesVertical"
              onClick={(e) => {
                stopPropagation(e);
                setPopoverOpen(!isPopoverOpen);
              }}
              aria-label="Node menu"
              size="s"
              css={css`
                color: #6b7280;
                &:hover {
                  color: #374151;
                }
              `}
            />
          }
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenu
            initialPanelId={0}
            panels={panels}
            css={css`
              min-width: 150px;
            `}
          />
        </EuiPopover>
      )}
    </>
  );
}

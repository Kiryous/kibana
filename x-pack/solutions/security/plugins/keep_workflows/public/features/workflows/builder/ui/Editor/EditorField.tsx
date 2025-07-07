import React from 'react';
import { EuiText, EuiFieldText, EuiTextArea } from '@elastic/eui';

// Mock TextInput and Textarea components
const TextInput = ({ placeholder, value, onChange, className, ...props }: any) => {
  return (
    <EuiFieldText
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      fullWidth
      {...props}
    />
  );
};

const Textarea = ({ placeholder, value, onChange, className, ...props }: any) => {
  return (
    <EuiTextArea
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      fullWidth
      rows={6}
      {...props}
    />
  );
};

export function EditorField({
  name,
  value,
  asTextarea,
  ...rest
}: {
  name?: string;
  value?: string;
  asTextarea?: boolean;
  [key: string]: any;
}) {
  if (name === 'code') {
    return (
      <div>
        <EuiText size="s" className="capitalize mb-1.5">
          {name}
        </EuiText>
        <Textarea
          id={name}
          placeholder={name}
          css={{
            minHeight: '100px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
          value={value || ''}
          {...rest}
        />
      </div>
    );
  }
  if (asTextarea) {
    return (
      <div>
        <EuiText size="s" className="capitalize mb-1.5">
          {name}
        </EuiText>
        <Textarea
          id={name}
          placeholder={name}
          css={{
            minHeight: '100px',
            fontSize: '12px',
          }}
          value={value || ''}
          {...rest}
        />
      </div>
    );
  }
  return (
    <div>
      <EuiText size="s" className="capitalize mb-1.5">
        {name}
      </EuiText>
      <TextInput
        id={name}
        placeholder={name}
        css={{
          marginBottom: '10px',
        }}
        value={value || ''}
        {...rest}
      />
    </div>
  );
}

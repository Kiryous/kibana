# Keep Workflows Kibana Integration Rules

## Overview

This directory contains workflow components being migrated from the Next.js Keep app to Kibana. Follow these rules when working with or migrating components.

## Import & Module System

### Required Import Changes

```typescript
// ALWAYS add React import for JSX
import React from 'react';

// Incide a plugin, use relative paths instead of @-aliases
// FROM: import { Component } from '@/shared/ui'
// TO:   import { Component } from '../../shared/ui'

// Use single quotes consistently
// FROM: import { Component } from "module"
// TO:   import { Component } from 'module'

// Remove Next.js specific directives
// REMOVE: "use client";
```

### Library Replacements

```typescript
// UI Components: Tremor → Kibana EUI
import { Button, Title, Card } from '@tremor/react'
→ import { EuiButton, EuiTitle, EuiPanel } from '@elastic/eui'

// Icons: Heroicons → EUI iconType
import { ArrowUpOnSquareIcon } from '@heroicons/react/20/solid'
→ iconType="importAction" // in EUI components

// Utilities: Individual lodash → Full lodash
import debounce from 'lodash.debounce'
→ import { debounce } from 'lodash'

// Next.js routing → Kibana navigation patterns
import { useRouter, useSearchParams } from 'next/navigation'
→ import { Link } from 'react-router-dom';
```

## Component Migrations

### Button Components

```typescript
// Tremor Button → EuiButton
<Button
  color="orange"        → color="warning"
  size="md"            → size="m"
  variant="secondary"  → fill={false}
  disabled             → isDisabled
  icon={IconComponent} → iconType="iconName"
>

// HTML button with icon → EuiButtonIcon
<button title="..." onClick={...}>
  <Icon className="size-5" />
</button>
→
<EuiButtonIcon
  aria-label="..."
  iconType="iconName"
  onClick={...}
/>
```

### Layout Components

```typescript
// Tremor Card → EuiPanel
<Card className="...">
→ <EuiPanel className="..." paddingSize="l">

// Tremor Title → EuiTitle with header element inside (h1, h2, etc)
<Title>Text</Title>
→ <EuiTitle size="m"><h2>Text</h2></EuiTitle>
```

### Loading States

```typescript
// Custom loader → EUI spinner
<KeepLoader loadingText="..." />
→
<EuiFlexGroup justifyContent={'center'} alignItems={'center'}>
  <EuiLoadingSpinner size="xl" />
  <EuiText>Loading...</EuiText>
</EuiFlexGroup>
```

## Icon Mapping

```typescript
ArrowUpOnSquareIcon → "importAction"
PencilIcon → "pencil"
CodeBracketIcon → "editorCodeBlock"
SparklesIcon → "sparkles"
```

## Navigation & State

### Router Replacement

```typescript
// Replace Next.js router with Kibana navigation mock
const router = useRouter();
router.push('/path');

// TO:
const navigateToWorkflow = useCallback((id: string) => {
  // In real Kibana plugin:
  // const { services } = useKibana();
  // services.application.navigateToUrl(`/workflows/${id}`);
}, []);
```

### Search Params

```typescript
// Replace Next.js search params with mocks
const searchParams = useSearchParams();
const param = searchParams?.get('param');

// TO:
// Mock search params - in Kibana, use URL state management
const param = null; // searchParams?.get('param');
```

## Error Handling & Notifications

```typescript
// Replace external toast functions with Kibana service mocks
const showErrorToast = useCallback((error: unknown, title?: string) => {
  // In real Kibana plugin:
  // const { services } = useKibana();
  // services.notifications.toasts.addError(error as Error, { title });
}, []);
```

## Code Quality Standards

### ESLint Compliance

- Add all dependencies to useEffect dependency arrays
- Avoid variable shadowing (rename conflicting parameters)
- Comment out console statements for production
- Use proper TypeScript interfaces for missing types

### String Literals

- Always use single quotes: `'string'` not `"string"`
- Update template literals to use single quotes for consistency

### Dependency Management

```typescript
// Fix missing dependencies by creating mocks
// FROM: import { useWorkflowSecrets } from '../../utils/hooks/useWorkflowSecrets';
// TO: Mock implementation with TODO comment

const useWorkflowSecrets = (workflowId: string | null) => {
  // TODO: Implement real Kibana workflow secrets hook
  return { getSecrets: { data: {} } };
};
```

## Styles

Replace tailwind styles with emotion css

```typescript
//FROM:
<div className="w-full h-full"/>
// TO:
<div css={css`
        height: 500px;
        width: 100%;
      `}/>
```

## File Structure Adaptations

### Import Path Updates

```typescript
// Update specific import paths as discovered
'../../shared/ui' → '../../shared/ui/ComponentName/ui/ComponentName'
'../../shared/ui' → '../../shared/ui/ResizableColumns'
```

## Best Practices

1. **Preserve Functionality**: Ensure all original features work with EUI components
2. **Accessibility**: Use proper ARIA labels and EUI accessibility features
3. **Documentation**: Add detailed comments showing proper Kibana implementation
4. **Incremental Migration**: Create working mocks before implementing real Kibana services
5. **Type Safety**: Add TypeScript interfaces for missing external types

## Testing Considerations

- Test all component interactions with EUI components
- Verify accessibility features work correctly
- Ensure styling remains consistent with Kibana design system
- Test responsive behavior with EUI breakpoints

## Future Implementation Notes

When implementing real Kibana services:

1. Replace navigation mocks with `useKibana()` and `services.application.navigateToUrl`
2. Replace toast mocks with `services.notifications.toasts`
3. Implement proper URL state management with `@kbn/kibana-utils-plugin`
4. Add proper error boundary handling
5. Integrate with Kibana's security and permissions system

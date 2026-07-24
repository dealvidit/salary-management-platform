import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  // When provided, shows an inline clear (×) button — mirrors the search input's
  // clear affordance. Callers pass this only while the select has a value.
  onClear?: () => void;
}

// A styled native <select>. Deliberately not a custom listbox: native selects
// are fully accessible and behave well on touch devices, which is all this tool
// needs for its filters.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onClear, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 text-sm',
          onClear ? 'pr-14' : 'pr-9',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  ),
);
Select.displayName = 'Select';

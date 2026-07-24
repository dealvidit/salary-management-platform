import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Select } from './select';
import { Skeleton } from './skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

describe('Card', () => {
  it('renders its titled sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Sub</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});

describe('Badge and Skeleton', () => {
  it('render their content / placeholder', () => {
    render(
      <>
        <Badge>L3</Badge>
        <Skeleton className="h-4" data-testid="sk" />
      </>,
    );
    expect(screen.getByText('L3')).toBeInTheDocument();
    expect(screen.getByTestId('sk')).toBeInTheDocument();
  });
});

describe('Table', () => {
  it('renders a semantic table', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
  });
});

describe('Select', () => {
  it('shows no clear button without onClear', () => {
    render(
      <Select value="" onChange={() => {}}>
        <option value="">All</option>
      </Select>,
    );
    expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument();
  });

  it('renders and fires a clear button when onClear is provided', async () => {
    const onClear = vi.fn();
    render(
      <Select value="Sales" onChange={() => {}} onClear={onClear}>
        <option value="Sales">Sales</option>
      </Select>,
    );
    await userEvent.click(screen.getByLabelText('Clear selection'));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

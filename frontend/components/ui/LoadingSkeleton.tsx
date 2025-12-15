'use client';

import { Skeleton, Stack } from '@mantine/core';

interface LoadingSkeletonProps {
  type: 'card' | 'list' | 'form' | 'dashboard';
  count?: number;
}

export function LoadingSkeleton({ type, count = 3 }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <Stack key={i} gap="sm">
            <Skeleton height={200} radius="lg" />
            <Skeleton height={20} radius="sm" />
            <Skeleton height={20} width="70%" radius="sm" />
            <Skeleton height={40} radius="md" />
          </Stack>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <Stack gap="md">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} height={60} radius="md" />
        ))}
      </Stack>
    );
  }

  if (type === 'form') {
    return (
      <Stack gap="md">
        <Skeleton height={40} radius="sm" />
        <Skeleton height={40} radius="sm" />
        <Skeleton height={100} radius="sm" />
        <Skeleton height={50} radius="md" width="30%" />
      </Stack>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={120} radius="lg" />
      ))}
    </div>
  );
}
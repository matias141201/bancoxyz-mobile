import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { PrivateReadError, PrivateReader } from '@/shared/network/private-reader';

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T; refreshing?: boolean; message?: string };

const errors: Record<Exclude<PrivateReadError, 'unauthorized'>, string> = {
  misconfigured: 'Falta configurar la conexión con BancoXYZ.',
  'invalid-response': 'El servicio devolvió una respuesta inesperada.',
  unavailable: 'El servicio no está disponible. Intentá de nuevo.',
};

export function usePrivateResource<T>(
  token: string | undefined,
  read: PrivateReader<T>,
  onUnauthorized: () => void,
) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    if (!token) return;

    const requestId = ++latestRequest.current;
    setState(current => current.status === 'ready'
      ? { status: 'ready', data: current.data, refreshing: true }
      : { status: 'loading' });

    void read(token).then(result => {
      if (requestId !== latestRequest.current) return;
      if (result.ok) {
        setState({ status: 'ready', data: result.data });
        return;
      }
      if (result.error === 'unauthorized') {
        onUnauthorized();
        return;
      }
      const message = errors[result.error];
      setState(current => current.status === 'ready'
        ? { status: 'ready', data: current.data, message }
        : { status: 'error', message });
    });
  }, [token, read, onUnauthorized]);

  useFocusEffect(useCallback(() => {
    reload();
    return () => { latestRequest.current += 1; };
  }, [reload]));

  return { state, reload };
}

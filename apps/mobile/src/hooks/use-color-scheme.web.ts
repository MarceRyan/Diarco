import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const suscribirse = () => () => {};

/**
 * En web con renderizado estático, el servidor no conoce el tema del sistema:
 * devuelve 'light' en el servidor y el valor real una vez hidratado en el cliente.
 */
export function useColorScheme() {
  const hidratado = useSyncExternalStore(
    suscribirse,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  return hidratado ? colorScheme : 'light';
}

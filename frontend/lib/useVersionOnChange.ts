import { useState } from 'react';

/**
 * Devuelve un contador que aumenta en 1 cada vez que alguno de `deps` cambia
 * (comparación por referencia, como las dependencias de useEffect). Sirve
 * para disparar un efecto de carga de datos sin necesitar un `setState`
 * síncrono al inicio del efecto (p. ej. `setLoading(true)`/`setError(null)`),
 * que `react-hooks/set-state-in-effect` marca como error: en vez de resetear
 * "loading"/"error" reactivamente dentro del efecto, se ajusta el estado
 * durante el render (patrón documentado en
 * https://react.dev/learn/you-might-not-need-an-effect) y "loading" se
 * deriva comparando este contador contra la versión ya completada.
 */
export function useVersionOnChange(...deps: unknown[]): number {
  const [version, setVersion] = useState(0);
  const [prevDeps, setPrevDeps] = useState(deps);

  const changed = deps.length !== prevDeps.length || deps.some((dep, i) => !Object.is(dep, prevDeps[i]));
  if (changed) {
    setPrevDeps(deps);
    setVersion((v) => v + 1);
  }

  return version;
}

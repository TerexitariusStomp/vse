import { lazy, Suspense } from 'react'
import { LazyMotion, m, useReducedMotion } from 'motion/react'
import { Route, Switch, useLocation } from 'wouter'
import { ErrorBoundary } from './components/ErrorBoundary'

const Landing = lazy(() => import('./sections/Landing').then((x) => ({ default: x.Landing })))
const PlacePage = lazy(() =>
  import('./sections/PlacePage').then((x) => ({ default: x.PlacePage })),
)
const Share = lazy(() => import('./sections/Share').then((x) => ({ default: x.Share })))
const loadFeatures = () => import('./motion-features').then((x) => x.default)

export default function App() {
  const [location] = useLocation()
  const reduced = useReducedMotion()
  const key = location.replace(/\/+$/, '') || '/'
  return (
    <LazyMotion features={loadFeatures}>
    <m.div
      key={key}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
    >
      <ErrorBoundary>
      <Suspense fallback={<p className="px-4 py-20 text-center opacity-70">Loading…</p>}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/:placeId/share">
          {(params) => <Share placeId={params.placeId} />}
        </Route>
        <Route path="/:placeId">
          {(params) => <PlacePage placeId={params.placeId} />}
        </Route>
      </Switch>
      </Suspense>
      </ErrorBoundary>
    </m.div>
    </LazyMotion>
  )
}

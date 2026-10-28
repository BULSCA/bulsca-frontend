import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import { routes } from './routes'
export function createSiteRouter(history?: RouterHistory) {
  const router = createRouter({ history: history || createWebHistory(import.meta.env.BASE_URL), routes,
    ...(!history ? { scrollBehavior: (_to: unknown, _from: unknown, saved: { left: number; top: number } | null) => saved || { top: 0 } } : {}),
  })
  router.afterEach(to => { if (typeof document !== 'undefined') document.title = `${String(to.meta.title || 'BULSCA')} | BULSCA` })
  return router
}
export default createSiteRouter()

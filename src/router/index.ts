import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
    },
    {
      path: '/latest',
      name: 'latest',
      component: () => import('../views/LatestView.vue'),
    },

    { path: '/article/:slug', name: 'article', component: () => import('../views/ArticleView.vue') },
    { path: '/articles/tag/:tag', redirect: to => ({ path: '/latest', query: { tag: String(to.params.tag) } }) },
    { path: '/articles/:slug', redirect: to => ({ name: 'article', params: { slug: to.params.slug } }) },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
})

export default router

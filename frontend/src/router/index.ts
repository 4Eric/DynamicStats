import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import UploadView from '../views/UploadView.vue';
import PlayerView from '../views/PlayerView.vue';

import GamesView from '../views/GamesView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/games', component: GamesView },
    { path: '/upload', component: UploadView },
    { path: '/player/:id', component: PlayerView },
  ]
});

export default router;

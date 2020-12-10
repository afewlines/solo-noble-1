import Vue from 'vue'
import VueRouter from 'vue-router'
import Menu from '../views/Menu.vue'
import SPStandard from '../views/game/SPStandard.vue'
import VSAIStandard from '../views/game/VSAIStandard.vue'
import MPBattle from '../views/game/MPBattle.vue'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'Menu',
    component: Menu
  },
  {
    path: '/standard/freeplay',
    name: "Freeplay",
    component: SPStandard,
  },
  {
    path: '/standard/vsAI',
    name: "Versus",
    component: VSAIStandard,
  },
  {
    path: '/multinoble/play',
    name: "multi, noble",
    component: MPBattle,
  },
]

const router = new VueRouter({
  routes
})

export default router
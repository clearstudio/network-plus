import Vue from 'vue'
import App from './App.vue'
import { Container, Header, Input, ButtonGroup, Button, Aside, Table, TableColumn, Main, Tabs, TabPane, Collapse, CollapseItem } from 'element-ui'


Vue.use(Container)
Vue.use(Header)
Vue.use(Input)
Vue.use(ButtonGroup)
Vue.use(Button)
Vue.use(Aside)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Main)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Collapse)
Vue.use(CollapseItem)



Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')


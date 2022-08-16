<template>
  <div id="app" v-cloak>
    <HomePage></HomePage>
  </div>
</template>

<script>
import HomePage from './components/HomePage.vue';

export default {
  name: 'App',
  components: {
    HomePage
  }
}
</script>

<style>
#app {
  height: 100%;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getUser, User, updateUser } from "./apis/user";
const user = ref<User>();
onMounted(() => {
  getUser().then(res => {
    user.value = res.data;
  })
});

const handleUpdate = () => {
  updateUser({ name: 'li', age: 10 }).then(res => {
    alert(JSON.stringify(res.data));
  })
}
</script>

<template>
  <div v-if="user">
    <div>username: {{ user.name }}</div>
    <div>age: {{ user.age }}</div>
    <button @click="handleUpdate">更新 user</button>
  </div>
</template>

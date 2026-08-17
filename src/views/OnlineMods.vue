<template>
  <div class="ecl-page online-mods-page">
    <PageHeader :title="t('mods.onlineSearch')" icon="search" />
    <OnlineModSearch :resourceType="'mod'" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import OnlineModSearch from '@/components/mods/OnlineModSearch.vue'

const { t } = useI18n()
</script>

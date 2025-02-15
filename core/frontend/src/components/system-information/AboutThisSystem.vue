<template>
  <v-sheet
    elevation="1"
    outlined
    shaped
    class="mx-auto"
    max-width="500"
  >
    <v-responsive :aspect-ratio="32/9">
      <v-row justify="center">
        <v-icon
          size="100"
        >
          {{ avatar }}
        </v-icon>
        <v-list dense>
          <v-list-item-group
            color="primary"
          >
            <v-list-item
              v-for="(item, i) in info"
              :key="i"
              selectable
            >
              <v-list-item-icon>
                <v-icon v-text="item.icon" />
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="item.title" />
                <v-list-item-subtitle v-text="item.value" />
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-row>
    </v-responsive>
  </v-sheet>
</template>

<script lang="ts">
import Vue from 'vue'

import system_information from '@/store/system-information'

export default Vue.extend({
  name: 'Processes',
  computed: {
    info(): Record<string, unknown>[] | undefined {
      const info = system_information.system?.info
      if (!info) {
        return undefined
      }

      return [
        {
          title: 'OS Type', value: `${info.system_name} ${info.os_version}`,
        },
        {
          title: 'Kernel', value: `${info.kernel_version}`,
        },
        {
          title: 'Hostname', value: `${info.host_name}`,
        },
      ]
    },
    avatar(): string | undefined {
      const info = system_information.system?.info
      const map = [
        { os: 'debian', icon: 'mdi-debian' },
        { os: 'arch', icon: 'mdi-arch' },
        { os: 'ubuntu', icon: 'mdi-ubuntu' },
        { os: 'apple', icon: 'mdi-apple' },
        { os: 'windows', icon: 'mdi-microsoft-windows' },
        { os: '', icon: 'mdi-linux' },
      ]

      return info
        ? map.find((item) => info.system_name.toLowerCase().includes(item.os))?.icon
        : 'mdi-help-circle'
    },
  },
})
</script>

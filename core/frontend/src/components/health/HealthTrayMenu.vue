<template>
  <v-menu
    :close-on-content-click="false"
    nudge-left="150"
    nudge-bottom="25"
  >
    <template
      #activator="{ on, attrs }"
    >
      <v-card
        elevation="0"
        color="transparent"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon
          v-if="disk_usage_high"
          class="px-1 blinking white-shadow"
          color="red"
          :title="`High disk usage high! (${disk_usage_percent.toFixed(1)}%) please clean up the disk`"
        >
          mdi-content-save-alert
        </v-icon>
        <v-icon
          v-if="cpu_temperature_limit_reached"
          class="px-1 blinking white-shadow"
          color="red"
          :title="`CPU temperature too high (${cpu_temperature} ºC), please cool down your vehicle!`"
        >
          mdi-thermometer
        </v-icon>
        <v-icon
          v-if="cpu_throttled"
          class="px-1 blinking white-shadow"
          color="red"
          :title="`CPU is throttled. Performance may be affected. Please check your power supply and cooling!`"
        >
          mdi-gauge-empty
        </v-icon>
        <v-icon
          v-if="cpu_undervoltage"
          class="px-1 blinking white-shadow"
          color="red"
          :title="`CPU has reported low voltage. Please check your power supply!`"
        >
          mdi-lightning-bolt
        </v-icon>
        <v-icon
          v-if="heartbeat_age() < 3000"
          class="px-1"
          :color="`rgba(255,255,255,${0.4 + (1000-heartbeat_age())/1000}`"
          title="MAVLink heartbeats arriving as expected"
        >
          mdi-heart-pulse
        </v-icon>
        <v-icon
          v-if="heartbeat_age() >= 3000"
          class="px-1 white-shadow"
          color="red"
          title="MAVLink heartbeat lost"
        >
          mdi-heart-broken
        </v-icon>
      </v-card>
    </template>

    <v-card
      elevation="1"
      width="250"
    >
      <v-container>
        <div>
          <table style="width: 100%">
            <tr>
              <td>Core Temperature:</td>
              <td>{{ cpu_temperature }} ºC</td>
            </tr>
            <tr>
              <td>Voltage:</td>
              <td>{{ battery_voltage }} V</td>
            </tr>
            <tr>
              <td>Current:</td>
              <td> {{ battery_current }} A</td>
            </tr>
          </table>
        </div>
      </v-container>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue'

import mavlink from '@/store/mavlink'
import system_information from '@/store/system-information'
import { RaspberryEventType } from '@/types/system-information/platform'
import mavlink_store_get from '@/utils/mavlink'

export default Vue.extend({
  name: 'HealthTrayMenu',
  computed: {
    cpu_temperature(): string {
      const temperature_sensors = system_information.system?.temperature
      const main_sensor = temperature_sensors?.find((sensor) => sensor.name === 'CPU')
      return main_sensor ? main_sensor.temperature.toFixed(1) : 'Loading..'
    },
    cpu_throttled() : boolean {
      const events = system_information.platform?.raspberry?.events
      const throttling = events?.occurring?.find((event) => [
        RaspberryEventType.FrequencyCapping,
        RaspberryEventType.Throttling,
      ].includes(event.type))
      return throttling !== undefined
    },
    cpu_undervoltage() : boolean {
      const events = system_information.platform?.raspberry?.events
      console.log(events)
      const undervoltage = events?.occurring?.find((event) => event.type === RaspberryEventType.UnderVoltage)
      return undervoltage !== undefined
    },
    cpu_temperature_limit_reached() : boolean {
      const events = system_information.platform?.raspberry?.events
      const temperature_limit = events?.occurring?.find((event) => event.type === RaspberryEventType.TemperatureLimit)
      return temperature_limit !== undefined
    },
    battery_voltage(): string {
      const voltage_microvolts = mavlink_store_get(mavlink, 'SYS_STATUS.messageData.voltage_battery') as number
      return (voltage_microvolts as number / 1000).toFixed(2)
    },

    battery_current(): string {
      const current_centiampere = mavlink_store_get(mavlink, 'SYS_STATUS.messageData.current_battery') as number
      return (current_centiampere as number / 100).toFixed(2)
    },
    disk_usage_percent(): number {
      const disks = system_information.system?.disk
      const main_disk = disks?.find((sensor) => sensor.mount_point === '/')
      return main_disk ? main_disk.available_space_B / main_disk.total_space_B / 0.01 : 0
    },
    disk_usage_high(): boolean {
      return this.disk_usage_percent > 85
    },
  },
  methods: {
    heartbeat_age(): number {
      const last_date = mavlink_store_get(mavlink, 'HEARTBEAT.timestamp') as Date
      if (last_date === undefined) {
        return 5000
      }
      return new Date().valueOf() - last_date.valueOf()
    },
  },
})
</script>

<style>
.blinking {
  animation: blinker 1s linear infinite;
}
@keyframes blinker {
  50% {
    opacity: 0.5;
  }
}

.white-shadow {
  text-shadow: 0 0 3px #FFF;
}
</style>

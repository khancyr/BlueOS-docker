<template>
  <v-card
    class="mx-auto my-6"
    max-width="1000"
    elevation="0"
  >
    <v-card-title>Video Manager</v-card-title>
    <v-container>
      <v-row dense>
        <v-col
          class="mr-2"
        >
          <v-card flat>
            <v-container
              v-if="are_video_devices_available && !updating_devices"
            >
              <video-device
                v-for="device in video_devices"
                :key="device.source"
                :device="device"
              />
            </v-container>
            <v-container v-else-if="updating_devices">
              <spinning-logo size="30%" />
            </v-container>
            <v-container
              v-else
              class="text-h6 text-center"
            >
              No video-devices available.
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <video-updater />
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'

import SpinningLogo from '@/components/common/SpinningLogo.vue'
import video from '@/store/video'
import { Device, Format, VideoEncodeType } from '@/types/video'

import VideoDevice from './VideoDevice.vue'
import VideoUpdater from './VideoUpdater.vue'

export default Vue.extend({
  name: 'VideoManager',
  components: {
    VideoDevice,
    VideoUpdater,
    SpinningLogo,
  },
  computed: {
    are_video_devices_available(): boolean {
      return this.video_devices.length !== 0
    },
    video_devices(): Device[] {
      // Check if a device provides H264
      function has_h264(device: Device): boolean {
        return device.formats.filter((format: Format) => format.encode === VideoEncodeType.H264).length !== 0
      }

      return video.available_devices
        .filter(has_h264)
        .sort((a: Device, b: Device) => a.name.localeCompare(b.name))
    },
    updating_devices(): boolean {
      return video.updating_devices
    },
  },
})
</script>

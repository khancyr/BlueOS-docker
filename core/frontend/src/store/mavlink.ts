import Vue from 'vue'
import {
  Action, getModule, Module, Mutation, VuexModule,
} from 'vuex-module-decorators'

import mavlink2rest from '@/libs/MAVLink2Rest'
import Listener from '@/libs/MAVLink2Rest/Listener'
import store from '@/store'
import { Dictionary } from '@/types/common'
import { MavlinkMessage } from '@/types/mavlink'

interface messsageRefreshRate {
  messageName: string
  refreshRate: number
}

@Module({
  dynamic: true,
  store,
  name: 'mavlink',
})

class MavlinkStore extends VuexModule {
  available_messages: Dictionary<MavlinkMessage> = {}

  message_listeners: Dictionary<Listener> = {}

  @Action({ commit: 'updateMessage' })
  setMessageRefreshRate(rate: messsageRefreshRate): void {
    const { messageName, refreshRate } = rate
    if (refreshRate < 0) {
      console.warn(`Invalid request rate requested for message ${messageName}@${refreshRate}Hz`)
    }

    mavlink2rest.requestMessageRate(messageName, refreshRate)
    // Remove any listener that has a lower frequency than requested
    if (messageName in this.message_listeners) {
      const currentRate = this.message_listeners[messageName].frequency
      if (currentRate > refreshRate) {
        console.warn(
          `Request with higher rate already registered for message ${messageName}@${currentRate}Hz vs ${refreshRate}Hz`,
        )
        return
      }
      this.message_listeners[messageName].discard()
    }

    // Create a new listener
    this.message_listeners[messageName] = mavlink2rest.startListening(messageName).setCallback((receivedMessage) => {
      this.updateMessage({
        messageName,
        messageData: receivedMessage,
        requestedMessageRate: refreshRate,
        timestamp: new Date(),
      })
    }).setFrequency(refreshRate)
  }

  @Mutation
  updateMessage(message: MavlinkMessage): void {
    if (message) {
      // TODO: Check if this is the best possible way to update `available_messages`
      // Reference: https://github.com/bluerobotics/companion-docker/pull/508#discussion_r718729077
      Vue.set(this.available_messages, message.messageName, message)
    }
  }
}

export { MavlinkStore }

const mavlink: MavlinkStore = getModule(MavlinkStore)
export default mavlink

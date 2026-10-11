import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import NotificationsView from "@/views/Settings/NotificationsView.vue";
import {
  SET_USER_SETTINGS,
  USER_NOTIFICATIONS,
  UPDATE_ACTIVITY_SETTING,
  USER_FRAGMENT_FEED_TOKENS,
} from "@/graphql/user";
import { CREATE_FEED_TOKEN, DELETE_FEED_TOKEN } from "@/graphql/feed_tokens";
import { CONFIG } from "@/graphql/config";
import {
  REGISTER_PUSH_MUTATION,
  UNREGISTER_PUSH_MUTATION,
} from "@/graphql/webPush";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

const generateWrapper = () => {
  const user_notif_mock = {
    data: {
      loggedUser: {
        id: 456789,
        locale: "en",
        feedTokens: [
          {
            token: "wxcvbqsdfghjkl",
            actor: {
              id: 123456,
            },
          },
        ],
      },
    },
  };
  const global_data = getMockClient([
    SET_USER_SETTINGS,
    [USER_NOTIFICATIONS, user_notif_mock],
    UPDATE_ACTIVITY_SETTING,
    USER_FRAGMENT_FEED_TOKENS,
    CREATE_FEED_TOKEN,
    DELETE_FEED_TOKEN,
    REGISTER_PUSH_MUTATION,
    UNREGISTER_PUSH_MUTATION,
    CONFIG,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(NotificationsView, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("NotificationsView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_7).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_8).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({});
    expect(requestHandlers.handle_8).toHaveBeenCalledWith({});
  });
});

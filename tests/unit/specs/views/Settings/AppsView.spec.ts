import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import AppsView from "@/views/Settings/AppsView.vue";
import {
  AUTH_AUTHORIZED_APPLICATIONS,
  REVOKED_AUTHORIZED_APPLICATION,
} from "@/graphql/application";
import { computed } from "vue";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  vi.mock("@/composition/apollo/actor", () => {
    return {
      useLoggedUser: () => {
        const error = null;
        const onError = null;
        const loading = null;
        const loggedUser = computed(() => {
          return {};
        });
        return { loggedUser, error, onError, loading };
      },
    };
  });

  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

const generateWrapper = () => {
  const global_data = getMockClient([
    AUTH_AUTHORIZED_APPLICATIONS,
    REVOKED_AUTHORIZED_APPLICATION,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(AppsView, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("AppsView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({});
  });
});

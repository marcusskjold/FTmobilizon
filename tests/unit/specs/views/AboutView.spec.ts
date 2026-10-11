import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../mocks/client";
import { htmlRemoveId } from "../common";
import AboutView from "@/views/AboutView.vue";
import { configMock } from "../mocks/config";
import { CONFIG } from "@/graphql/config";
import { MemberRole } from "@/types/enums";
import { computed } from "vue";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  vi.mock("@/composition/apollo/actor", () => {
    return {
      useCurrentUserClient: () => {
        const error = null;
        const loading = null;
        const currentUser = computed(() => {
          return {
            id: 123,
            email: "test@mobilizon.test",
            isLoggedIn: true,
            role: MemberRole.ADMINISTRATOR,
          };
        });
        return { currentUser, error, loading };
      },
    };
  });

  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

afterEach(async () => {
  await vi.dynamicImportSettled();
});

const generateWrapper = () => {
  const global_data = getMockClient([[CONFIG, configMock]]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(AboutView, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("AboutView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({});
  });
});

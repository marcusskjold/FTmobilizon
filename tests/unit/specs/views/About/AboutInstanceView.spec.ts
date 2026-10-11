import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import AboutInstanceView from "@/views/About/AboutInstanceView.vue";
import { STATISTICS } from "@/graphql/statistics";
import { ABOUT } from "@/graphql/config";
import { LANGUAGES_CODES } from "@/graphql/admin";
import { configMock } from "../../mocks/config";

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
  const statisticsMock = {
    data: {
      statistics: {
        __typename: "Statistics",
        numberOfComments: 10,
        numberOfEvents: 30418,
        numberOfGroups: 31,
        numberOfInstanceFollowers: 12,
        numberOfInstanceFollowings: 4,
        numberOfLocalComments: 84,
        numberOfLocalEvents: 30418,
        numberOfLocalGroups: 3,
        numberOfUsers: 2,
      },
    },
  };
  const languageCodeMock = {
    data: {
      languages: [
        {
          __typename: "Language",
          code: "fr",
          name: "French",
        },
        {
          __typename: "Language",
          code: "en",
          name: "English",
        },
      ],
    },
  };

  const global_data = getMockClient([
    [LANGUAGES_CODES, languageCodeMock],
    [ABOUT, configMock],
    [STATISTICS, statisticsMock],
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(AboutInstanceView, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("AboutInstanceView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      codes: ["fr"],
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({});
    expect(requestHandlers.handle_2).toHaveBeenCalledWith({});
  });
});

import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import ResourceFolder from "@/views/Resources/ResourceFolder.vue";
import {
  CREATE_RESOURCE,
  DELETE_RESOURCE,
  GET_RESOURCE,
  PREVIEW_RESOURCE_LINK,
  UPDATE_RESOURCE,
} from "@/graphql/resources";

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
  const resource_mock = {
    data: {
      resource: {
        __typename: "Resource",
        id: 123456,
        title: "azerty",
        summary: "AZ ER TY",
        children: {
          total: 0,
          elements: [],
        },
      },
    },
  };
  const global_data = getMockClient([
    CREATE_RESOURCE,
    DELETE_RESOURCE,
    PREVIEW_RESOURCE_LINK,
    [GET_RESOURCE, resource_mock],
    UPDATE_RESOURCE,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(ResourceFolder, {
    props: {
      path: "path-to-resource",
      preferredUsername: "testname",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("ResourceFolder", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
      path: "/path-to-resource",
      username: "testname",
    });
  });
});

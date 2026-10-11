import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import PostView from "@/views/Posts/PostView.vue";
import { DELETE_POST, FETCH_POST } from "@/graphql/post";
import { PERSON_MEMBERSHIPS } from "@/graphql/actor";

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
  const post_mock = {
    data: {
      post: {
        __typename: "Post",
        id: 123456,
        title: "azerty",
        slug: "wxcv",
        attributedTo: {
          preferredUsername: "testname",
        },
      },
    },
  };
  const global_data = getMockClient([
    PERSON_MEMBERSHIPS,
    DELETE_POST,
    [FETCH_POST, post_mock],
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(PostView, {
    props: {
      slug: "wwwwwwwwwwww",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("PostView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledWith({
      slug: "wwwwwwwwwwww",
    });
  });
});

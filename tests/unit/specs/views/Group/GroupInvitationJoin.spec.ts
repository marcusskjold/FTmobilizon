import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import GroupInvitationJoin from "@/views/Group/GroupInvitationJoin.vue";
import { GROUP_INVITATIONS_ACCEPT } from "@/graphql/invitations";
import { FETCH_GROUP_PUBLIC } from "@/graphql/group";
import { computed } from "vue";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  vi.mock("@/composition/apollo/actor", () => {
    return {
      useCurrentActorClient: () => {
        const error = null;
        const loading = null;
        const currentActor = computed(() => {
          return {
            id: 123,
            name: "test",
            domain: null,
            preferredUsername: "test",
          };
        });
        return { currentActor, error, loading };
      },
    };
  });

  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

const mock_group = {
  data: {
    group: {
      __typename: "Group",
      avatar: null,
      banner: null,
      domain: null,
      id: "123",
      manuallyApprovesFollowers: true,
      allowSeeParticipants: false,
      members: {
        __typename: "PaginatedMemberList",
        total: 1,
      },
      name: "ssss",
      openness: "MODERATED",
      organizedEvents: {
        __typename: "PaginatedEventList",
        elements: [],
        total: 0,
      },
      physicalAddress: null,
      posts: {
        __typename: "PaginatedPostList",
        elements: [],
        total: 0,
      },
      preferredUsername: "example",
      summary: null,
      suspended: false,
      type: "GROUP",
      url: "https://mobilizon.test/@example",
      visibility: "PUBLIC",
    },
  },
};

const generateWrapper = () => {
  const global_data = getMockClient([
    [FETCH_GROUP_PUBLIC, mock_group],
    GROUP_INVITATIONS_ACCEPT,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(GroupInvitationJoin, {
    props: {
      preferredUsername: "mygroup",
      token: "dhfqjkhesfkhqdkjsqfkjds",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("GroupInvitationJoin", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    wrapper.find("button").trigger("click");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      name: "mygroup",
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      actorId: 123,
      groupId: "123",
      token: "dhfqjkhesfkhqdkjsqfkjds",
    });
  });
});

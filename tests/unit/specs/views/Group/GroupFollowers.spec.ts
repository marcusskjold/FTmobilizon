import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import GroupFollowers from "@/views/Group/GroupFollowers.vue";
import { GROUP_FOLLOWERS, UPDATE_FOLLOWER } from "@/graphql/followers";
import { MemberRole } from "@/types/enums";
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
      usePersonStatusGroup: () => {
        const error = null;
        const loading = null;
        const person = computed(() => {
          return {
            memberships: {
              total: 1,
              elements: [
                {
                  role: MemberRole.ADMINISTRATOR,
                },
              ],
            },
          };
        });
        return { person, error, loading };
      },
    };
  });
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

const groupFollowersMock = {
  data: {
    group: {
      __typename: "Group",
      avatar: null,
      domain: null,
      id: "6",
      followers: {
        __typename: "PaginatedFollowerList",
        elements: [
          {
            __typename: "Member",
            actor: {
              __typename: "Person",
              avatar: null,
              domain: null,
              id: "7",
              name: "autre",
              preferredUsername: "autre",
              summary: null,
              type: "PERSON",
              url: "http://mobilizon.test/@autre",
            },
            id: "399a0f7a-7cfa-405d-8408-a3d1f316ab9b",
            insertedAt: "2025-11-12T14:57:27",
            approved: true,
            updatedAt: "2025-11-12T14:57:27",
          },
          {
            __typename: "Member",
            actor: {
              __typename: "Person",
              avatar: null,
              domain: null,
              id: "2",
              name: "Test",
              preferredUsername: "test",
              summary: null,
              type: "PERSON",
              url: "http://mobilizon.test/@test",
            },
            id: "95807e0a-7a7e-4403-90ea-d883e51e9db4",
            insertedAt: "2025-11-12T12:04:07",
            approved: true,
            updatedAt: "2025-11-12T12:04:07",
          },
        ],
        total: 2,
      },
      name: "mygroup",
      preferredUsername: "mygroup",
      summary: null,
      type: "GROUP",
      url: "http://mobilizon.test/@mygroup",
    },
  },
};

const generateWrapper = () => {
  const global_data = getMockClient([
    [GROUP_FOLLOWERS, groupFollowersMock],
    UPDATE_FOLLOWER,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(GroupFollowers, {
    props: {
      preferredUsername: "my-group",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("GroupFollowers", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      approved: true,
      followersLimit: 10,
      followersPage: 1,
      name: "my-group",
    });
  });
});

import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import GroupSettings from "@/views/Group/GroupSettings.vue";
import { FETCH_GROUP_PUBLIC, UPDATE_GROUP } from "@/graphql/group";
import { DELETE_GROUP } from "@/graphql/group";
import { computed } from "vue";
import { MemberRole } from "@/types/enums";

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

afterEach(async () => {
  await vi.dynamicImportSettled();
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
    UPDATE_GROUP,
    DELETE_GROUP,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(GroupSettings, {
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

describe("GroupSettings", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();

    wrapper.findAll('input[name="groupVisibility"]')[1].setChecked();
    wrapper.findAll('input[name="groupOpenness"]')[0].setChecked();
    wrapper.find("form").trigger("submit");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();

    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      name: "my-group",
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      allowSeeParticipants: false,
      id: "123",
      manuallyApprovesFollowers: true,
      name: "ssss",
      openness: "OPEN",
      physicalAddress: null,
      summary: null,
      visibility: "UNLISTED",
    });
  });
});

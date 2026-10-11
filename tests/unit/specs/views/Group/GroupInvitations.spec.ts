import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import GroupInvitations from "@/views/Group/GroupInvitations.vue";
import {
  GROUP_INVITATIONS_LIST,
  GROUP_INVITATIONS_DELETE,
  GROUP_INVITATIONS_CREATE,
  GROUP_INVITATIONS_UPDATE,
} from "@/graphql/invitations";
import { INVITE_MEMBER } from "@/graphql/member";
import { FETCH_GROUP_PUBLIC } from "@/graphql/group";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
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

const mock_invitations = {
  data: {
    listInvitations: [
      {
        label: "label1",
        token: "azerty",
      },
      {
        label: "label2",
        token: "qsdfg",
      },
    ],
  },
};

const generateWrapper = () => {
  const global_data = getMockClient([
    [FETCH_GROUP_PUBLIC, mock_group],
    [GROUP_INVITATIONS_LIST, mock_invitations],
    GROUP_INVITATIONS_DELETE,
    GROUP_INVITATIONS_CREATE,
    GROUP_INVITATIONS_UPDATE,
    INVITE_MEMBER,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(GroupInvitations, {
    props: {
      preferredUsername: "mygroup",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("GroupInvitations", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      name: "mygroup",
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      groupId: "123",
    });
  });

  it("Invite", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    wrapper
      .find('input[id="new-member-field"]')
      .setValue("invite@mobilizon.test");
    wrapper.find("form").trigger("submit");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_5).toHaveBeenCalledWith({
      groupId: "123",
      targetActorUsername: "invite@mobilizon.test",
    });
  });
});

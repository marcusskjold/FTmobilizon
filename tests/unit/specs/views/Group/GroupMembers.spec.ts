import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import GroupMembers from "@/views/Group/GroupMembers.vue";
import {
  INVITE_MEMBER,
  GROUP_MEMBERS,
  REMOVE_MEMBER,
  UPDATE_MEMBER,
  APPROVE_MEMBER,
} from "@/graphql/member";
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

const groupMembersMock = {
  data: {
    group: {
      __typename: "Group",
      avatar: null,
      domain: null,
      id: "6",
      members: {
        __typename: "PaginatedMemberList",
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
            role: "MEMBER",
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
            role: "ADMINISTRATOR",
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
    INVITE_MEMBER,
    [GROUP_MEMBERS, groupMembersMock],
    REMOVE_MEMBER,
    UPDATE_MEMBER,
    APPROVE_MEMBER,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(GroupMembers, {
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

describe("GroupMembers", () => {
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
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      groupName: "my-group",
      limit: 10,
      page: 1,
      roles: undefined,
    });
  });

  it("Remove", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    wrapper.find("button.o-button--danger").trigger("click");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledWith({
      groupId: "6",
      memberId: "399a0f7a-7cfa-405d-8408-a3d1f316ab9b",
    });
  });

  it("Promote", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    wrapper.findAll("button")[0].trigger("click");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledWith({
      memberId: "399a0f7a-7cfa-405d-8408-a3d1f316ab9b",
      oldRole: "MEMBER",
      role: "MODERATOR",
    });
  });

  it("Demote", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    wrapper.findAll("button")[2].trigger("click");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledWith({
      memberId: "95807e0a-7a7e-4403-90ea-d883e51e9db4",
      oldRole: "ADMINISTRATOR",
      role: "MODERATOR",
    });
  });

  /*  it("Invite", async () => {
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
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      groupId: "6",
      targetActorUsername: "invite@mobilizon.test",
    });
  });*/
});

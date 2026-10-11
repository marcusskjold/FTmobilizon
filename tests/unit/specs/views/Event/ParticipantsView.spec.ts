import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import ParticipantsView from "@/views/Event/ParticipantsView.vue";
import {
  EXPORT_EVENT_PARTICIPATIONS,
  PARTICIPANTS,
  UPDATE_PARTICIPANT,
} from "@/graphql/event";
import { computed } from "vue";
import { eventParticipantMock } from "../../mocks/event";

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

const generateWrapper = (eventExtra: any) => {
  const global_data = getMockClient([
    EXPORT_EVENT_PARTICIPATIONS,
    [PARTICIPANTS, eventExtra],
    UPDATE_PARTICIPANT,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(ParticipantsView, {
    props: {
      eventId: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("ParticipantsView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper(eventParticipantMock);
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
      roles: undefined,
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
  });

  it("Show event's group / user admin", async () => {
    const new_event = structuredClone(eventParticipantMock);
    new_event.data.event.attributedTo = {
      __typename: "Group",
      id: 123,
      uuid: "987654314231132",
      allowSeeParticipants: false,
      members: {
        __typename: "PaginatedMemberList",
        elements: [
          {
            __typename: "Member",
            actor: {
              __typename: "Person",
              id: "7",
            },
            id: "399a0f7a-7cfa-405d-8408-a3d1f316ab9b",
            role: "MEMBER",
          },
          {
            __typename: "Member",
            actor: {
              __typename: "Person",
              id: "123",
            },
            id: "95807e0a-7a7e-4403-90ea-d883e51e9db4",
            role: "ADMINISTRATOR",
          },
        ],
      },
    };
    const wrapper = generateWrapper(new_event);
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
      roles: undefined,
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
  });

  it("Show event's group / user member", async () => {
    const new_event = structuredClone(eventParticipantMock);
    new_event.data.event.attributedTo = {
      __typename: "Group",
      id: 123,
      uuid: "987654314231132",
      allowSeeParticipants: true,
      members: {
        __typename: "PaginatedMemberList",
        elements: [
          {
            __typename: "Member",
            actor: {
              __typename: "Person",
              id: "123",
            },
            id: "399a0f7a-7cfa-405d-8408-a3d1f316ab9b",
            role: "MEMBER",
          },
          {
            __typename: "Member",
            actor: {
              __typename: "Person",
              id: "2",
            },
            id: "95807e0a-7a7e-4403-90ea-d883e51e9db4",
            role: "ADMINISTRATOR",
          },
        ],
      },
    };

    const wrapper = generateWrapper(new_event);
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
      roles: undefined,
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
  });
});

import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import EventView from "@/views/Event/EventView.vue";
import { computed } from "vue";
import { EVENT_PERSON_PARTICIPATION, FETCH_EVENT } from "@/graphql/event";
import { MemberRole } from "@/types/enums";
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
      useCurrentUserIdentities: () => {
        const error = null;
        const loading = null;
        const identities = computed(() => {
          return [
            {
              __typename: "Person",
              avatar: null,
              domain: null,
              id: "2",
              name: "test",
              preferredUsername: "test",
              summary: null,
              type: "PERSON",
              url: "http://mobilizon.test/@test",
            },
          ];
        });
        return { identities, error, loading };
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

const generateWrapper = () => {
  const mock_participation = {
    data: {
      person: {
        participations: {
          __typename: "PaginatedParticipantList",
          elements: eventParticipantMock.data.event.participants.elements,
          total: eventParticipantMock.data.event.participants.elements.length,
        },
      },
    },
  };
  const global_data = getMockClient([
    [FETCH_EVENT, eventParticipantMock],
    [EVENT_PERSON_PARTICIPATION, mock_participation],
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(EventView, {
    props: { uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d" },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("EventView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      actorId: 123,
      eventId: "2",
    });
  });
});

import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import AnnouncementView from "@/views/Event/AnnouncementView.vue";
import { EVENT_CONVERSATIONS, FETCH_EVENT } from "@/graphql/event";
import { SEND_EVENT_PRIVATE_MESSAGE_MUTATION } from "@/graphql/conversations";
import { MemberRole } from "@/types/enums";
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

const generateWrapper = () => {
  const global_data = getMockClient([
    [FETCH_EVENT, eventParticipantMock],
    EVENT_CONVERSATIONS,
    SEND_EVENT_PRIVATE_MESSAGE_MUTATION,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(AnnouncementView, {
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

describe("AnnouncementView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      page: 1,
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
  });
});

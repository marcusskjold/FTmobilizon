import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import MyEventsView from "@/views/Event/MyEventsView.vue";
import {
  LOGGED_USER_PARTICIPATIONS,
  LOGGED_USER_UPCOMING_EVENTS,
} from "@/graphql/participant";
import { LOGGED_USER_DRAFTS } from "@/graphql/actor";
import { eventParticipantMock } from "../../mocks/event";

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
  const upcommingEventMock = {
    data: {
      loggedUser: {
        __typename: "User",
        followedGroupEvents: {
          __typename: "PaginatedFollowedGroupEvents",
          elements: [],
          total: 0,
        },
        id: "1",
        participations: {
          __typename: "PaginatedParticipantList",
          elements: [
            {
              __typename: "Participant",
              actor: {
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
              event: eventParticipantMock,
              id: "722704d3-1167-4e69-b28e-ae4f9c1f8acf",
              role: "CREATOR",
            },
          ],
          total: 1,
        },
      },
    },
  };
  const draftMock = {
    data: {
      loggedUser: {
        __typename: "User",
        drafts: {
          __typename: "PaginatedEventList",
          elements: [],
          total: 0,
        },
        id: "1",
      },
    },
  };
  const participationMock = {
    data: {
      loggedUser: {
        __typename: "User",
        drafts: {
          __typename: "PaginatedEventList",
          elements: [eventParticipantMock],
          total: 1,
        },
        id: "1",
      },
    },
  };
  const global_data = getMockClient([
    [LOGGED_USER_DRAFTS, draftMock],
    [LOGGED_USER_PARTICIPATIONS, participationMock],
    [LOGGED_USER_UPCOMING_EVENTS, upcommingEventMock],
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(MyEventsView, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("MyEventsView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
    });
    expect(requestHandlers.handle_2).toHaveBeenCalledWith({
      afterDateTime: "2022-02-02T00:00:00Z",
      limit: 10,
      page: 1,
    });
  });
});

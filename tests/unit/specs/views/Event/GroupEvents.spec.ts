import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import GroupEvents from "@/views/Event/GroupEvents.vue";
import { computed } from "vue";
import { MemberRole } from "@/types/enums";
import { PERSON_MEMBERSHIPS } from "@/graphql/actor";
import { FETCH_GROUP_EVENTS } from "@/graphql/event";

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
  const membershipsMock = {
    data: {
      person: {
        __typename: "Person",
        id: "2",
        memberships: {
          elements: [],
          total: 0,
        },
      },
    },
  };
  const groupsMock = {
    data: {
      group: {
        __typename: "Group",
        avatar: null,
        domain: null,
        id: "9",
        name: "Other group",
        organizedEvents: {
          __typename: "PaginatedEventList",
          elements: [
            {
              __typename: "Event",
              attributedTo: {
                __typename: "Group",
                allowSeeParticipants: true,
                avatar: null,
                domain: null,
                id: "9",
                manuallyApprovesFollowers: false,
                name: "Other group",
                openness: "MODERATED",
                preferredUsername: "other_group",
                summary: "<p>Other group</p>",
                suspended: false,
                type: "GROUP",
                url: "http://mobilizon.test/@other_group",
                visibility: "PUBLIC",
              },
              beginsOn: "2026-03-24T23:00:00Z",
              draft: false,
              id: "2",
              options: {
                __typename: "EventOptions",
                anonymousParticipation: false,
                attendees: [],
                commentModeration: "ALLOW_ALL",
                hideNumberOfParticipants: true,
                hideOrganizerWhenGroupEvent: false,
                isOnline: true,
                maximumAttendeeCapacity: 0,
                offers: [],
                participationConditions: null,
                program: null,
                remainingAttendeeCapacity: 0,
                showEndTime: false,
                showParticipationPrice: false,
                showRemainingAttendeeCapacity: false,
                showStartTime: false,
                timezone: null,
              },
              organizerActor: {
                __typename: "Person",
                avatar: null,
                domain: null,
                id: "2",
                name: "Mobilizon",
                preferredUsername: "mobilizon",
                summary: null,
                type: "PERSON",
                url: "http://mobilizon.test/@mobilizon",
              },
              participantStats: {
                __typename: "ParticipantStats",
                notApproved: 0,
                participant: 0,
              },
              physicalAddress: null,
              picture: null,
              status: "CONFIRMED",
              title: "AAAAAA",
              uuid: "37cb5393-ddf2-492e-ad6a-93e76bdbed95",
            },
            {
              __typename: "Event",
              attributedTo: {
                __typename: "Group",
                allowSeeParticipants: true,
                avatar: null,
                domain: null,
                id: "9",
                manuallyApprovesFollowers: false,
                name: "Other group",
                openness: "MODERATED",
                preferredUsername: "other_group",
                summary: "<p>Other group</p>",
                suspended: false,
                type: "GROUP",
                url: "http://mobilizon.test/@other_group",
                visibility: "PUBLIC",
              },
              beginsOn: "2026-03-24T23:00:00Z",
              draft: true,
              id: "3",
              options: {
                __typename: "EventOptions",
                anonymousParticipation: false,
                attendees: [],
                commentModeration: "ALLOW_ALL",
                hideNumberOfParticipants: true,
                hideOrganizerWhenGroupEvent: false,
                isOnline: true,
                maximumAttendeeCapacity: 0,
                offers: [],
                participationConditions: null,
                program: null,
                remainingAttendeeCapacity: 0,
                showEndTime: false,
                showParticipationPrice: false,
                showRemainingAttendeeCapacity: false,
                showStartTime: false,
                timezone: null,
              },
              organizerActor: {
                __typename: "Person",
                avatar: null,
                domain: null,
                id: "2",
                name: "Mobilizon",
                preferredUsername: "mobilizon",
                summary: null,
                type: "PERSON",
                url: "http://mobilizon.test/@mobilizon",
              },
              participantStats: {
                __typename: "ParticipantStats",
                notApproved: 0,
                participant: 0,
              },
              physicalAddress: null,
              picture: null,
              status: "CONFIRMED",
              title: "brouillon",
              uuid: "db1bd598-8fcc-4979-be6b-fd34cd5b100c",
            },
          ],
          total: 2,
        },
        preferredUsername: "other_group",
        summary: "<p>Other group</p>",
        type: "GROUP",
        url: "https://lolo1.sleto.fr/@other_group",
      },
    },
  };
  const global_data = getMockClient([
    [PERSON_MEMBERSHIPS, membershipsMock],
    [FETCH_GROUP_EVENTS, groupsMock],
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(GroupEvents, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("GroupEvents", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(2);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      id: 123,
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      afterDateTime: new Date("2022-02-02T02:04:00.000Z"),
      beforeDateTime: null,
      name: undefined,
      order: "BEGINS_ON",
      orderDirection: "ASC",
      organisedEventsLimit: 10,
      organisedEventsPage: 1,
    });
  });
});
